import { buildDemoEmployees, buildDemoTemplates } from './demo-seed.factory';

describe('demo-seed.factory', () => {
  it('builds 15 templates across 5 countries', () => {
    const templates = buildDemoTemplates(new Date());
    expect(templates).toHaveLength(15);
    expect(new Set(templates.map((row) => row.country)).size).toBe(5);
  });

  it('builds the requested employee count', () => {
    const templates = buildDemoTemplates(new Date());
    const employees = buildDemoEmployees(20, templates);
    expect(employees).toHaveLength(20);
    expect(employees[0]?.employeeId).toBe('D00001');
  });
});
