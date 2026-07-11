import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TemplateComponentsDto } from './create-template.dto';

export class CreateTemplateVersionDto {
  @ApiPropertyOptional({
    example: 'India Standard',
    description:
      'Must match the template family name when provided; defaults to the source template name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

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
