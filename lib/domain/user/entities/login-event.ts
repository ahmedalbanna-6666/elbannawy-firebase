export interface LoginEvent {
  readonly id: string;
  readonly userId: string;
  readonly eventType: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: string;
  readonly schemaVersion: number;
}
