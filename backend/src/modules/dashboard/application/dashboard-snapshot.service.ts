import { Inject, Injectable, Logger } from '@nestjs/common';
import { CurrencyService } from '../../../common/currency/currency.service';
import { parseMoney } from '../../salary/application/compute-total-compensation';
import { SettingsService } from '../../settings/application/settings.service';
import { assignBucketIndex } from '../domain/assign-bucket';
import { DISTRIBUTION_BUCKETS } from '../domain/dashboard.constants';
import {
  DASHBOARD_QUERY,
  type DashboardQueryPort,
} from '../ports/outbound/dashboard-query.port';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type DashboardSnapshotRepositoryPort,
} from '../ports/outbound/dashboard-snapshot.repository.port';

export interface SnapshotCommitInput {
  country: string;
  effectiveDate: string;
  newCurrency: string;
  newTotalCompensation: string;
  previousCurrency?: string | null;
  previousTotalCompensation?: string | null;
}

export interface SnapshotRelieveInput {
  country: string;
  currency: string | null;
  totalCompensation: string | null;
}

@Injectable()
export class DashboardSnapshotService {
  private readonly logger = new Logger(DashboardSnapshotService.name);

  constructor(
    @Inject(DASHBOARD_SNAPSHOT_REPOSITORY)
    private readonly snapshots: DashboardSnapshotRepositoryPort,
    @Inject(DASHBOARD_QUERY)
    private readonly dashboardQuery: DashboardQueryPort,
    private readonly currencyService: CurrencyService,
    private readonly settingsService: SettingsService,
  ) {}

  async onEmployeeCreated(country: string): Promise<void> {
    const baseCurrency = (await this.settingsService.get()).baseCurrency;
    await this.snapshots.adjustCountry(country, baseCurrency, 0, 1);
  }

  async onEmployeeRelieved(input: SnapshotRelieveInput): Promise<void> {
    const baseCurrency = (await this.settingsService.get()).baseCurrency;
    let payrollDelta = 0;
    let bucketIndex: number | null = null;

    if (input.currency && input.totalCompensation) {
      const amountBase = await this.toBase(
        parseMoney(input.totalCompensation),
        input.currency,
        baseCurrency,
      );
      payrollDelta = -amountBase;
      bucketIndex = assignBucketIndex(amountBase);
    }

    await this.snapshots.adjustCountry(
      input.country,
      baseCurrency,
      payrollDelta,
      -1,
    );

    if (bucketIndex !== null) {
      await this.snapshots.adjustDistributionBucket(bucketIndex, -1);
    }
  }

  async onSalaryCommitted(input: SnapshotCommitInput): Promise<void> {
    const baseCurrency = (await this.settingsService.get()).baseCurrency;
    const newAmountBase = await this.toBase(
      parseMoney(input.newTotalCompensation),
      input.newCurrency,
      baseCurrency,
    );

    let previousAmountBase = 0;
    if (input.previousCurrency && input.previousTotalCompensation) {
      previousAmountBase = await this.toBase(
        parseMoney(input.previousTotalCompensation),
        input.previousCurrency,
        baseCurrency,
      );
    }

    const payrollDelta = newAmountBase - previousAmountBase;
    await this.snapshots.adjustCountry(
      input.country,
      baseCurrency,
      payrollDelta,
      0,
    );

    await this.snapshots.adjustTrend(
      input.effectiveDate,
      baseCurrency,
      newAmountBase,
    );

    const newBucket = assignBucketIndex(newAmountBase);
    if (previousAmountBase > 0) {
      const oldBucket = assignBucketIndex(previousAmountBase);
      if (oldBucket !== newBucket) {
        await this.snapshots.adjustDistributionBucket(oldBucket, -1);
        await this.snapshots.adjustDistributionBucket(newBucket, 1);
      }
    } else {
      await this.snapshots.adjustDistributionBucket(newBucket, 1);
    }

    this.logger.log(
      `Dashboard snapshots updated for commit country=${input.country} delta=${payrollDelta.toFixed(2)}`,
    );
  }

  async reconcile(): Promise<{ countries: number; trends: number }> {
    const baseCurrency = (await this.settingsService.get()).baseCurrency;
    const active = await this.dashboardQuery.findActiveCurrentSalaries();
    const headcounts = await this.dashboardQuery.findActiveHeadcountByCountry();
    const countryMap = new Map<
      string,
      { totalPayroll: number; headcount: number }
    >();
    const distributionCounts = DISTRIBUTION_BUCKETS.map(() => 0);

    for (const row of headcounts) {
      countryMap.set(row.country, {
        totalPayroll: 0,
        headcount: row.headcount,
      });
    }

    for (const row of active) {
      const amountBase = await this.toBase(
        parseMoney(row.totalCompensation),
        row.currency,
        baseCurrency,
      );
      const current = countryMap.get(row.country) ?? {
        totalPayroll: 0,
        headcount: 0,
      };
      current.totalPayroll += amountBase;
      countryMap.set(row.country, current);

      const bucket = assignBucketIndex(amountBase);
      distributionCounts[bucket] = (distributionCounts[bucket] ?? 0) + 1;
    }

    const trendsMap = new Map<string, number>();
    const trendRows = await this.dashboardQuery.findActiveCommittedInRange(
      '1970-01-01',
      '2999-12-31',
    );
    for (const row of trendRows) {
      const amountBase = await this.toBase(
        parseMoney(row.totalCompensation),
        row.currency,
        baseCurrency,
      );
      trendsMap.set(
        row.effectiveDate,
        (trendsMap.get(row.effectiveDate) ?? 0) + amountBase,
      );
    }

    await this.snapshots.replaceAllSnapshots({
      countries: [...countryMap.entries()].map(([country, value]) => ({
        country,
        baseCurrency,
        totalPayroll: value.totalPayroll,
        headcount: value.headcount,
      })),
      trends: [...trendsMap.entries()].map(([effectiveDate, totalPayroll]) => ({
        effectiveDate,
        baseCurrency,
        totalPayroll,
      })),
      distributionCounts,
    });

    this.logger.log(
      `Dashboard reconcile complete: countries=${countryMap.size} trends=${trendsMap.size}`,
    );

    return { countries: countryMap.size, trends: trendsMap.size };
  }

  private async toBase(
    amount: number,
    fromCurrency: string,
    baseCurrency: string,
  ): Promise<number> {
    return this.currencyService.normalize(amount, fromCurrency, baseCurrency);
  }
}
