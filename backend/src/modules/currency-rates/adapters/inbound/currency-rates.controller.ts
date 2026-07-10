import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { CurrencyRateService } from '../../application/currency-rate.service';
import { toCurrencyRateResponseDto } from '../../application/currency-rate.mapper';
import { CurrencyRateResponseDto } from './currency-rate-response.dto';
import { SyncCurrencyRatesResponseDto } from './sync-currency-rates-response.dto';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('settings/currency-rates')
export class CurrencyRatesController {
  constructor(private readonly currencyRateService: CurrencyRateService) {}

  @Get()
  @ApiOperation({ summary: 'List synced currency rates' })
  @ApiOkResponse({ type: CurrencyRateResponseDto, isArray: true })
  async findAll(): Promise<CurrencyRateResponseDto[]> {
    const rates = await this.currencyRateService.findAll();
    return rates.map(toCurrencyRateResponseDto);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync currency rates from ExchangeRate-API' })
  @ApiOkResponse({ type: SyncCurrencyRatesResponseDto })
  async sync(): Promise<SyncCurrencyRatesResponseDto> {
    return this.currencyRateService.sync();
  }
}
