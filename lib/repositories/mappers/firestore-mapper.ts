// lib/repositories/mappers/firestore-mapper.ts

import { ICursor, ICursorBuilder } from '../../shared/types/cursor.types';

export interface FirestoreDocument {
  readonly id?: string;
  readonly data: Record<string, unknown>;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
  readonly schemaVersion: number;
  readonly deletedAt?: unknown;
}

export interface DomainEntity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface DTO {
  readonly [key: string]: unknown;
}

export class FirestoreMapper {
  private static cursorBuilder: ICursorBuilder;

  static initialize(cursorBuilder: ICursorBuilder): void {
    FirestoreMapper.cursorBuilder = cursorBuilder;
  }

  static toFirestoreDocument<T extends DomainEntity>(entity: T): FirestoreDocument {
    return {
      id: entity.id,
      data: this.transformDomainToDTO(entity),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      schemaVersion: entity.schemaVersion,
      deletedAt: entity.deletedAt || null,
    };
  }

  static fromFirestoreDocument<T extends DomainEntity>(doc: FirestoreDocument): T {
    return {
      ...this.transformDTOToDomain(doc.data, doc.data),
      id: doc.id || '',
      createdAt: this.formatTimestamp(doc.createdAt),
      updatedAt: this.formatTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
      deletedAt: doc.deletedAt ? this.formatTimestamp(doc.deletedAt) : null,
    } as unknown as T;
  }

  static toCursor<T>(item: T): ICursor {
    if (!FirestoreMapper.cursorBuilder) {
      throw new Error('CursorBuilder not initialized. Call FirestoreMapper.initialize() first.');
    }
    return FirestoreMapper.cursorBuilder.buildCursor(item);
  }

  static getCursorValue<T>(item: T): unknown {
    if (!FirestoreMapper.cursorBuilder) {
      throw new Error('CursorBuilder not initialized. Call FirestoreMapper.initialize() first.');
    }
    return FirestoreMapper.cursorBuilder.getCursorValue(item);
  }

  private static transformDomainToDTO<T extends DomainEntity>(entity: T): DTO {
    const dto: Record<string, unknown> = { ...entity as unknown as Record<string, unknown> };
    delete dto.id;
    delete dto.createdAt;
    delete dto.updatedAt;
    delete dto.schemaVersion;
    delete dto.deletedAt;
    return dto;
  }

  private static transformDTOToDomain(_: unknown, dto: unknown): Record<string, unknown> {
    if (typeof dto !== 'object' || dto === null) {
      return {};
    }
    return { ...(dto as Record<string, unknown>) };
  }

  private static formatTimestamp(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      const ts = value as { toDate(): Date };
      return ts.toDate().toISOString();
    }
    return String(value);
  }
}
