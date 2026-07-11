import { Injectable } from '@nestjs/common';
import { DISTRIBUTION_BUCKETS } from '../../src/modules/dashboard/domain/dashboard.constants';
import type {
  CountrySnapshot,
  DashboardSnapshotRepositoryPort,
  DistributionSnapshot,
  TrendSnapshot,
} from '../../src/modules/dashboard/ports/outbound/dashboard-snapshot.repository.port';

function money(value: number): string {
  return value.toFixed(4);
}

function parseMoney(value: string): number {
  return Number(value);
}

@Injectable()
export class InMemoryDashboardSnapshotRepository implements DashboardSnapshotRepositoryPort {
  private countries = new Map<string, CountrySnapshot>();
  private trends = new Map<string, TrendSnapshot>();
  private distribution = new Map<number, DistributionSnapshot>();

  constructor() {
    this.resetDistribution();
  }

  clear(): void {
    this.countries.clear();
    this.trends.clear();
    this.resetDistribution();
  }

  private resetDistribution(): void {
    this.distribution.clear();
    const now = new Date();
    for (const bucket of DISTRIBUTION_BUCKETS) {
      this.distribution.set(bucket.index, {
        bucketIndex: bucket.index,
        label: bucket.label,
        lowerBound: money(bucket.lowerBound),
        upperBound:
          bucket.upperBound === null ? null : money(bucket.upperBound),
        count: 0,
        updatedAt: now,
      });
    }
  }

  private countryKey(country: string, baseCurrency: string): string {
    return `${country}::${baseCurrency}`;
  }

  private trendKey(effectiveDate: string, baseCurrency: string): string {
    return `${effectiveDate}::${baseCurrency}`;
  }

  findAllCountrySnapshots(): Promise<CountrySnapshot[]> {
    return Promise.resolve(
      [...this.countries.values()].sort((a, b) =>
        a.country.localeCompare(b.country),
      ),
    );
  }

  findTrendSnapshots(from?: string, to?: string): Promise<TrendSnapshot[]> {
    let rows = [...this.trends.values()];
    if (from) {
      rows = rows.filter((row) => row.effectiveDate >= from);
    }
    if (to) {
      rows = rows.filter((row) => row.effectiveDate <= to);
    }
    return Promise.resolve(
      rows.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)),
    );
  }

  findAllDistributionSnapshots(): Promise<DistributionSnapshot[]> {
    return Promise.resolve(
      [...this.distribution.values()].sort(
        (a, b) => a.bucketIndex - b.bucketIndex,
      ),
    );
  }

  adjustCountry(
    country: string,
    baseCurrency: string,
    payrollDelta: number,
    headcountDelta: number,
  ): Promise<void> {
    const key = this.countryKey(country, baseCurrency);
    const existing = this.countries.get(key);
    const now = new Date();
    if (!existing) {
      this.countries.set(key, {
        country,
        baseCurrency,
        totalPayroll: money(Math.max(0, payrollDelta)),
        headcount: Math.max(0, headcountDelta),
        updatedAt: now,
      });
      return Promise.resolve();
    }

    this.countries.set(key, {
      ...existing,
      totalPayroll: money(
        Math.max(0, parseMoney(existing.totalPayroll) + payrollDelta),
      ),
      headcount: Math.max(0, existing.headcount + headcountDelta),
      updatedAt: now,
    });
    return Promise.resolve();
  }

  adjustTrend(
    effectiveDate: string,
    baseCurrency: string,
    payrollDelta: number,
  ): Promise<void> {
    const key = this.trendKey(effectiveDate, baseCurrency);
    const existing = this.trends.get(key);
    const now = new Date();
    if (!existing) {
      if (payrollDelta <= 0) {
        return Promise.resolve();
      }
      this.trends.set(key, {
        effectiveDate,
        baseCurrency,
        totalPayroll: money(payrollDelta),
        updatedAt: now,
      });
      return Promise.resolve();
    }

    const next = Math.max(0, parseMoney(existing.totalPayroll) + payrollDelta);
    if (next === 0) {
      this.trends.delete(key);
      return Promise.resolve();
    }

    this.trends.set(key, {
      ...existing,
      totalPayroll: money(next),
      updatedAt: now,
    });
    return Promise.resolve();
  }

  adjustDistributionBucket(
    bucketIndex: number,
    countDelta: number,
  ): Promise<void> {
    const existing = this.distribution.get(bucketIndex);
    if (!existing) {
      return Promise.resolve();
    }
    this.distribution.set(bucketIndex, {
      ...existing,
      count: Math.max(0, existing.count + countDelta),
      updatedAt: new Date(),
    });
    return Promise.resolve();
  }

  replaceAllSnapshots(input: {
    countries: Array<{
      country: string;
      baseCurrency: string;
      totalPayroll: number;
      headcount: number;
    }>;
    trends: Array<{
      effectiveDate: string;
      baseCurrency: string;
      totalPayroll: number;
    }>;
    distributionCounts: number[];
  }): Promise<void> {
    this.countries.clear();
    this.trends.clear();
    const now = new Date();

    for (const row of input.countries) {
      this.countries.set(this.countryKey(row.country, row.baseCurrency), {
        country: row.country,
        baseCurrency: row.baseCurrency,
        totalPayroll: money(row.totalPayroll),
        headcount: row.headcount,
        updatedAt: now,
      });
    }

    for (const row of input.trends) {
      this.trends.set(this.trendKey(row.effectiveDate, row.baseCurrency), {
        effectiveDate: row.effectiveDate,
        baseCurrency: row.baseCurrency,
        totalPayroll: money(row.totalPayroll),
        updatedAt: now,
      });
    }

    for (const bucket of DISTRIBUTION_BUCKETS) {
      const existing = this.distribution.get(bucket.index)!;
      this.distribution.set(bucket.index, {
        ...existing,
        label: bucket.label,
        lowerBound: money(bucket.lowerBound),
        upperBound:
          bucket.upperBound === null ? null : money(bucket.upperBound),
        count: input.distributionCounts[bucket.index] ?? 0,
        updatedAt: now,
      });
    }

    return Promise.resolve();
  }
}
