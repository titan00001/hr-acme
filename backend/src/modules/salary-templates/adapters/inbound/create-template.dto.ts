import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TemplateStockComponentDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsOptional()
  @IsDateString()
  vestingDate?: string;
}

export class TemplateComponentsDto {
  @ApiProperty({ example: 1200000 })
  @IsNumber()
  @Min(0)
  basePay!: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ type: TemplateStockComponentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateStockComponentDto)
  stock?: TemplateStockComponentDto;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'India Standard' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: 'INR' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ type: TemplateComponentsDto })
  @ValidateNested()
  @Type(() => TemplateComponentsDto)
  components!: TemplateComponentsDto;
}
