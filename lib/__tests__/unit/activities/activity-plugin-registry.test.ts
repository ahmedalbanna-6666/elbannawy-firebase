import { ActivityPluginRegistry } from '../../../activities/registry';
import type { ActivityPlugin } from '../../../activities/types';

describe('ActivityPluginRegistry', () => {
  let registry: ActivityPluginRegistry;
  const mockPlugin: ActivityPlugin = {
    type: 'activity',
    manifest: {
      type: 'multiple-choice',
      version: 1,
      displayName: 'Multiple Choice',
      description: 'A multiple choice activity',
      category: 'assessment',
      renderer: 'multiple-choice-renderer',
      validator: 'multiple-choice-validator',
      scorer: 'multiple-choice-scorer',
      capabilities: {
        timed: true,
        aiSupported: false,
        retryable: true,
        partialCredit: false,
        attachments: false,
        shuffle: true,
        reviewable: true,
      },
    },
  };

  beforeEach(() => {
    registry = new ActivityPluginRegistry();
  });

  it('registers a plugin', () => {
    registry.register(mockPlugin);
    expect(registry.has('multiple-choice')).toBe(true);
  });

  it('throws when registering duplicate type', () => {
    registry.register(mockPlugin);
    expect(() => registry.register(mockPlugin)).toThrow('already registered');
  });

  it('retrieves a plugin by type', () => {
    registry.register(mockPlugin);
    const retrieved = registry.get('multiple-choice');
    expect(retrieved).toBeDefined();
    expect(retrieved!.manifest.type).toBe('multiple-choice');
  });

  it('returns undefined for unregistered type', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('returns false for unregistered type', () => {
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('unregisters a plugin', () => {
    registry.register(mockPlugin);
    registry.unregister('multiple-choice');
    expect(registry.has('multiple-choice')).toBe(false);
  });

  it('disables and enables a plugin', () => {
    registry.register(mockPlugin, true);
    expect(registry.has('multiple-choice')).toBe(true);
    registry.disable('multiple-choice');
    expect(registry.has('multiple-choice')).toBe(false);
    registry.enable('multiple-choice');
    expect(registry.has('multiple-choice')).toBe(true);
  });

  it('returns all enabled plugins', () => {
    const plugin2: ActivityPlugin = {
      type: 'activity',
      manifest: {
        type: 'fill-blank',
        version: 1,
        displayName: 'Fill in the Blank',
        description: 'A fill in the blank activity',
        category: 'assessment',
        renderer: 'fill-blank-renderer',
        validator: 'fill-blank-validator',
        scorer: 'fill-blank-scorer',
        capabilities: { timed: false, aiSupported: true, retryable: true, partialCredit: true, attachments: false, shuffle: false, reviewable: true },
      },
    };
    registry.register(mockPlugin);
    registry.register(plugin2);
    registry.disable('fill-blank');
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].manifest.type).toBe('multiple-choice');
  });

  it('returns all manifests', () => {
    registry.register(mockPlugin);
    const manifests = registry.getAllManifests();
    expect(manifests).toHaveLength(1);
    expect(manifests[0].type).toBe('multiple-choice');
  });

  it('clears all plugins', () => {
    registry.register(mockPlugin);
    registry.clear();
    expect(registry.size).toBe(0);
  });

  it('tracks size correctly', () => {
    expect(registry.size).toBe(0);
    registry.register(mockPlugin);
    expect(registry.size).toBe(1);
  });
});
