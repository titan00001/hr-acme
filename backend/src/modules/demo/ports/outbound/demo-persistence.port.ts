export const DEMO_PERSISTENCE = Symbol('DEMO_PERSISTENCE');

export interface DemoSeedResult {
  inserted: number;
}

export interface DemoPersistencePort {
  countEmployees(): Promise<number>;
  clearAll(): Promise<void>;
  seed(employeeCount: number, createdBy: string): Promise<DemoSeedResult>;
}
