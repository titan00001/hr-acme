const EXPIRES_IN_PATTERN = /^(\d+)([smhd])$/;

const UNIT_MULTIPLIERS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export function parseExpiresInToSeconds(expiresIn: string): number {
  const match = EXPIRES_IN_PATTERN.exec(expiresIn);
  if (!match) {
    return 8 * 3600;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * (UNIT_MULTIPLIERS[unit] ?? 3600);
}
