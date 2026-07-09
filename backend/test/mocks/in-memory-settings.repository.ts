import { Injectable } from '@nestjs/common';
import { DEFAULT_SETTINGS } from '../../src/modules/settings/domain/default-settings';
import type { Settings } from '../../src/modules/settings/domain/settings.model';
import { SETTINGS_ID } from '../../src/modules/settings/domain/settings.model';
import type { SettingsRepositoryPort } from '../../src/modules/settings/ports/outbound/settings.repository.port';

@Injectable()
export class InMemorySettingsRepository implements SettingsRepositoryPort {
  private settings: Settings | null = null;

  findById(id: number): Promise<Settings | null> {
    if (id !== SETTINGS_ID || !this.settings) {
      return Promise.resolve(null);
    }

    return Promise.resolve({ ...this.settings });
  }

  save(settings: Settings): Promise<Settings> {
    this.settings = { ...settings };
    return Promise.resolve({ ...this.settings });
  }

  seed(): void {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  clear(): void {
    this.settings = null;
  }
}
