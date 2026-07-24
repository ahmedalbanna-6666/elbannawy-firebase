import { vi } from 'vitest';

// ─── Mock NextRequest ─────────────────────────────────────────
class MockNextRequest {
  private readonly _url: string;
  readonly headers: Headers;
  readonly cookies: { get: (name: string) => { value: string } | undefined };

  constructor(input: string | URL, init?: RequestInit & { cookies?: Record<string, string> }) {
    this._url = typeof input === 'string' ? input : input.toString();
    this.headers = new Headers(init?.headers);
    this.cookies = {
      get: (name: string) => {
        const cookie = init?.cookies?.[name];
        return cookie ? { value: cookie } : undefined;
      },
    };
  }

  get url(): string { return this._url; }

  json<T = unknown>(): Promise<T> {
    return Promise.resolve({} as T);
  }
}

// ─── Mock NextResponse ────────────────────────────────────────
class MockNextResponse {
  readonly statusCode: number;
  readonly body: unknown;
  readonly headers: Record<string, string>;

  constructor(body: unknown, init?: ResponseInit & { headers?: Record<string, string> }) {
    this.body = body;
    this.statusCode = init?.status ?? 200;
    this.headers = (init?.headers as Record<string, string>) ?? {};
  }

  static json(body: unknown, init?: ResponseInit): MockNextResponse {
    return new MockNextResponse(body, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers as Record<string, string>) } });
  }
}

vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
}));

// ─── Mock Firebase Collection ─────────────────────────────────
interface FirestoreData {
  id: string;
  data: Record<string, unknown>;
}

class MockQuerySnapshot {
  readonly docs: MockQueryDocumentSnapshot[];
  readonly size: number;
  readonly empty: boolean;

  constructor(docs: MockQueryDocumentSnapshot[]) {
    this.docs = docs;
    this.size = docs.length;
    this.empty = docs.length === 0;
  }

  forEach(cb: (doc: MockQueryDocumentSnapshot) => void): void {
    this.docs.forEach(cb);
  }
}

class MockQueryDocumentSnapshot {
  readonly id: string;
  private readonly _data: Record<string, unknown> | null;
  readonly exists: boolean;

  constructor(id: string, data: Record<string, unknown> | null) {
    this.id = id;
    this._data = data;
    this.exists = data !== null;
  }

  data(): Record<string, unknown> | undefined {
    return this._data ?? undefined;
  }
}

class MockDocumentReference {
  readonly id: string;
  private store: MockFirestoreStore;

  constructor(id: string, store: MockFirestoreStore) {
    this.id = id;
    this.store = store;
  }

  async get(): Promise<MockQueryDocumentSnapshot> {
    const doc = this.store.getDoc(this.id);
    return new MockQueryDocumentSnapshot(this.id, doc);
  }

  async set(data: Record<string, unknown>): Promise<void> {
    this.store.setDoc(this.id, { ...data, id: this.id });
  }

  async update(data: Record<string, unknown>): Promise<void> {
    const existing = this.store.getDoc(this.id) ?? {};
    this.store.setDoc(this.id, { ...existing, ...data, id: this.id });
  }

  collection(_name: string): MockCollectionReference {
    return new MockCollectionReference(_name, this.store, this.id);
  }
}

class MockCollectionReference {
  readonly id: string;
  private store: MockFirestoreStore;
  private parentId?: string;

  constructor(id: string, store: MockFirestoreStore, parentId?: string) {
    this.id = id;
    this.store = store;
    this.parentId = parentId;
  }

  doc(docId: string): MockDocumentReference {
    const fullPath = this.parentId ? `${this.parentId}/${this.id}/${docId}` : `${this.id}/${docId}`;
    return new MockDocumentReference(fullPath, this.store);
  }

  where(field: string, op: string, value: unknown): MockQuery {
    const query = new MockQuery(this.store, this.id);
    query.where(field, op, value);
    return query;
  }

  orderBy(field: string, dir?: string): MockQuery {
    const query = new MockQuery(this.store, this.id);
    query.orderBy(field, dir);
    return query;
  }

  limit(n: number): MockQuery {
    const query = new MockQuery(this.store, this.id);
    query.limit(n);
    return query;
  }
}

class MockQuery {
  private store: MockFirestoreStore;
  private collectionId: string;
  filters: Array<{ field: string; op: string; value: unknown }>;
  private orderField: string | null = null;
  private orderDir: string = 'asc';
  private maxLimit: number = 0;

  constructor(store: MockFirestoreStore, collectionId: string, filters?: Array<{ field: string; op: string; value: unknown }>) {
    this.store = store;
    this.collectionId = collectionId;
    this.filters = filters ?? [];
  }

  where(field: string, op: string, value: unknown): MockQuery {
    this.filters.push({ field, op, value });
    return this;
  }

  orderBy(field: string, dir?: string): MockQuery {
    this.orderField = field;
    this.orderDir = dir ?? 'asc';
    return this;
  }

  limit(n: number): MockQuery {
    this.maxLimit = n;
    return this;
  }

