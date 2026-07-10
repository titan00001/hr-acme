import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/pagination/paginated-response.dto';
import { SalaryDraftResponseDto } from './salary-draft-response.dto';

export class SalaryDraftListResponseDto extends PaginatedResponseDto<SalaryDraftResponseDto> {
  @ApiProperty({ type: [SalaryDraftResponseDto] })
  declare data: SalaryDraftResponseDto[];
}
