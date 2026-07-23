import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ISupportTicketRepository, ISupportTicket, ISupportTicketMessage, ISupportTicketFilter, IGradeSupportContact } from '../contracts';

const COLLECTION_TICKETS = 'supportTickets';
const COLLECTION_GRADE_CONTACTS = 'gradeSupportContacts';

export class SupportTicketRepository implements ISupportTicketRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: ISupportTicket): Promise<RepositoryResult<ISupportTicket>> {
    try {
      await this.db().collection(COLLECTION_TICKETS).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<ISupportTicket | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_TICKETS).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ISupportTicket };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISupportTicket | null>; }
  }

  async update(id: string, input: Partial<ISupportTicket>): Promise<RepositoryResult<ISupportTicket>> {
    try {
      const ref = this.db().collection(COLLECTION_TICKETS).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ISupportTicket };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async list(filter: ISupportTicketFilter): Promise<RepositoryResult<ISupportTicket[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION_TICKETS);
      if (filter.userId) query = query.where('userId', '==', filter.userId);
      if (filter.status) query = query.where('status', '==', filter.status);
      if (filter.assignedTo) query = query.where('assignedTo', '==', filter.assignedTo);
      query = query.orderBy('createdAt', 'desc');
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISupportTicket) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISupportTicket[]>; }
  }

  async addMessage(input: ISupportTicketMessage): Promise<RepositoryResult<ISupportTicketMessage>> {
    try {
      const ref = this.db().collection(COLLECTION_TICKETS).doc(input.ticketId).collection('messages').doc(input.id);
      await ref.set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listMessages(ticketId: string): Promise<RepositoryResult<ISupportTicketMessage[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_TICKETS).doc(ticketId).collection('messages').orderBy('createdAt', 'asc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISupportTicketMessage) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISupportTicketMessage[]>; }
  }

  async resolve(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION_TICKETS).doc(id).update({ status: 'RESOLVED', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async close(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION_TICKETS).doc(id).update({ status: 'CLOSED', closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async getGradeSupportContact(gradeId: string): Promise<RepositoryResult<IGradeSupportContact | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_GRADE_CONTACTS).doc(gradeId).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IGradeSupportContact };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IGradeSupportContact | null>; }
  }

  async upsertGradeSupportContact(input: IGradeSupportContact): Promise<RepositoryResult<IGradeSupportContact>> {
    try {
      const ref = this.db().collection(COLLECTION_GRADE_CONTACTS).doc(input.id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      return { ok: true, value: data };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listGradeSupportContacts(): Promise<RepositoryResult<IGradeSupportContact[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_GRADE_CONTACTS).get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IGradeSupportContact) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IGradeSupportContact[]>; }
  }
}
