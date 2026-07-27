import { checkVersion, incrementVersion } from '../../shared/concurrency/optimistic-lock';

describe('OptimisticLock', () => {
  const entity = {
    id: 'story-1',
    contentVersion: 3,
    updatedAt: '2026-07-27T12:00:00Z',
  };

  describe('checkVersion', () => {
    it('should pass when version matches', () => {
      const result = checkVersion(entity, 3, 'Story', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('should pass when expectedVersion is 0 (skip check)', () => {
      const result = checkVersion(entity, 0, 'Story', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('should fail on version mismatch', () => {
      const result = checkVersion(entity, 1, 'Story', 'req-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should fail when entity is null', () => {
      const result = checkVersion(null, 1, 'Story', 'req-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should fail when entity is undefined', () => {
      const result = checkVersion(undefined, 1, 'Story', 'req-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('incrementVersion', () => {
    it('should increment by 1', () => {
      expect(incrementVersion(3)).toBe(4);
    });

    it('should handle zero', () => {
      expect(incrementVersion(0)).toBe(1);
    });
  });
});
