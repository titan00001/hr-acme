import { parseExpiresInToSeconds } from './parse-expires-in.util';

describe('parseExpiresInToSeconds', () => {
  it('parses supported time units', () => {
    expect(parseExpiresInToSeconds('30s')).toBe(30);
    expect(parseExpiresInToSeconds('15m')).toBe(900);
    expect(parseExpiresInToSeconds('8h')).toBe(28800);
    expect(parseExpiresInToSeconds('1d')).toBe(86400);
  });

  it('defaults to 8 hours for invalid values', () => {
    expect(parseExpiresInToSeconds('invalid')).toBe(28800);
  });
});
