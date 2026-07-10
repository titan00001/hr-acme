import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const DISPLAY_CURRENCY_ORIGINAL = 'original';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 'original',
    description: '`original` or a supported currency code (e.g. USD)',
  })
  @IsOptional()
  @IsString()
  displayCurrency: string = DISPLAY_CURRENCY_ORIGINAL;
}

export class DashboardTrendsQueryDto extends DashboardQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  to!: string;
}

export class DashboardRecentQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
