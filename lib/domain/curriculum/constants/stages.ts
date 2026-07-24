import type { Stage } from '../entities/stage.entity';
import { EDUCATIONAL_SYSTEM_IDS } from './educational-systems';

export const STAGE_IDS = {
  PRIMARY: 'PRIMARY',
  PREPARATORY: 'PREPARATORY',
  SECONDARY: 'SECONDARY',
} as const;

export type StageId = (typeof STAGE_IDS)[keyof typeof STAGE_IDS];

export const STAGES: readonly Stage[] = [
  {
    id: STAGE_IDS.PRIMARY,
    educationalSystemId: EDUCATIONAL_SYSTEM_IDS.GENERAL,
    name: 'Primary',
    nameAr: 'ابتدائي',
    order: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
  {
    id: STAGE_IDS.PREPARATORY,
    educationalSystemId: EDUCATIONAL_SYSTEM_IDS.GENERAL,
    name: 'Preparatory',
    nameAr: 'إعدادي',
    order: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
  {
    id: STAGE_IDS.SECONDARY,
    educationalSystemId: EDUCATIONAL_SYSTEM_IDS.GENERAL,
    name: 'Secondary',
    nameAr: 'ثانوي',
    order: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
] as const;
