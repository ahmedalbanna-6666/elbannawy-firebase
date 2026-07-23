import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IContentEntitlementRepository, IContentEntitlement } from '../contracts';

const COLLECTION = 'contentEntitlements';

export class ContentEntitlementRepository implements IContentEntitlementRepository {
  private db() { return getFirestoreInstance(); }

  async getByStudentAndContent(studentId: string, contentType: string, contentId: string): Promise<RepositoryResult<IContentEntitlement | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).where('contentType', '==', contentType).where('contentId', '==', contentId).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as IContentEntitlement };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IContentEntitlement | null>; }
  }

  async listByStudent(studentId: string): Promise<RepositoryResult<IContentEntitlement[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).orderBy('activatedAt', 'desc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IContentEntitlement) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IContentEntitlement[]>; }
  }

  async create(input: IContentEntitlement): Promise<RepositoryResult<IContentEntitlement>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
