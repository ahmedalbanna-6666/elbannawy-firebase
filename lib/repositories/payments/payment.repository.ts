import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IPaymentRepository, IPayment, IInvoice } from '../contracts';

const COLLECTION_PAYMENTS = 'payments';
const COLLECTION_INVOICES = 'invoices';

export class PaymentRepository implements IPaymentRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: IPayment): Promise<RepositoryResult<IPayment>> {
    try {
      await this.db().collection(COLLECTION_PAYMENTS).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<IPayment | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_PAYMENTS).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IPayment };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IPayment | null>; }
  }

  async listByStudent(studentId: string): Promise<RepositoryResult<IPayment[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_PAYMENTS).where('studentId', '==', studentId).orderBy('createdAt', 'desc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IPayment) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IPayment[]>; }
  }

  async updateStatus(id: string, status: string, data?: Partial<IPayment>): Promise<RepositoryResult<IPayment>> {
    try {
      const ref = this.db().collection(COLLECTION_PAYMENTS).doc(id);
      const updateData: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
      if (status === 'COMPLETED') updateData['completedAt'] = new Date().toISOString();
      if (status === 'REFUNDED') updateData['refundedAt'] = new Date().toISOString();
      if (data) {
        Object.entries(data).forEach(([key, val]) => { updateData[key] = val; });
      }
      await ref.update(updateData);
      const snap = await ref.get();
      return { ok: true, value: snap.data() as IPayment };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async createInvoice(input: IInvoice): Promise<RepositoryResult<IInvoice>> {
    try {
      await this.db().collection(COLLECTION_INVOICES).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getInvoicesByStudent(studentId: string): Promise<RepositoryResult<IInvoice[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_INVOICES).where('studentId', '==', studentId).orderBy('issuedAt', 'desc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IInvoice) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IInvoice[]>; }
  }
}
