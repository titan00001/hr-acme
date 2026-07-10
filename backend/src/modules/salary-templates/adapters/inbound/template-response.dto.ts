import { ApiProperty } from '@nestjs/swagger';
import {
  TemplateComponentsDto,
  TemplateStockComponentDto,
} from './create-template.dto';

export class TemplateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'India Standard' })
  name!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 'India' })
  country!: string;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ type: TemplateComponentsDto })
  components!: TemplateComponentsDto;

  @ApiProperty({ example: false })
  isAssigned!: boolean;

  @ApiProperty({
    example: 2,
    description: 'Highest version number in this template family',
  })
  latestVersion!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export { TemplateStockComponentDto };
