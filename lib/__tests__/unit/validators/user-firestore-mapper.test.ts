import { describe, it, expect } from '@jest/globals';
import { UserFirestoreMapper, UserFirestoreDocument } from '../../../repositories/user/user-firestore-mapper';

describe('UserFirestoreMapper', () => {
  const mockDoc: UserFirestoreDocument = {
    id: 'user-1',
    fullName: 'Ahmed Mohamed',
    mobileNumber: '+201234567890',
    isActive: true,
    role: {
      role: 'student',
      grantedAt: '2026-01-01T00:00:00.000Z',
    },
    status: {
      status: 'active',
      reason: null,
    },
    email: 'ahmed@example.com',
    englishName: 'Ahmed',
    parentMobile: null,
    governorate: 'Cairo',
    school: 'School 1',
    avatarUrl: null,
    jobTitle: null,
    educationalSystemId: null,
    stageId: null,
    gradeId: 'grade-1',
    academicYearId: 'year-1',
    termId: 'term-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    deletedAt: null,
  };

  describe('toDomain', () => {
    it('maps Firestore document to domain entity', () => {
      const domain = UserFirestoreMapper.toDomain(mockDoc);

      expect(domain.id).toBe('user-1');
      expect(domain.role.role).toBe('student');
      expect(domain.role.grantedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(domain.fullName).toBe('Ahmed Mohamed');
      expect(domain.mobileNumber).toBe('+201234567890');
      expect(domain.isActive).toBe(true);
      expect(domain.email).toBe('ahmed@example.com');
      expect(domain.governorate).toBe('Cairo');
    });

    it('handles null optional fields', () => {
      const nullDoc: UserFirestoreDocument = {
        ...mockDoc,
        email: null,
        englishName: null,
        governorate: null,
      };

      const domain = UserFirestoreMapper.toDomain(nullDoc);
      expect(domain.email).toBeUndefined();
      expect(domain.englishName).toBeUndefined();
      expect(domain.governorate).toBeUndefined();
    });
  });

  describe('toContract', () => {
    it('maps Firestore document to IUser contract', () => {
      const contract = UserFirestoreMapper.toContract(mockDoc);

      expect(contract.id).toBe('user-1');
      expect(contract.role).toBe('student');
      expect(contract.fullName).toBe('Ahmed Mohamed');
      expect(contract.mobileNumber).toBe('+201234567890');
      expect(contract.isActive).toBe(true);
      expect(contract.createdAt).toBeDefined();
      expect(contract.updatedAt).toBeDefined();
    });
  });

  describe('toFirestore', () => {
    it('maps partial domain to Firestore data', () => {
      const data = UserFirestoreMapper.toFirestore({
        fullName: 'New Name',
        email: 'new@example.com',
      });

      expect(data.fullName).toBe('New Name');
      expect(data.email).toBe('new@example.com');
    });

    it('handles undefined fields', () => {
      const data = UserFirestoreMapper.toFirestore({
        fullName: 'Name',
      });

      expect(data.fullName).toBe('Name');
      expect(data.email).toBeUndefined();
    });
  });

  describe('toLoginEventDomain', () => {
    it('maps login event document to domain', () => {
      const event = UserFirestoreMapper.toLoginEventDomain({
        id: 'event-1',
        userId: 'user-1',
        eventType: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla',
        createdAt: '2026-01-01T00:00:00.000Z',
        schemaVersion: 1,
      });

      expect(event.id).toBe('event-1');
      expect(event.eventType).toBe('login');
      expect(event.ipAddress).toBe('192.168.1.1');
    });

    it('handles null optional fields', () => {
      const event = UserFirestoreMapper.toLoginEventDomain({
        id: 'event-2',
        userId: 'user-1',
        eventType: 'logout',
        ipAddress: null,
        userAgent: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        schemaVersion: 1,
      });

      expect(event.ipAddress).toBeUndefined();
      expect(event.userAgent).toBeUndefined();
    });
  });

  describe('SCHEMA_VERSION', () => {
    it('is set to 1', () => {
      expect(UserFirestoreMapper.SCHEMA_VERSION).toBe(1);
    });
  });
});
