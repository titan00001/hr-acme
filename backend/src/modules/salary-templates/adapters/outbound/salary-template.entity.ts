import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../../common/database/base.entity';
import type { TemplateComponents } from '../../domain/salary-template.model';

@Entity('salary_templates')
@Unique(['name', 'version'])
@Index(['name'])
@Index(['country'])
@Index(['currency'])
export class SalaryTemplateEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'jsonb' })
  components!: TemplateComponents;

  @Column({ name: 'is_assigned', type: 'boolean', default: false })
  isAssigned!: boolean;
}
