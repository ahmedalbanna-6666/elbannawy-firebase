# AI_OPERATIONS.md

# El-bannawy Platform

## AI Operations

Version: 2.0.0

---

# Purpose

This document defines all operational aspects of the AI infrastructure.

It covers runtime behavior, provider management, circuit breaker, timeout strategy, retry policies, caching, streaming, cost optimization, monitoring and operational reliability.

---

# Responsibilities

The AI Operations Layer is responsible for:

- Provider Selection
- Request Routing
- Circuit Breaker
- Timeout Management
- Retry Policies
- Rate Limiting
- Cost Management
- AI Cache
- Health Monitoring
- Failover
- Graceful Degradation
- Configuration

---

# Provider Management

Supported Providers

- OpenAI
- Google Gemini
- DeepSeek
- Anthropic Claude

Provider Selection Rules

- Lowest acceptable latency
- Highest availability
- Lowest cost
- Required capabilities
- Regional availability

---

# Circuit Breaker

## States

The circuit breaker has three states for each provider:

```
CLOSED (Normal Operation)
  ↓
OPEN (Provider Failing — Requests Blocked Immediately)
  ↓
HALF_OPEN (Testing Recovery — Limited Requests Allowed)
  ↓
CLOSED or OPEN (Depending on Recovery Result)
```

## Transition Rules

| Transition         | Condition                                                            | Action                                                     |
| ------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| CLOSED → OPEN      | 5 consecutive failures OR latency > 10s threshold within 2min window | Block all requests to this provider. Start cooldown timer. |
| OPEN → HALF_OPEN   | Cooldown period expires (default: 30s)                               | Allow 1 probe request to test recovery.                    |
| HALF_OPEN → CLOSED | Probe request succeeds within timeout                                | Resume normal traffic. Reset failure count.                |
| HALF_OPEN → OPEN   | Probe request fails                                                  | Restart cooldown timer. Increment escalation level.        |

## Failure Thresholds

| Metric               | Threshold  | Window        |
| -------------------- | ---------- | ------------- |
| Consecutive HTTP 5xx | 5 failures | Rolling 2 min |
| Consecutive Timeout  | 5 failures | Rolling 2 min |
| P50 Latency Exceeded | > 10s      | Rolling 1 min |
| P95 Latency Exceeded | > 30s      | Rolling 1 min |

## Escalation

After 3 consecutive OPEN cycles for the same provider:

- Alert the operations team immediately
- Automatically promote secondary provider to primary
- Block the failing provider for 5 minutes (extended cooldown)
- Log detailed failure report

## Per-Provider Isolation

Each provider has an independent circuit breaker instance.

Failure of one provider must never cascade to another provider.

---

# Timeout Strategy

## Layer Timeouts

| Layer                 | Timeout | Behavior                            |
| --------------------- | ------- | ----------------------------------- |
| Network               | 5s      | Fail fast on connection issues      |
| LLM Request           | 15s     | Primary timeout for model inference |
| Streaming First Token | 10s     | Abort if first token not received   |
| RAG Retrieval         | 3s      | Fail RAG, fall back to prompt-only  |
| Context Building      | 1s      | Use partial context if timeout      |
| Validation            | 2s      | Skip validation if timeout          |

## Timeout Hierarchy

```
Client Request (30s total)
  ↓
API Gateway (25s)
  ↓
Orchestrator (20s)
  ↓
Context Builder (1s)
  ↓
RAG Retrieval (3s)
  ↓
LLM Call (15s)
  ↓
Validation (2s)
  ↓
Response
```

Each layer must have its own timeout that is shorter than the parent layer.

Never let a child timeout exceed the parent timeout.

## Timeout Handling

- If Context Builder times out: use default context (student ID, lesson ID only)
- If RAG times out: proceed without retrieved knowledge, log the event
- If LLM times out: attempt secondary provider immediately
- If Validation times out: pass the response through with reduced validation (safety check only)
- If all paths time out: return graceful error

---

# Retry Policy

## Provider Retry

