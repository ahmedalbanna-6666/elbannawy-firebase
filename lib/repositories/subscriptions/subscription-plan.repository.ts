import { getFirestoreInstance, toRepositoryError } from "../firestore/firestore.service";
import { RepositoryResult } from "../../shared/types/repository.types";
import type {
  ISubscriptionPlanRepository,
  ISubscriptionPlan,
  ISubscriptionPlanFilter,
} from "../contracts";

const COLLECTION = "subscriptionPlans";

export class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  private db() {
    return getFirestoreInstance();
  }

  async create(input: ISubscriptionPlan): Promise<RepositoryResult<ISubscriptionPlan>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<ISubscriptionPlan | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ISubscriptionPlan };
    } catch (error) {
      return {
        ok: false,
        error: { ...toRepositoryError(error) },
      } as unknown as RepositoryResult<ISubscriptionPlan | null>;
    }
  }

  async list(filter?: ISubscriptionPlanFilter): Promise<RepositoryResult<ISubscriptionPlan[]>> {
    try {
      let query = this.db()
        .collection(COLLECTION)
        .orderBy("sortOrder", "asc") as FirebaseFirestore.Query;
      if (filter?.active !== undefined) query = query.where("active", "==", filter.active);
      if (filter?.type) query = query.where("type", "==", filter.type);
      if (filter?.contentScope) query = query.where("contentScope", "==", filter.contentScope);
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISubscriptionPlan) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<
        ISubscriptionPlan[]
      >;
    }
  }

  async update(
    id: string,
    input: Partial<ISubscriptionPlan>,
  ): Promise<RepositoryResult<ISubscriptionPlan>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      await ref.update({ ...input, updatedAt: new Date().toISOString() });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ISubscriptionPlan };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db()
        .collection(COLLECTION)
        .doc(id)
        .update({ active: false, updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }
}
