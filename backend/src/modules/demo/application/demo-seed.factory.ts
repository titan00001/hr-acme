import { randomUUID } from 'crypto';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';
import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import {
  computeTotalCompensation,
  toMoneyString,
} from '../../salary/application/compute-total-compensation';

export const DEMO_COUNTRY_CURRENCY: ReadonlyArray<{
  country: string;
  currency: string;
  minSalary: number;
  maxSalary: number;
}> = [
  { country: 'US', currency: 'USD', minSalary: 60_000, maxSalary: 240_000 },
  { country: 'UK', currency: 'GBP', minSalary: 40_000, maxSalary: 160_000 },
  {
    country: 'India',
    currency: 'INR',
    minSalary: 600_000,
    maxSalary: 2_400_000,
  },
  {
    country: 'Germany',
    currency: 'EUR',
    minSalary: 45_000,
    maxSalary: 180_000,
  },
  {
    country: 'Singapore',
    currency: 'SGD',
    minSalary: 50_000,
    maxSalary: 200_000,
  },
];

export const DEMO_BATCH_SIZE = 500;
export const DEMO_TEMPLATE_VERSIONS_PER_COUNTRY = 3;
export const DEMO_EXTRA_REVISION_RATE = 0.3;

const FIRST_NAMES = [
  'Ada',
  'Grace',
  'Alan',
  'Katherine',
  'Linus',
  'Margaret',
  'Tim',
  'Barbara',
];
const LAST_NAMES = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Johnson',
  'Torvalds',
  'Hamilton',
  'Berners-Lee',
  'Liskov',
];

export interface DemoTemplateSeed {
  id: string;
  name: string;
  version: number;
  country: string;
  currency: string;
  basePay: number;
}

export interface DemoEmployeeSeed {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  country: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joiningDate: string;
  currency: string;
  baseSalary: number;
  allowances: number;
  bonus: number;
  templateId: string;
  extraRevisionCount: number;
}

export function buildDemoTemplates(now: Date): DemoTemplateSeed[] {
  const templates: DemoTemplateSeed[] = [];

  for (const locale of DEMO_COUNTRY_CURRENCY) {
    for (
      let version = 1;
      version <= DEMO_TEMPLATE_VERSIONS_PER_COUNTRY;
      version += 1
    ) {
      const basePay = Math.round(
        locale.minSalary +
          ((locale.maxSalary - locale.minSalary) * version) /
            (DEMO_TEMPLATE_VERSIONS_PER_COUNTRY + 1),
      );
      templates.push({
        id: randomUUID(),
        name: `${locale.country} Standard`,
        version,
        country: locale.country,
        currency: locale.currency,
        basePay,
      });
    }
  }

  void now;
  return templates;
}

export function buildDemoEmployees(
  count: number,
  templates: DemoTemplateSeed[],
): DemoEmployeeSeed[] {
  const employees: DemoEmployeeSeed[] = [];
  const templatesByCountry = new Map<string, DemoTemplateSeed[]>();

  for (const template of templates) {
    const list = templatesByCountry.get(template.country) ?? [];
    list.push(template);
    templatesByCountry.set(template.country, list);
  }

  for (let i = 0; i < count; i += 1) {
    const locale = DEMO_COUNTRY_CURRENCY[i % DEMO_COUNTRY_CURRENCY.length];
    const countryTemplates = templatesByCountry.get(locale.country) ?? [];
    const template =
      countryTemplates[i % Math.max(countryTemplates.length, 1)] ??
      templates[0];

    const span = locale.maxSalary - locale.minSalary;
    const baseSalary = locale.minSalary + ((i * 37) % (span + 1));
    const allowances = Math.round(baseSalary * 0.05);
    const bonus = Math.round(baseSalary * 0.1);
    const status = i % 10 === 0 ? EmployeeStatus.Left : EmployeeStatus.Active;

    const employmentTypes = Object.values(EmploymentType);
    const employmentType =
      employmentTypes[i % employmentTypes.length] ?? EmploymentType.Permanent;

    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];

    employees.push({
      id: randomUUID(),
      employeeId: `D${String(i + 1).padStart(5, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `demo.employee.${i + 1}@example.com`,
      country: locale.country,
      employmentType,
      status,
      joiningDate: joiningDateForIndex(i),
      currency: locale.currency,
      baseSalary,
      allowances,
      bonus,
      templateId: template.id,
      extraRevisionCount: i % 10 < 3 ? (i % 3) + 1 : 0,
    });
  }

  return employees;
}

export function buildSalaryTotals(input: {
  baseSalary: number;
  allowances: number;
  bonus: number;
}): string {
  return toMoneyString(
    computeTotalCompensation({
      baseSalary: input.baseSalary,
      allowances: input.allowances,
      bonus: input.bonus,
    }),
  );
}

export const DEMO_PAYMENT_CYCLE = PaymentCycle.Monthly;

function joiningDateForIndex(index: number): string {
  const year = 2018 + (index % 8);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