| Attempt | Provider  | Max Wait | Backoff          |
| ------- | --------- | -------- | ---------------- |
| 1       | Primary   | 15s      | Immediate        |
| 2       | Primary   | 20s      | Exponential (2x) |
| 3       | Secondary | 15s      | Immediate        |
| 4       | Secondary | 20s      | Exponential (2x) |

Total maximum wait across all retries: 70s

Client-side timeout (30s) takes precedence — if client disconnects, stop all retries.

## Retryable Failures

| Error Type                 | Retry? | Notes                                 |
| -------------------------- | ------ | ------------------------------------- |
| HTTP 429 (Rate Limited)    | Yes    | Wait for Retry-After header           |
| HTTP 500/502/503           | Yes    | Provider-side error                   |
| Network Error (ECONNRESET) | Yes    | Transient                             |
| Timeout                    | Yes    | Circuit breaker tracks it             |
| HTTP 400 (Bad Request)     | No     | Client error, fail immediately        |
| HTTP 401 (Unauthorized)    | No     | Configuration issue, alert ops        |
| Empty Response             | No     | Treat as model failure, try secondary |

## Retry Budget

- Maximum retries per request: 4 (2 primary + 2 secondary)
- Maximum retries per user per minute: 10
- If retry budget is exhausted: return cached response or graceful failure

---

# Health Check

## Active Health Checks

Every 30 seconds, the system sends a lightweight probe to each provider:

- Simple text completion ("Hello")
- Measure latency
- Validate response is non-empty and safe

If health check fails 3 consecutive times:

- Mark provider as DEGRADED
- Route traffic away from degraded provider
- Alert operations

## Health Endpoint

The AI Operations layer exposes a health endpoint for monitoring:

```
GET /api/v1/admin/system-health

Response:
{
  "providers": {
    "openai": { "status": "healthy", "latency": 340, "lastChecked": "..." },
    "gemini": { "status": "degraded", "latency": 0, "lastChecked": "..." },
    "deepseek": { "status": "healthy", "latency": 280, "lastChecked": "..." }
  },
  "circuitBreakers": {
    "openai": { "state": "closed", "failureCount": 0 },
    "gemini": { "state": "open", "failureCount": 7, "cooldownRemaining": 18 }
  },
  "cache": { "hitRate": 0.72, "size": "1.2 GB" },
  "queue": { "depth": 3, "processing": 12 },
  "overall": "healthy"
}
```

---

# Streaming

Streaming is enabled by default.

Supported

- Partial tokens
- Typing indicators
- Interrupt generation
- Resume stream (Future)

---

# AI Cache

Cache Types

Prompt Cache

Embedding Cache

Response Cache

Lesson Cache

Recommendation Cache

TTL

Prompt

5 Minutes

Response

30 Minutes

Embeddings

Permanent until re-embedding

---

# Rate Limiting

Student

60 requests/hour

Teacher

300 requests/hour

Administrator

Unlimited (Configurable)

Abuse Detection

Automatic throttling

Temporary suspension

---

# Cost Optimization

Strategies

Reuse cached responses

Compress context

Remove duplicated history

Select smaller models when appropriate

Batch embedding requests

Monitor token usage continuously

---

# Configuration

Environment Variables

AI_PROVIDER — Primary provider name

AI_MODEL — Model identifier

AI_TIMEOUT — LLM request timeout (ms, default: 15000)

AI_MAX_TOKENS — Max completion tokens

AI_STREAMING — Enable streaming (true/false)

AI_CACHE_ENABLED — Enable caching (true/false)

AI_RAG_ENABLED — Enable RAG retrieval (true/false)

AI_LOG_LEVEL — Logging verbosity

AI_CIRCUIT_BREAKER_THRESHOLD — Failure count to open (default: 5)

AI_CIRCUIT_BREAKER_COOLDOWN — Cooldown seconds (default: 30)

AI_CIRCUIT_BREAKER_EXTENDED_COOLDOWN — Extended cooldown on escalation (default: 300)

AI_RETRY_MAX_ATTEMPTS — Max retry attempts (default: 4)

AI_RETRY_BUDGET_PER_USER — Retries per user per minute (default: 10)

AI_HEALTH_CHECK_INTERVAL — Health check interval seconds (default: 30)

