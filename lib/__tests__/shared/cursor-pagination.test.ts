import { encodeCursor, decodeCursor, createCursorPage } from '../../shared/pagination/cursor-pagination';

describe('CursorPagination', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('should encode and decode a string cursor', () => {
      const encoded = encodeCursor('story-123', 'id');
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual({ value: 'story-123', field: 'id' });
    });

    it('should encode and decode a numeric cursor', () => {
      const encoded = encodeCursor(42, 'displayOrder');
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual({ value: 42, field: 'displayOrder' });
    });

    it('should return null for invalid cursor', () => {
      expect(decodeCursor('invalid-base64!')).toBeNull();
      expect(decodeCursor('')).toBeNull();
    });

    it('should produce URL-safe base64', () => {
      const encoded = encodeCursor('test/id+1', 'field');
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });
  });

  describe('createCursorPage', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
      { id: '5', name: 'E' },
    ];

    it('should return all items if under limit', () => {
      const page = createCursorPage(items, 10, (i) => i.id);
      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).toBeNull();
      expect(page.hasMore).toBe(false);
    });

    it('should truncate and provide cursor when over limit', () => {
      const page = createCursorPage(items, 3, (i) => i.id);
      expect(page.items).toHaveLength(3);
      expect(page.items.map((i) => i.id)).toEqual(['1', '2', '3']);
      expect(page.nextCursor).not.toBeNull();
      expect(page.hasMore).toBe(true);
    });

    it('should handle empty array', () => {
      const page = createCursorPage([], 10, (i) => i.id);
      expect(page.items).toHaveLength(0);
      expect(page.nextCursor).toBeNull();
      expect(page.hasMore).toBe(false);
    });

    it('should use custom cursor field', () => {
      const page = createCursorPage(items, 2, (i) => i.name);
      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).not.toBeNull();
      const decoded = decodeCursor(page.nextCursor!);
      expect(decoded?.field).toBe('id');
    });
  });
});
