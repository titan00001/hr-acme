import type { Settings } from '../../domain/settings.model';

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');

export interface SettingsRepositoryPort {
  findById(id: number): Promise<Settings | null>;
  save(settings: Settings): Promise<Settings>;
}
