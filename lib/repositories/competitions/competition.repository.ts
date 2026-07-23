import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ICompetitionRepository, ICompetition, ICompetitionParticipant, ICompetitionQuestion, ICompetitionAttempt, ICompetitionFilter } from '../contracts';

const COLLECTION_COMPETITIONS = 'competitions';
const COLLECTION_PARTICIPANTS = 'competitionParticipants';
const COLLECTION_QUESTIONS = 'competitionQuestions';
const COLLECTION_ATTEMPTS = 'competitionAttempts';

export class CompetitionRepository implements ICompetitionRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: Partial<ICompetition>): Promise<RepositoryResult<ICompetition>> {
    try {
      const data = { ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), schemaVersion: 1 } as ICompetition;
      await this.db().collection(COLLECTION_COMPETITIONS).doc(data.id).set(data);
      return { ok: true, value: data };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<ICompetition | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_COMPETITIONS).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ICompetition };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetition | null>; }
  }

  async update(id: string, input: Partial<ICompetition>): Promise<RepositoryResult<ICompetition>> {
    try {
      const ref = this.db().collection(COLLECTION_COMPETITIONS).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ICompetition };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION_COMPETITIONS).doc(id).delete();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async list(filter: ICompetitionFilter): Promise<RepositoryResult<ICompetition[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION_COMPETITIONS);
      if (filter.gradeId) query = query.where('gradeId', '==', filter.gradeId);
      if (filter.teacherId) query = query.where('teacherId', '==', filter.teacherId);
      if (filter.status) query = query.where('status', '==', filter.status);
      query = query.orderBy('createdAt', 'desc');
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICompetition) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetition[]>; }
  }

  async createParticipant(input: ICompetitionParticipant): Promise<RepositoryResult<ICompetitionParticipant>> {
    try {
      await this.db().collection(COLLECTION_PARTICIPANTS).doc(input.id).set(input as unknown as Record<string, unknown>);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getParticipant(competitionId: string, studentId: string): Promise<RepositoryResult<ICompetitionParticipant | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_PARTICIPANTS).where('competitionId', '==', competitionId).where('studentId', '==', studentId).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as ICompetitionParticipant };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetitionParticipant | null>; }
  }

  async listParticipants(competitionId: string): Promise<RepositoryResult<ICompetitionParticipant[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_PARTICIPANTS).where('competitionId', '==', competitionId).orderBy('score', 'desc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICompetitionParticipant) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetitionParticipant[]>; }
  }

  async updateParticipant(id: string, input: Partial<ICompetitionParticipant>): Promise<RepositoryResult<ICompetitionParticipant>> {
    try {
      const ref = this.db().collection(COLLECTION_PARTICIPANTS).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ICompetitionParticipant };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async createQuestion(input: ICompetitionQuestion): Promise<RepositoryResult<ICompetitionQuestion>> {
    try {
      await this.db().collection(COLLECTION_QUESTIONS).doc(input.id).set(input as unknown as Record<string, unknown>);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listQuestions(competitionId: string): Promise<RepositoryResult<ICompetitionQuestion[]>> {
    try {
      const snap = await this.db().collection(COLLECTION_QUESTIONS).where('competitionId', '==', competitionId).orderBy('displayOrder', 'asc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICompetitionQuestion) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetitionQuestion[]>; }
  }

  async createAttempt(input: ICompetitionAttempt): Promise<RepositoryResult<ICompetitionAttempt>> {
    try {
      await this.db().collection(COLLECTION_ATTEMPTS).doc(input.id).set(input as unknown as Record<string, unknown>);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getAttempt(competitionId: string, studentId: string): Promise<RepositoryResult<ICompetitionAttempt | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_ATTEMPTS).where('competitionId', '==', competitionId).where('studentId', '==', studentId).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as ICompetitionAttempt };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICompetitionAttempt | null>; }
  }
}
