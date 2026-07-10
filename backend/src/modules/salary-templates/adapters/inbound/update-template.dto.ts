import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TemplateComponentsDto } from './create-template.dto';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @ApiPropertyOptional({ type: TemplateComponentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateComponentsDto)
  components?: TemplateComponentsDto;
}
