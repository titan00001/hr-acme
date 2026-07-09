import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @ApiPropertyOptional({ example: ['USD', 'GBP', 'INR', 'EUR', 'SGD'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedCurrencies?: string[];

  @ApiPropertyOptional({
    example: ['US', 'UK', 'India', 'Germany', 'Singapore'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedCountries?: string[];

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalStocks?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockPrice?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  stockPriceCurrency?: string;
}
