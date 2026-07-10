import { ApiProperty } from '@nestjs/swagger';

export class DemoStatusResponseDto {
  @ApiProperty({ example: true })
  seeded!: boolean;

  @ApiProperty({ example: 10000 })
  employeeCount!: number;
}

export class DemoSeedResponseDto {
  @ApiProperty({ example: 10000 })
  inserted!: number;
}

export class DemoClearResponseDto {
  @ApiProperty({ example: true })
  cleared!: boolean;
}
