import { ApiProperty } from '@nestjs/swagger';
import { SalaryDraftResponseDto } from '../../../salary-drafts/adapters/inbound/salary-draft-response.dto';

export class MigrateFromTemplateResponseDto {
  @ApiProperty({ example: 2 })
  draftsCreated!: number;

  @ApiProperty({ type: [SalaryDraftResponseDto] })
  drafts!: SalaryDraftResponseDto[];
}