  async get(): Promise<MockQuerySnapshot> {
    let docs = this.store.query(this.collectionId, this.filters);
    if (this.orderField) {
      docs = docs.sort((a, b) => {
        const aVal = this.store.resolveFieldValue(a.id, this.orderField!);
        const bVal = this.store.resolveFieldValue(b.id, this.orderField!);
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return this.orderDir === 'desc' ? bVal - aVal : aVal - bVal;
        }
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        return this.orderDir === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      });
    }
    if (this.maxLimit > 0) {
      docs = docs.slice(0, this.maxLimit);
    }
    return new MockQuerySnapshot(docs);
  }

  async count(): Promise<{ data: () => { count: number } }> {
    const docs = await this.get();
    return { data: () => ({ count: docs.size }) };
  }
}

class MockFirestoreStore {
  private docs = new Map<string, Record<string, unknown>>();

  getDoc(id: string): Record<string, unknown> | null {
    return this.docs.get(id) ?? null;
  }

  setDoc(id: string, data: Record<string, unknown>): void {
    this.docs.set(id, data);
  }

  deleteDoc(id: string): void {
    this.docs.delete(id);
  }

  collection(id: string): MockCollectionReference {
    return new MockCollectionReference(id, this);
  }

  query(collectionId: string, filters: Array<{ field: string; op: string; value: unknown }>): MockQueryDocumentSnapshot[] {
    const results: MockQueryDocumentSnapshot[] = [];
    for (const [path, data] of this.docs.entries()) {
      if (!path.startsWith(`${collectionId}/`)) continue;
      const id = path.split('/')[1];
      // Simple filter matching
      let matches = true;
      for (const f of filters) {
        const fieldValue = this.resolveField(data, f.field);
        if (f.op === '==') {
          if (f.value === null) {
            if (fieldValue !== null && fieldValue !== undefined) matches = false;
          } else {
            // Support both nested `{ role: 'teacher' }` and flat `'teacher'`
            const actual = typeof fieldValue === 'object' && fieldValue !== null
              ? (fieldValue as Record<string, unknown>)?.[f.field.split('.').pop() ?? '']
              : fieldValue;
            if (actual !== f.value) matches = false;
          }
        } else if (f.op === '!=') {
          if (fieldValue === f.value) matches = false;
        } else if (f.op === 'array-contains') {
          if (!Array.isArray(fieldValue) || !fieldValue.includes(f.value)) matches = false;
        }
      }
      if (matches) {
        results.push(new MockQueryDocumentSnapshot(id, data));
      }
    }
    return results;
  }

  private resolveField(data: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let current: unknown = data;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  resolveFieldValue(shortId: string, field: string): unknown {
    for (const [path, data] of this.docs.entries()) {
      if (path.endsWith(`/${shortId}`)) {
        return this.resolveField(data, field);
      }
    }
    return undefined;
  }

  clear(): void {
    this.docs.clear();
  }
}

const mockStore = new MockFirestoreStore();

const mockAdminDb = {
  collection: (id: string) => mockStore.collection(id),
};

const mockAdminAuth = {
  verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-admin-uid', email: 'admin@test.com' }),
  getUser: vi.fn().mockResolvedValue({ uid: 'test-admin-uid', email: 'admin@test.com', displayName: 'Admin', customClaims: {} }),
  listUsers: vi.fn().mockResolvedValue({ users: [] }),
};

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => mockAdminDb,
  getAdminAuth: () => mockAdminAuth,
  getAdminStorage: () => ({}),
}));

vi.mock('@/lib/firebase/config', () => ({
  FIREBASE_ADMIN_CONFIG: {
    projectId: 'test-project',
    clientEmail: 'test@test.com',
    privateKey: 'test-key',
  },
  isFirebaseAdminConfigured: () => true,
  isFirebaseConfigured: () => true,
  default: {},
}));

vi.mock('@/lib/firebase/auth-helper', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ uid: 'test-teacher-uid', email: 'teacher@test.com' }),
}));

vi.mock('server-only', () => ({}));

// ─── Mock @el-bannawy/lib firestore to use our mock store ─────
vi.mock('@el-bannawy/lib', async () => {
  const actual = await vi.importActual('@el-bannawy/lib');
  return {
    ...(actual as Record<string, unknown>),
  };
});

const mockTimestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  fromDate: (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
};

vi.mock('../../lib/repositories/firestore/firestore.service', () => ({
  getFirestoreInstance: () => mockAdminDb,
  toRepositoryError: (error: unknown) => ({
    code: 'INTERNAL' as const,
    message: (error as Error)?.message ?? 'Unknown error',
    retryable: false,
    requestId: '',
  }),
  resetFirestoreInstance: () => {},
  formatFirestoreTimestamp: (value: unknown) => String(value ?? new Date().toISOString()),
  Timestamp: mockTimestamp,
}));

vi.mock('@el-bannawy/lib/repositories/firestore/firestore.service', () => ({
  getFirestoreInstance: () => mockAdminDb,
  toRepositoryError: (error: unknown) => ({
    code: 'INTERNAL' as const,
    message: (error as Error)?.message ?? 'Unknown error',
    retryable: false,
    requestId: '',
  }),
  resetFirestoreInstance: () => {},
  formatFirestoreTimestamp: (value: unknown) => String(value ?? new Date().toISOString()),
  Timestamp: mockTimestamp,
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Re-export for test helpers ────────────────────────────────
export { mockStore, mockAdminDb, mockAdminAuth, MockNextRequest, MockNextResponse };
