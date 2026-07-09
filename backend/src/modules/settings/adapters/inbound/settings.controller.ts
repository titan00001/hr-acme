import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { SettingsService } from '../../application/settings.service';
import { toSettingsResponseDto } from '../../application/settings.mapper';
import { SettingsResponseDto } from './settings-response.dto';
import { UpdateSettingsDto } from './update-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application settings' })
  @ApiOkResponse({ type: SettingsResponseDto })
  async get(): Promise<SettingsResponseDto> {
    const settings = await this.settingsService.get();
    return toSettingsResponseDto(settings);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update application settings' })
  @ApiOkResponse({ type: SettingsResponseDto })
  async update(@Body() dto: UpdateSettingsDto): Promise<SettingsResponseDto> {
    const settings = await this.settingsService.update(dto);
    return toSettingsResponseDto(settings);
  }
}
