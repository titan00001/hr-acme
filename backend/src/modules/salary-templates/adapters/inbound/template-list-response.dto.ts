import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/pagination/paginated-response.dto';
import { TemplateResponseDto } from './template-response.dto';

export class TemplateListResponseDto extends PaginatedResponseDto<TemplateResponseDto> {
  @ApiProperty({ type: [TemplateResponseDto] })
  declare data: TemplateResponseDto[];
}
