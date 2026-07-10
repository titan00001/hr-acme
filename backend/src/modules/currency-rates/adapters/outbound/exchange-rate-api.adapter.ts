import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeRatePort } from '../../ports/outbound/exchange-rate.port';

interface ExchangeRateApiResponse {
  result: string;
  conversion_rates?: Record<string, number>;
}

@Injectable()
export class ExchangeRateApiAdapter implements ExchangeRatePort {
  private readonly logger = new Logger(ExchangeRateApiAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchLatestRates(
    baseCurrency: string,
  ): Promise<Record<string, number>> {
    const apiKey = this.configService.getOrThrow<string>(
      'EXCHANGE_RATE_API_KEY',
    );
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency.toUpperCase()}`;

    const response = await fetch(url);
    if (!response.ok) {
      this.logger.error(
        `ExchangeRate-API failed with status ${response.status}`,
      );
      throw new Error(`ExchangeRate-API request failed: ${response.status}`);
    }

    const payload = (await response.json()) as ExchangeRateApiResponse;
    if (payload.result !== 'success' || !payload.conversion_rates) {
      this.logger.error('ExchangeRate-API returned an invalid payload');
      throw new Error('ExchangeRate-API returned an invalid payload');
    }

    this.logger.log(
      `FX sync fetched ${Object.keys(payload.conversion_rates).length} rates for base=${baseCurrency}`,
    );

    return payload.conversion_rates;
  }
}
