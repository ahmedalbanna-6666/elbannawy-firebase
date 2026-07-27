import { CacheManager, storyCache } from '../../shared/cache/cache-manager';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(1000);
  });

  it('should store and retrieve values', () => {
    cache.set('key1', { id: '1', name: 'test' });
    const val = cache.get<{ id: string; name: string }>('key1');
    expect(val).toEqual({ id: '1', name: 'test' });
  });

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should delete values', () => {
    cache.set('key1', 'value');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('should expire after TTL', () => {
    const shortCache = new CacheManager(10);
    shortCache.set('key1', 'value');
    expect(shortCache.get('key1')).toBe('value');
  });

  it('should invalidate by prefix', () => {
    cache.set('story:1', 'a');
    cache.set('story:2', 'b');
    cache.set('review:1', 'c');
    cache.invalidateByPrefix('story:');
    expect(cache.get('story:1')).toBeNull();
    expect(cache.get('story:2')).toBeNull();
    expect(cache.get('review:1')).toBe('c');
  });

  it('should clear all', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should report correct size', () => {
    expect(cache.size()).toBe(0);
    cache.set('a', 1);
    expect(cache.size()).toBe(1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
  });
});
