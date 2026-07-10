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
  CurrencyBreakdownDto,
  DashboardSummaryDto,
  DistributionBucketDto,
  RecentRevisionDto,
  TrendPointDto,
} from '../adapters/inbound/dashboard-response.dto';
import {
  DASHBOARD_QUERY,
  type ActiveCurrentSalaryRow,
  type DashboardQueryPort,
} from '../ports/outbound/dashboard-query.port';
import { assignBucketIndex, buildBuckets } from './build-buckets';

const DISTRIBUTION_BUCKET_COUNT = 5;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_QUERY)
    private readonly dashboardQuery: DashboardQueryPort,
    private readonly currencyService: CurrencyService,
    private readonly settingsService: SettingsService,
  ) {}

  async getSummary(query: DashboardQueryDto): Promise<DashboardSummaryDto> {
    const displayCurrency = await this.resolveDisplayCurrency(
      query.displayCurrency,
    );
    const rows = await this.dashboardQuery.findActiveCurrentSalaries();
    const activeEmployeeCount = rows.length;

    if (displayCurrency === DISPLAY_CURRENCY_ORIGINAL) {
      const byCurrency = this.groupByCurrency(rows);
      return {
        displayCurrency,
        activeEmployeeCount,
        totalPayroll: null,
        averageCompensation: null,
        byCurrency,
      };
    }

    const amounts = await this.convertRows(rows, displayCurrency);
    const totalPayroll = amounts.reduce((sum, value) => sum + value, 0);
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
    const displayCurrency = await this.resolveDisplayCurrency(
      query.displayCurrency,
    );
    const rows = await this.dashboardQuery.findActiveCurrentSalaries();

    if (displayCurrency === DISPLAY_CURRENCY_ORIGINAL) {
      const map = new Map<string, CountryBreakdownDto>();
      for (const row of rows) {
        const key = `${row.country}::${row.currency}`;
        const current = map.get(key) ?? {
          country: row.country,
          payroll: 0,
          headcount: 0,
          currency: row.currency,
        };
        current.payroll += parseMoney(row.totalCompensation);
        current.headcount += 1;
        map.set(key, current);
      }
      return [...map.values()]
        .map((row) => ({ ...row, payroll: roundMoney(row.payroll) }))
        .sort((a, b) => a.country.localeCompare(b.country));
    }

    const map = new Map<string, CountryBreakdownDto>();
    for (const row of rows) {
      const converted = await this.currencyService.normalize(
        parseMoney(row.totalCompensation),
        row.currency,
        displayCurrency,
      );
      const current = map.get(row.country) ?? {
        country: row.country,
        payroll: 0,
        headcount: 0,
        currency: displayCurrency,
      };
      current.payroll += converted;
      current.headcount += 1;
      map.set(row.country, current);
    }

    return [...map.values()]
      .map((row) => ({ ...row, payroll: roundMoney(row.payroll) }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }

  async getDistribution(
    query: DashboardQueryDto,
  ): Promise<DistributionBucketDto[]> {
    const displayCurrency = await this.resolveDisplayCurrency(
      query.displayCurrency,
    );
    const rows = await this.dashboardQuery.findActiveCurrentSalaries();

    if (rows.length === 0) {
      return [];
    }

    const amounts =
      displayCurrency === DISPLAY_CURRENCY_ORIGINAL
        ? rows.map((row) => parseMoney(row.totalCompensation))
        : await this.convertRows(rows, displayCurrency);

    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const buckets = buildBuckets(min, max, DISTRIBUTION_BUCKET_COUNT);
    const counts = buckets.map(() => 0);

    for (const amount of amounts) {
      const index = assignBucketIndex(amount, buckets);
      counts[index] = (counts[index] ?? 0) + 1;
    }

    return buckets.map((bucket, index) => ({
      range: bucket.label,
      count: counts[index] ?? 0,
    }));
  }

  async getTrends(query: DashboardTrendsQueryDto): Promise<TrendPointDto[]> {
    if (query.from > query.to) {
      throw new BadRequestException('`from` must be on or before `to`');
    }

    const displayCurrency = await this.resolveDisplayCurrency(
      query.displayCurrency,
    );
    const rows = await this.dashboardQuery.findActiveCommittedInRange(
      query.from,
      query.to,
    );

    if (displayCurrency === DISPLAY_CURRENCY_ORIGINAL) {
      const map = new Map<string, TrendPointDto>();
      for (const row of rows) {
        const key = `${row.effectiveDate}::${row.currency}`;
        const current = map.get(key) ?? {
          date: row.effectiveDate,
          totalPayroll: 0,
          currency: row.currency,
        };
        current.totalPayroll += parseMoney(row.totalCompensation);
        map.set(key, current);
      }
      return [...map.values()]
        .map((point) => ({
          ...point,
          totalPayroll: roundMoney(point.totalPayroll),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const map = new Map<string, number>();
    for (const row of rows) {
      const converted = await this.currencyService.normalize(
        parseMoney(row.totalCompensation),
        row.currency,
        displayCurrency,
      );
      map.set(row.effectiveDate, (map.get(row.effectiveDate) ?? 0) + converted);
    }

    return [...map.entries()]
      .map(([date, totalPayroll]) => ({
        date,
        totalPayroll: roundMoney(totalPayroll),
        currency: displayCurrency,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
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

  private async resolveDisplayCurrency(raw?: string): Promise<string> {
    const value = (raw ?? DISPLAY_CURRENCY_ORIGINAL).trim();
    if (value.toLowerCase() === DISPLAY_CURRENCY_ORIGINAL) {
      return DISPLAY_CURRENCY_ORIGINAL;
    }

    const normalized = value.toUpperCase();
    const supported = await this.settingsService.getCurrencies();
    if (!supported.includes(normalized)) {
      throw new BadRequestException(
        `displayCurrency ${normalized} is not supported`,
      );
    }
    return normalized;
  }

  private groupByCurrency(
    rows: ActiveCurrentSalaryRow[],
  ): CurrencyBreakdownDto[] {
    const map = new Map<string, CurrencyBreakdownDto>();
    for (const row of rows) {
      const current = map.get(row.currency) ?? {
        currency: row.currency,
        totalPayroll: 0,
        averageCompensation: 0,
        employeeCount: 0,
      };
      current.totalPayroll += parseMoney(row.totalCompensation);
      current.employeeCount += 1;
      map.set(row.currency, current);
    }

    return [...map.values()]
      .map((row) => ({
        currency: row.currency,
        employeeCount: row.employeeCount,
        totalPayroll: roundMoney(row.totalPayroll),
        averageCompensation: roundMoney(row.totalPayroll / row.employeeCount),
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  private async convertRows(
    rows: ActiveCurrentSalaryRow[],
    displayCurrency: string,
  ): Promise<number[]> {
    const amounts: number[] = [];
    for (const row of rows) {
      amounts.push(
        await this.currencyService.normalize(
          parseMoney(row.totalCompensation),
          row.currency,
          displayCurrency,
        ),
      );
    }
    return amounts;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
