import type { ActivityPlugin, PluginRegistration, ActivityManifest } from './types';

export class ActivityPluginRegistry {
  private readonly plugins = new Map<string, PluginRegistration>();

  register(plugin: ActivityPlugin, enabled = true): void {
    if (this.plugins.has(plugin.manifest.type)) {
      throw new Error(
        `Plugin type "${plugin.manifest.type}" is already registered`
      );
    }
    this.plugins.set(plugin.manifest.type, {
      plugin,
      enabled,
      registeredAt: new Date().toISOString(),
    });
  }

  unregister(type: string): void {
    this.plugins.delete(type);
  }

  get(type: string): ActivityPlugin | undefined {
    return this.plugins.get(type)?.plugin;
  }

  getRegistered(type: string): PluginRegistration | undefined {
    return this.plugins.get(type);
  }

  has(type: string): boolean {
    return this.plugins.has(type) && (this.plugins.get(type)?.enabled ?? false);
  }

  getAll(): ActivityPlugin[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.enabled)
      .map((p) => p.plugin);
  }

  getAllManifests(): ActivityManifest[] {
    return this.getAll().map((p) => p.manifest);
  }

  disable(type: string): void {
    const reg = this.plugins.get(type);
    if (reg) {
      this.plugins.set(type, { ...reg, enabled: false });
    }
  }

  enable(type: string): void {
    const reg = this.plugins.get(type);
    if (reg) {
      this.plugins.set(type, { ...reg, enabled: true });
    }
  }

  clear(): void {
    this.plugins.clear();
  }

  get size(): number {
    return this.plugins.size;
  }
}