AI_HEALTH_CHECK_FAILURE_THRESHOLD — Consecutive failures before DEGRADED (default: 3)

AI_TIMEOUT_NETWORK — Network timeout ms (default: 5000)

AI_TIMEOUT_RAG — RAG retrieval timeout ms (default: 3000)

AI_TIMEOUT_CONTEXT — Context building timeout ms (default: 1000)

AI_TIMEOUT_VALIDATION — Response validation timeout ms (default: 2000)

AI_CLIENT_TIMEOUT — Total client-facing timeout ms (default: 30000)

---

# Graceful Degradation

When the AI system cannot return a full response, it must degrade gracefully.

Never show an error page or stack trace to the student.

## Degradation Levels

| Level                  | Condition                     | User Experience                                                                                                |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0 — Full Service       | All systems normal            | Normal AI response with streaming                                                                              |
| 1 — Degraded RAG       | RAG retrieval > 3s or fails   | Response without knowledge citations. Log "RAG_FAILED"                                                         |
| 2 — Secondary Provider | Primary provider circuit open | Same quality, potentially higher latency. Notify user: "Taking a bit longer..."                                |
| 3 — Cached Only        | All providers fail            | Serve semantically similar cached response if available. Notify user: "Using saved answer..."                  |
| 4 — Graceful Message   | No response possible          | Show: "I'm having trouble right now. Please try again in a few minutes." Hide AI panel — do not break the page |

## Degradation Escalation

```
Level 0 → Level 1: RAG timeout (3s)
Level 1 → Level 2: Primary provider circuit open
Level 2 → Level 3: Secondary provider also fails
Level 3 → Level 4: No cache hit for this query
```

## Recovery

System automatically attempts recovery every 30 seconds (cooldown period).

When a probe succeeds, escalate back down one level per successful request:

```
Level 4 → Level 3: First successful cache hit
Level 3 → Level 2: Secondary provider responds
Level 2 → Level 1: Primary provider re-closed
Level 1 → Level 0: RAG normal
```

---

# Monitoring

Metrics

Latency (per layer: network, LLM, RAG, context, validation)

Token Usage

Provider Errors (by error type and provider)

Circuit Breaker State (closed / open / half-open per provider)

Retry Count (per request, per user)

Cost (per request, per provider, per user)

Streaming Duration

Cache Hit Ratio (by cache type)

Fallback Usage (by degradation level)

Health Check Status (healthy / degraded / down per provider)

---

# Alerts

High Cost (per provider, per day)

Provider Failure (circuit breaker OPEN)

Provider Degraded (health check failing)

High Latency (P50 > 5s or P95 > 15s)

Token Explosion (per request > 80% of model limit)

Cache Failure (hit rate < 40% for 3 consecutive checks)

Circuit Breaker Escalation (3rd OPEN cycle)

Retry Budget Exhausted (per user, per minute)

Degradation Level 4 (graceful failure triggered)

No Healthy Providers (all circuits OPEN)

---

# Logging

Log

Provider

Model

Latency

Prompt Size

Completion Size

Cost

Result

Never log

API Keys

Student Secrets

Sensitive Data

---

# Acceptance Criteria

✓ Provider Failover (automatic, within 30s of failure detection)

✓ Circuit Breaker (per-provider isolation, no cascade failures)

✓ Timeout Strategy (per-layer timeouts, never exceed parent timeout)

✓ Retry Policy (max 4 attempts, budget enforcement, exponential backoff)

✓ Health Checks (active probes every 30s, auto-detection of degraded providers)

✓ Graceful Degradation (5 levels, never show errors to students)

✓ Streaming (partial tokens, typing indicators, interrupt)

✓ Cost Control (token monitoring, model selection, cache optimization)

✓ Cache (prompt, response, embedding, lesson, recommendation with TTL)

✓ Monitoring (per-layer latency, circuit state, retry count, degradation level)

✓ Rate Limits (per-role budgets, automatic throttling)

✓ Operational Stability (self-healing, auto-recovery, alert-driven ops)

---

# Final Rule

AI Operations ensure that every AI request is reliable, observable, scalable and cost-efficient.

End of Document.
