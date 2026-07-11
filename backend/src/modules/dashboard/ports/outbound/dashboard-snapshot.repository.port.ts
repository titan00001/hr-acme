export interface CountrySnapshot {
  country: string;
  baseCurrency: string;
  totalPayroll: string;
  headcount: number;
  updatedAt: Date;
}

export interface TrendSnapshot {
  effectiveDate: string;
  baseCurrency: string;
  totalPayroll: string;
  updatedAt: Date;
}

export interface DistributionSnapshot {
  bucketIndex: number;
  label: string;
  lowerBound: string;
  upperBound: string | null;
  count: number;
  updatedAt: Date;
}

export const DASHBOARD_SNAPSHOT_REPOSITORY = Symbol(
  'DASHBOARD_SNAPSHOT_REPOSITORY',
);

export interface DashboardSnapshotRepositoryPort {
  findAllCountrySnapshots(): Promise<CountrySnapshot[]>;
  findTrendSnapshots(from?: string, to?: string): Promise<TrendSnapshot[]>;
  findAllDistributionSnapshots(): Promise<DistributionSnapshot[]>;

  adjustCountry(
    country: string,
    baseCurrency: string,
    payrollDelta: number,
    headcountDelta: number,
  ): Promise<void>;

  adjustTrend(
    effectiveDate: string,
    baseCurrency: string,
    payrollDelta: number,
  ): Promise<void>;

  adjustDistributionBucket(
    bucketIndex: number,
    countDelta: number,
  ): Promise<void>;

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
  }): Promise<void>;
}
