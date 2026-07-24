import type { EducationalSystem } from '../entities/educational-system.entity';

export const EDUCATIONAL_SYSTEM_IDS = {
  GENERAL: 'GENERAL',
  LANGUAGE: 'LANGUAGE',
  INTERNATIONAL: 'INTERNATIONAL',
} as const;

export type EducationalSystemId = (typeof EDUCATIONAL_SYSTEM_IDS)[keyof typeof EDUCATIONAL_SYSTEM_IDS];

export const EDUCATIONAL_SYSTEMS: readonly EducationalSystem[] = [
  {
    id: EDUCATIONAL_SYSTEM_IDS.GENERAL,
    name: 'General',
    nameAr: 'عام',
    description: 'النظام التعليمي العام',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
  {
    id: EDUCATIONAL_SYSTEM_IDS.LANGUAGE,
    name: 'Language',
    nameAr: 'لغات',
    description: 'النظام التعليمي للغات',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
  {
    id: EDUCATIONAL_SYSTEM_IDS.INTERNATIONAL,
    name: 'International',
    nameAr: 'دولي',
    description: 'النظام التعليمي الدولي',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  },
] as const;
