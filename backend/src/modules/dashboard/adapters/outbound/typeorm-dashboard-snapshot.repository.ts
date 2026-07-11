import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DISTRIBUTION_BUCKETS } from '../../domain/dashboard.constants';
import type {
  CountrySnapshot,
  DashboardSnapshotRepositoryPort,
  DistributionSnapshot,
  TrendSnapshot,
} from '../../ports/outbound/dashboard-snapshot.repository.port';
import { DashboardCountrySnapshotEntity } from './dashboard-country-snapshot.entity';
import { DashboardDistributionSnapshotEntity } from './dashboard-distribution-snapshot.entity';
import { DashboardTrendSnapshotEntity } from './dashboard-trend-snapshot.entity';

function money(value: number): string {
  return value.toFixed(4);
}

function parseMoney(value: string): number {
  return Number(value);
}

@Injectable()
export class TypeOrmDashboardSnapshotRepository implements DashboardSnapshotRepositoryPort {
  constructor(
    @InjectRepository(DashboardCountrySnapshotEntity)
    private readonly countryRepo: Repository<DashboardCountrySnapshotEntity>,
    @InjectRepository(DashboardTrendSnapshotEntity)
    private readonly trendRepo: Repository<DashboardTrendSnapshotEntity>,
    @InjectRepository(DashboardDistributionSnapshotEntity)
    private readonly distributionRepo: Repository<DashboardDistributionSnapshotEntity>,
  ) {}

  async findAllCountrySnapshots(): Promise<CountrySnapshot[]> {
    const rows = await this.countryRepo.find({
      order: { country: 'ASC' },
    });
    return rows.map((row) => ({
      country: row.country,
      baseCurrency: row.baseCurrency,
      totalPayroll: row.totalPayroll,
      headcount: row.headcount,
      updatedAt: row.updatedAt,
    }));
  }

  async findTrendSnapshots(
    from?: string,
    to?: string,
  ): Promise<TrendSnapshot[]> {
    const qb = this.trendRepo
      .createQueryBuilder('trend')
      .orderBy('trend.effectiveDate', 'ASC');

    if (from) {
      qb.andWhere('trend.effectiveDate >= :from', { from });
    }
    if (to) {
      qb.andWhere('trend.effectiveDate <= :to', { to });
    }

    const rows = await qb.getMany();
    return rows.map((row) => ({
      effectiveDate:
        typeof row.effectiveDate === 'string'
          ? row.effectiveDate
          : new Date(row.effectiveDate).toISOString().slice(0, 10),
      baseCurrency: row.baseCurrency,
      totalPayroll: row.totalPayroll,
      updatedAt: row.updatedAt,
    }));
  }

  async findAllDistributionSnapshots(): Promise<DistributionSnapshot[]> {
    const rows = await this.distributionRepo.find({
      order: { bucketIndex: 'ASC' },
    });
    return rows.map((row) => ({
      bucketIndex: row.bucketIndex,
      label: row.label,
      lowerBound: row.lowerBound,
      upperBound: row.upperBound,
      count: row.count,
      updatedAt: row.updatedAt,
    }));
  }

  async adjustCountry(
    country: string,
    baseCurrency: string,
    payrollDelta: number,
    headcountDelta: number,
  ): Promise<void> {
    const existing = await this.countryRepo.findOne({
      where: { country, baseCurrency },
    });

    if (!existing) {
      await this.countryRepo.save({
        country,
        baseCurrency,
        totalPayroll: money(Math.max(0, payrollDelta)),
        headcount: Math.max(0, headcountDelta),
      });
      return;
    }

    existing.totalPayroll = money(
      Math.max(0, parseMoney(existing.totalPayroll) + payrollDelta),
    );
    existing.headcount = Math.max(0, existing.headcount + headcountDelta);
    await this.countryRepo.save(existing);
  }

  async adjustTrend(
    effectiveDate: string,
    baseCurrency: string,
    payrollDelta: number,
  ): Promise<void> {
    const existing = await this.trendRepo.findOne({
      where: { effectiveDate, baseCurrency },
    });

    if (!existing) {
      if (payrollDelta <= 0) {
        return;
      }
      await this.trendRepo.save({
        effectiveDate,
        baseCurrency,
        totalPayroll: money(payrollDelta),
      });
      return;
    }

    const next = Math.max(0, parseMoney(existing.totalPayroll) + payrollDelta);
    if (next === 0) {
      await this.trendRepo.delete({ effectiveDate, baseCurrency });
      return;
    }

    existing.totalPayroll = money(next);
    await this.trendRepo.save(existing);
  }

  async adjustDistributionBucket(
    bucketIndex: number,
    countDelta: number,
  ): Promise<void> {
    const existing = await this.distributionRepo.findOne({
      where: { bucketIndex },
    });
    if (!existing) {
      return;
    }
    existing.count = Math.max(0, existing.count + countDelta);
    await this.distributionRepo.save(existing);
  }

  async replaceAllSnapshots(input: {
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
    await this.countryRepo.clear();
    await this.trendRepo.clear();

    if (input.countries.length > 0) {
      await this.countryRepo.save(
        input.countries.map((row) => ({
          country: row.country,
          baseCurrency: row.baseCurrency,
          totalPayroll: money(row.totalPayroll),
          headcount: row.headcount,
        })),
      );
    }

    if (input.trends.length > 0) {
      await this.trendRepo.save(
        input.trends.map((row) => ({
          effectiveDate: row.effectiveDate,
          baseCurrency: row.baseCurrency,
          totalPayroll: money(row.totalPayroll),
        })),
      );
    }

    for (const bucket of DISTRIBUTION_BUCKETS) {
      const existing = await this.distributionRepo.findOne({
        where: { bucketIndex: bucket.index },
      });
      const count = input.distributionCounts[bucket.index] ?? 0;
      if (existing) {
        existing.count = count;
        existing.label = bucket.label;
        existing.lowerBound = money(bucket.lowerBound);
        existing.upperBound =
          bucket.upperBound === null ? null : money(bucket.upperBound);
        await this.distributionRepo.save(existing);
      } else {
        await this.distributionRepo.save({
          bucketIndex: bucket.index,
          label: bucket.label,
          lowerBound: money(bucket.lowerBound),
          upperBound:
            bucket.upperBound === null ? null : money(bucket.upperBound),
          count,
        });
      }
    }
  }
}
