# AI_ORCHESTRATOR.md

# El-bannawy Platform

## AI Orchestrator

Version: 2.0.0

---

# Purpose

Defines the orchestration layer responsible for coordinating AI requests.

The Orchestrator decides:

- Which agent to use (via intent classification with confidence thresholds)
- Which context to load (current lesson, student profile, memory)
- Which provider to call (primary, secondary, fallback)
- Which response to return (validated, safe, educational)

The Orchestrator is the single decision-making layer for every AI request.

---

# Workflow

```
Request
  ↓
Authentication (JWT validation, user lookup)
  ↓
Rate Limit Check (per-role budget)
  ↓
Intent Classification (confidence-scored, threshold-gated)
  ↓
Moderation Check (safety + prompt injection)
  ↓
Context Builder (student profile + lesson + memory)
  ↓
RAG Retrieval (semantic + keyword hybrid)
  ↓
Agent Selection (routed to exactly one specialized agent)
  ↓
LLM Call (with circuit breaker, timeout, retry)
  ↓
Response Validation (safety + curriculum + format)
  ↓
Analytics Logging (latency, tokens, cost, agent, intent)
  ↓
Response
```

Each step has a defined timeout (see AI_OPERATIONS.md) — if any step exceeds its timeout, the system degrades gracefully.

---

# Intent Classification

## Classifier

The Orchestrator uses a lightweight classifier to map student requests to intent categories.

Implementation options:

- Fine-tuned BERT model (distilled, < 100ms inference)
- LLM-based zero-shot classification (when BERT confidence < 0.6)

## Intent Categories & Confidence Thresholds

| Intent              | Confidence Threshold | Selected Agent                | Fallback Agent  |
| ------------------- | -------------------- | ----------------------------- | --------------- |
| lesson_explanation  | > 0.7                | Lesson Agent                  | General Agent   |
| grammar_question    | > 0.7                | Grammar Agent                 | Lesson Agent    |
| vocabulary_question | > 0.7                | Vocabulary Agent              | Lesson Agent    |
| homework_help       | > 0.7                | Homework Agent                | Lesson Agent    |
| writing_review      | > 0.7                | Writing Agent                 | Grammar Agent   |
| reading_help        | > 0.7                | Reading Agent                 | Lesson Agent    |
| speaking_practice   | > 0.7                | Speaking Agent                | General Agent   |
| quiz_practice       | > 0.7                | Quiz Agent                    | Lesson Agent    |
| recommendation      | > 0.7                | Recommendation Agent          | Lesson Agent    |
| translation         | > 0.7                | Lesson Agent (bilingual mode) | General Agent   |
| image_analysis      | > 0.7                | Lesson Agent (vision mode)    | General Agent   |
| pdf_analysis        | > 0.7                | Lesson Agent (document mode)  | General Agent   |
| general             | < 0.7 for all        | General Lesson Agent          | Cached Response |

## Strict Routing Rules

1. **One agent per request**: A request is routed to exactly one specialized agent. No chaining between agents in a single request.
2. **Re-routing limit**: Maximum 1 re-route per request. After that, the General Lesson Agent handles it.
3. **Unknown intent**: If confidence for all intents is < 0.5, route directly to General Lesson Agent.
4. **Edge case — multiple intents with high confidence**: If two intents both have confidence > 0.7 and the difference is < 0.05, route based on the current lesson context (if the student is in a grammar lesson → grammar_question wins).

## Re-routing Rules (per-agent boundaries)

| Current Agent    | Can Re-route To             | Cannot Re-route To |
| ---------------- | --------------------------- | ------------------ |
| Lesson Agent     | Grammar, Vocabulary         | Homework, Writing  |
| Grammar Agent    | Lesson, Vocabulary          | Homework, Writing  |
| Vocabulary Agent | Lesson, Grammar             | Homework, Writing  |
| Homework Agent   | Lesson, Grammar, Vocabulary | Writing, Speaking  |
| Writing Agent    | Grammar, Vocabulary         | Homework, Speaking |
| Reading Agent    | Lesson, Vocabulary          | Homework, Writing  |
| Speaking Agent   | Lesson, Vocabulary          | Grammar, Writing   |
| Quiz Agent       | Lesson, Grammar, Vocabulary | Homework, Writing  |

---

# Context Building

The Orchestrator assembles context before passing it to the agent.

## Context Assembly Order

```
1. Student Profile (grade, stage, language preference)
2. Current Lesson (lesson ID, unit ID, lesson content summary)
3. Student Progress (completed lessons, current position)
4. Conversation History (last 5 exchanges, summarized if too long)
5. AI Memory (weak skills, strong skills, preferred style)
6. RAG Results (top 5 retrieved chunks)
7. Platform Settings (features enabled, AI availability)
```

## Context Rules

- Only include fields relevant to the selected agent.
- Maximum context size: model-specific (use compression for long conversations).
- Never include: student passwords, payment data, other students' data.

---

# Fallback Strategy

```
Primary Agent (selected by intent classification)
  ↓ on failure
General Lesson Agent (catch-all agent)
  ↓ on failure
Cached Response (semantically similar to current question)
  ↓ on failure
Graceful Degradation (Level 4 — friendly error message, see AI_OPERATIONS.md)
```

## Fallback Triggers

| Trigger                            | Action                                    |
| ---------------------------------- | ----------------------------------------- |
| Agent not available (circuit open) | Route to General Lesson Agent immediately |
| Agent times out (15s LLM limit)    | Route to General Lesson Agent             |
| Agent returns empty response       | Try secondary provider with same agent    |
| General Agent also fails           | Serve cached response                     |
| No cache hit                       | Return graceful degradation message       |
| Moderation blocks request          | Do not fallback — return blocked response |

---

# Monitoring & Logging

Every orchestration decision is logged with:

```
{
  "requestId": "uuid",
  "userId": "uuid",
  "intent": "grammar_question",
  "confidence": 0.89,
  "selectedAgent": "Grammar Agent",
  "provider": "openai",
  "model": "gpt-5.5",
  "contextSize": 1240,
  "ragChunksRetrieved": 5,
  "latencyMs": {
    "total": 2340,
    "intentClassification": 85,
    "contextBuilding": 210,
    "ragRetrieval": 340,
    "llmCall": 1650,
    "validation": 55
  },
  "tokensUsed": {
    "prompt": 420,
    "completion": 180
  },
  "cost": 0.0023,
  "circuitBreakerState": "closed",
  "retryCount": 0,
  "cacheHit": false,
  "reRouted": false
}
```

## Dashboard Metrics

- Routing accuracy (manual audit sample, weekly)
- Average confidence per intent
- Re-route rate (should be < 5%)
- Fallback rate (should be < 2%)
- Latency P50 / P95 per intent category
- Agent distribution (% of traffic per agent)

---

# Acceptance Criteria

✓ Correct Routing (accuracy > 90% on audit)

✓ Fast Intent Classification (< 100ms)

✓ Scalable (stateless, horizontal scaling)

✓ Observable (every decision logged with confidence, latency, cost)

✓ Resilient (fallback chain handles all failure modes)

✓ Bounded (one agent per request, max 1 re-route)

✓ Safe (moderation before any agent invocation)

---

# Final Rule

The Orchestrator is the single decision-making layer for every AI request.

Every decision must be intentional, logged, and measurable.

End of Document.
