import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CurrencyService } from '../../../common/currency/currency.service';
import { getPaginationMeta } from '../../../common/pagination/pagination.utils';
import { PaginatedResponseDto } from '../../../common/pagination/paginated-response.dto';
import { SettingsService } from '../../settings/application/settings.service';
import { parseMoney } from '../../salary/application/compute-total-compensation';
import {
  DISPLAY_CURRENCY_ORIGINAL,
  DashboardQueryDto,
  DashboardRecentQueryDto,
  DashboardTrendsQueryDto,
} from '../adapters/inbound/dashboard-query.dto';
import {
  CountryBreakdownDto,
  DashboardSummaryDto,
  DistributionBucketDto,
  RecentRevisionDto,
  TrendPointDto,
} from '../adapters/inbound/dashboard-response.dto';
import {
  DASHBOARD_QUERY,
  type DashboardQueryPort,
} from '../ports/outbound/dashboard-query.port';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type CountrySnapshot,
  type DashboardSnapshotRepositoryPort,
} from '../ports/outbound/dashboard-snapshot.repository.port';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_SNAPSHOT_REPOSITORY)
    private readonly snapshots: DashboardSnapshotRepositoryPort,
    @Inject(DASHBOARD_QUERY)
    private readonly dashboardQuery: DashboardQueryPort,
    private readonly currencyService: CurrencyService,
    private readonly settingsService: SettingsService,
  ) {}

  async getSummary(query: DashboardQueryDto): Promise<DashboardSummaryDto> {
    const { displayCurrency, baseCurrency, fxRate, useOriginal } =
      await this.resolveFx(query.displayCurrency);
    const rows = await this.snapshots.findAllCountrySnapshots();
    const activeEmployeeCount = rows.reduce(
      (sum, row) => sum + row.headcount,
      0,
    );
    const totalBase = sumPayroll(rows);

    if (useOriginal) {
      return {
        displayCurrency,
        activeEmployeeCount,
        totalPayroll: null,
        averageCompensation: null,
        byCurrency: [
          {
            currency: baseCurrency,
            employeeCount: activeEmployeeCount,
            totalPayroll: roundMoney(totalBase),
            averageCompensation:
              activeEmployeeCount === 0
                ? 0
                : roundMoney(totalBase / activeEmployeeCount),
          },
        ],
      };
    }

    const totalPayroll = totalBase * fxRate;
    const averageCompensation =
      activeEmployeeCount === 0 ? 0 : totalPayroll / activeEmployeeCount;

    return {
      displayCurrency,
      activeEmployeeCount,
      totalPayroll: roundMoney(totalPayroll),
      averageCompensation: roundMoney(averageCompensation),
    };
  }

  async getByCountry(query: DashboardQueryDto): Promise<CountryBreakdownDto[]> {
    const { displayCurrency, baseCurrency, fxRate, useOriginal } =
      await this.resolveFx(query.displayCurrency);
    const rows = await this.snapshots.findAllCountrySnapshots();
    const currency = useOriginal ? baseCurrency : displayCurrency;

    return rows
      .map((row) => ({
        country: row.country,
        headcount: row.headcount,
        currency,
        payroll: roundMoney(parseMoney(row.totalPayroll) * fxRate),
      }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }

  async getDistribution(
    query: DashboardQueryDto,
  ): Promise<DistributionBucketDto[]> {
    const { fxRate, useOriginal, baseCurrency, displayCurrency } =
      await this.resolveFx(query.displayCurrency);
    const rows = await this.snapshots.findAllDistributionSnapshots();

    return rows.map((row) => {
      const lower = parseMoney(row.lowerBound) * fxRate;
      const upper =
        row.upperBound === null ? null : parseMoney(row.upperBound) * fxRate;
      const unit = useOriginal ? baseCurrency : displayCurrency;
      return {
        range: formatBucketRange(lower, upper, unit),
        count: row.count,
      };
    });
  }

  async getTrends(query: DashboardTrendsQueryDto): Promise<TrendPointDto[]> {
    if (query.from > query.to) {
      throw new BadRequestException('`from` must be on or before `to`');
    }

    const { displayCurrency, baseCurrency, fxRate, useOriginal } =
      await this.resolveFx(query.displayCurrency);
    const rows = await this.snapshots.findTrendSnapshots(query.from, query.to);
    const currency = useOriginal ? baseCurrency : displayCurrency;

    return rows.map((row) => ({
      date: row.effectiveDate,
      totalPayroll: roundMoney(parseMoney(row.totalPayroll) * fxRate),
      currency,
    }));
  }

  async getRecentRevisions(
    query: DashboardRecentQueryDto,
  ): Promise<PaginatedResponseDto<RecentRevisionDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.dashboardQuery.findRecentRevisions(page, limit);
    const meta = getPaginationMeta(result.total, page, limit);

    return {
      data: result.data.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        effectiveDate: row.effectiveDate,
        currency: row.currency,
        totalCompensation: row.totalCompensation,
        reason: row.reason,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      })),
      ...meta,
    };
  }

  private async resolveFx(raw?: string): Promise<{
    displayCurrency: string;
    baseCurrency: string;
    fxRate: number;
    useOriginal: boolean;
  }> {
    const settings = await this.settingsService.get();
    const baseCurrency = settings.baseCurrency;
    const value = (raw ?? DISPLAY_CURRENCY_ORIGINAL).trim();

    if (value.toLowerCase() === DISPLAY_CURRENCY_ORIGINAL) {
      return {
        displayCurrency: DISPLAY_CURRENCY_ORIGINAL,
        baseCurrency,
        fxRate: 1,
        useOriginal: true,
      };
    }

    const normalized = value.toUpperCase();
    const supported = settings.supportedCurrencies;
    if (!supported.includes(normalized)) {
      throw new BadRequestException(
        `displayCurrency ${normalized} is not supported`,
      );
    }

    const fxRate =
      normalized === baseCurrency
        ? 1
        : await this.currencyService.normalize(1, baseCurrency, normalized);

    return {
      displayCurrency: normalized,
      baseCurrency,
      fxRate,
      useOriginal: false,
    };
  }
}

function sumPayroll(rows: CountrySnapshot[]): number {
  return rows.reduce((sum, row) => sum + parseMoney(row.totalPayroll), 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatBucketRange(
  lower: number,
  upper: number | null,
  currency: string,
): string {
  const format = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`;
  if (upper === null) {
    return `${format(lower)}+ (${currency})`;
  }
  return `${format(lower)}–${format(upper)} (${currency})`;
}
