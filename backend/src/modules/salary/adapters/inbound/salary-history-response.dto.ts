import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/pagination/paginated-response.dto';
import { SalaryRecordResponseDto } from './salary-record-response.dto';

export class SalaryHistoryResponseDto extends PaginatedResponseDto<SalaryRecordResponseDto> {
  @ApiProperty({ type: [SalaryRecordResponseDto] })
  declare data: SalaryRecordResponseDto[];
}
