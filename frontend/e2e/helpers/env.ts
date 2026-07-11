import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({
  path: path.resolve(frontendRoot, '../backend/.env'),
  quiet: true,
});

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in backend/.env (or export it) before running E2E.`,
    );
  }
  return value;
}

export const e2eCredentials = {
  username: required('HR_USERNAME'),
  password: required('HR_PASSWORD'),
};

export const demoSeedCount = Number(process.env.DEMO_SEED_COUNT ?? '10000');
