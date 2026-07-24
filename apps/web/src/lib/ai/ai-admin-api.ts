import { api } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query";

export interface AiConfig {
  provider: string;
  apiKey: string;
  model: string;
  endpoint: string;
  ragEnabled: boolean;
  ragMaxResults: number;
  ragSimilarityThreshold: number;
  temperature: number;
  maxTokens: number;
  updatedAt: string | null;
}

export interface AiConsumptionLimits {
  studentDailyLimit: number;
  studentMonthlyLimit: number;
  studentTokensPerDay: number;
  studentTokensPerMonth: number;
  teacherDailyLimit: number;
  teacherMonthlyLimit: number;
  limitType: "messages" | "tokens";
  resetPeriod: "daily" | "monthly";
  updatedAt: string | null;
}

export interface AiTokenPricingPlan {
  id: string;
  name: string;
  description: string | null;
  minTokens: number;
  maxTokens: number | null;
  coinsPerToken: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AI_ADMIN_KEYS = {
  config: ["admin", "ai", "config"] as const,
  limits: ["admin", "ai", "limits"] as const,
  pricing: ["admin", "ai", "pricing"] as const,
};

export function useAiConfig(): UseQueryResult<AiConfig | null> {
  return useQuery({
    queryKey: AI_ADMIN_KEYS.config,
    queryFn: async () => {
      const res = await api.get<AiConfig>("/admin/ai/config");
      return res.data ?? null;
    },
    staleTime: 30_000,
  });
}

export function useUpdateAiConfig(): UseMutationResult<unknown, Error, Partial<AiConfig>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/admin/ai/config", data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: AI_ADMIN_KEYS.config }); },
  });
}

export function useAiLimits(): UseQueryResult<AiConsumptionLimits | null> {
  return useQuery({
    queryKey: AI_ADMIN_KEYS.limits,
    queryFn: async () => {
      const res = await api.get<AiConsumptionLimits>("/admin/ai/limits");
      return res.data ?? null;
    },
    staleTime: 30_000,
  });
}

export function useUpdateAiLimits(): UseMutationResult<unknown, Error, Partial<AiConsumptionLimits>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/admin/ai/limits", data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: AI_ADMIN_KEYS.limits }); },
  });
}

export function useAiPricingPlans(): UseQueryResult<AiTokenPricingPlan[]> {
  return useQuery({
    queryKey: AI_ADMIN_KEYS.pricing,
    queryFn: async () => {
      const res = await api.get<AiTokenPricingPlan[]>("/admin/ai/pricing");
      return res.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCreateAiPricingPlan(): UseMutationResult<
  unknown,
  Error,
  { name: string; description?: string; minTokens: number; maxTokens?: number; coinsPerToken: number }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/admin/ai/pricing", data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: AI_ADMIN_KEYS.pricing }); },
  });
}

export function useUpdateAiPricingPlan(): UseMutationResult<
  unknown,
  Error,
  { id: string; data: Partial<AiTokenPricingPlan> }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/ai/pricing/${id}`, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: AI_ADMIN_KEYS.pricing }); },
  });
}

export function useDeleteAiPricingPlan(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/ai/pricing/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: AI_ADMIN_KEYS.pricing }); },
  });
}
