import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { PaginatedResponseDto } from '../../../../common/pagination/paginated-response.dto';
import { DashboardService } from '../../application/dashboard.service';
import {
  DashboardQueryDto,
  DashboardRecentQueryDto,
  DashboardTrendsQueryDto,
} from './dashboard-query.dto';
import {
  CountryBreakdownDto,
  DashboardSummaryDto,
  DistributionBucketDto,
  RecentRevisionDto,
  TrendPointDto,
} from './dashboard-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Payroll summary for Active employees' })
  @ApiOkResponse({ type: DashboardSummaryDto })
  getSummary(@Query() query: DashboardQueryDto): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(query);
  }

  @Get('by-country')
  @ApiOperation({ summary: 'Payroll breakdown by country' })
  @ApiOkResponse({ type: [CountryBreakdownDto] })
  getByCountry(
    @Query() query: DashboardQueryDto,
  ): Promise<CountryBreakdownDto[]> {
    return this.dashboardService.getByCountry(query);
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Compensation distribution buckets' })
  @ApiOkResponse({ type: [DistributionBucketDto] })
  getDistribution(
    @Query() query: DashboardQueryDto,
  ): Promise<DistributionBucketDto[]> {
    return this.dashboardService.getDistribution(query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Compensation trends over a date range' })
  @ApiOkResponse({ type: [TrendPointDto] })
  getTrends(@Query() query: DashboardTrendsQueryDto): Promise<TrendPointDto[]> {
    return this.dashboardService.getTrends(query);
  }

  @Get('recent-revisions')
  @ApiOperation({ summary: 'Latest committed salary revisions' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  getRecentRevisions(
    @Query() query: DashboardRecentQueryDto,
  ): Promise<PaginatedResponseDto<RecentRevisionDto>> {
    return this.dashboardService.getRecentRevisions(query);
  }
}
