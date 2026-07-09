import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDI4ODAwfQ.signature',
  })
  accessToken!: string;

  @ApiProperty({ example: 28800, description: 'Token expiry in seconds' })
  expiresIn!: number;
}
