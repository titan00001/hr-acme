import { getPaginationMeta, safeOrderBy } from './pagination.utils';

describe('pagination.utils', () => {
  describe('getPaginationMeta', () => {
    it('calculates totalPages correctly', () => {
      expect(getPaginationMeta(0, 1, 20)).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      expect(getPaginationMeta(40, 1, 20)).toEqual({
        total: 40,
        page: 1,
        limit: 20,
        totalPages: 2,
      });
    });

    it('normalizes invalid page and limit', () => {
      expect(getPaginationMeta(10, 0, 0)).toEqual({
        total: 10,
        page: 1,
        limit: 1,
        totalPages: 10,
      });
    });
  });

  describe('safeOrderBy', () => {
    const allowed = ['name', 'email'];

    it('returns null when sortBy is not allowed', () => {
      expect(safeOrderBy('unknown', 'ASC', allowed, 'e')).toBeNull();
      expect(safeOrderBy(undefined, 'ASC', allowed, 'e')).toBeNull();
    });

    it('returns default ASC when sortOrder is not DESC', () => {
      expect(safeOrderBy('name', undefined, allowed, 'e')).toEqual({
        field: 'name',
        order: 'ASC',
        alias: 'e',
      });

      // @ts-expect-error testing runtime guard
      expect(safeOrderBy('email', 'INVALID', allowed)).toEqual({
        field: 'email',
        order: 'ASC',
        alias: undefined,
      });
    });

    it('returns DESC when requested', () => {
      expect(safeOrderBy('email', 'DESC', allowed)).toEqual({
        field: 'email',
        order: 'DESC',
        alias: undefined,
      });
    });
  });
});
