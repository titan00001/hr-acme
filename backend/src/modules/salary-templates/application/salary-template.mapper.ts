import type { SalaryTemplate } from '../domain/salary-template.model';
import { TemplateResponseDto } from '../adapters/inbound/template-response.dto';

export function toTemplateResponseDto(
  template: SalaryTemplate,
  latestVersion: number,
): TemplateResponseDto {
  return {
    id: template.id,
    name: template.name,
    version: template.version,
    country: template.country,
    currency: template.currency,
    components: template.components,
    isAssigned: template.isAssigned,
    latestVersion,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
