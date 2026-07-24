# AI_SEQUENCE_DIAGRAMS.md

# El-bannawy Platform

## AI Component Interaction Diagrams

Version: 1.0.0

---

# Purpose

Defines the interaction flows between platform components using sequence diagrams.

These diagrams show how the AI module integrates with the Curriculum Module, User Module, Quiz Module, Homework Module, and other platform components.

---

# Diagram 1: Student Asks AI a Lesson Question

```
Student      Frontend         AI Gateway      Orchestrator    Curriculum     RAG Engine      LLM Provider
  |              |                |                |               |              |                |
  |-- Question -->|                |                |               |              |                |
  |              |-- POST /ai ---->|                |               |              |                |
  |              |                |-- Authenticate->|               |              |                |
  |              |                |                |-- Get Student->|              |                |
  |              |                |                |<-- Profile ----|              |                |
  |              |                |                |-- Get Lesson-->|              |                |
  |              |                |                |<-- Content ----|              |                |
  |              |                |                |-- Classify Intent             |                |
  |              |                |                |-- Select Agent                |                |
  |              |                |                |-- Embed Query --------------->|                |
  |              |                |                |<-- Top K Chunks --------------|                |
  |              |                |                |-- Build Prompt                |                |
  |              |                |                |-- Call LLM ------------------------------>|
  |              |                |                |<-- Response ---------------------------------|
  |              |                |                |-- Validate Response            |                |
  |              |                |<-- Response ----|                               |                |
  |              |<-- 200 OK -----|                |                               |                |
  |<-- Response--|                |                |                               |                |
  |              |                |                |-- Store Analytics              |                |
```

**Key interactions:**

- Frontend calls AI Gateway with the student's question
- Gateway authenticates the request
- Orchestrator fetches student profile + current lesson from Curriculum Module
- Orchestrator classifies intent and selects the appropriate agent
- RAG Engine performs vector search on lesson content
- LLM generates response using: system prompt + lesson context + RAG results
- Response is validated before returning to student

---

# Diagram 2: AI Generating Personalized Recommendation

```
Student      Frontend         AI Gateway      Recommendation    Curriculum      Quiz Module    Homework
  |              |                |              Engine            Module                        Module
  |-- Dashboard->|                |                |                |               |              |
  |              |-- GET /ai/recommendations -->    |                |               |              |
  |              |                |-- Fetch Progress-------------->|               |              |
  |              |                |<-- Lessons + Units -------------|               |              |
  |              |                |-- Fetch Quiz Results-------------------------->|              |
  |              |                |<-- Scores + Weak Areas ---------|---------------|              |
  |              |                |-- Fetch Homework Status------------------------------------>|
  |              |                |<-- Submission + Grades ---------|---------------|--------------|
  |              |                |-- Generate Recommendations      |               |              |
  |              |                |    (weak skills first)          |               |              |
  |              |                |-- Check Lock Rules ------------>|               |              |
  |              |                |<-- Validated Recommendations ---|               |              |
  |              |<-- 200 OK -----|                                |               |              |
  |<-- Cards ----|                |                                |               |              |
```

**Key interactions:**

- On dashboard load, frontend requests recommendations
- Recommendation Engine pulls data from 3 modules: Curriculum, Quiz, Homework
- Engine prioritizes weak skills over next lessons
- Validates against lock rules (never recommend locked content)
- Returns up to 3 recommendations with explanations

---

# Diagram 3: Admin Configures AI Provider

```
Admin         Frontend          Admin API        AI Operations    Provider SDK    Monitoring
  |              |                 |                  |                |              |
  |-- Open AI Settings -->         |                  |                |              |
  |              |-- GET /admin/settings/ai -->        |                |              |
  |              |                 |-- Fetch Current Config          |                |
  |              |                 |<-- Provider: OpenAI, Model: GPT-5.5 |               |
  |<-- Form -----|                 |                  |                |              |
  |-- Change to Gemini             |                  |                |              |
  |              |-- PATCH /admin/settings/ai          |                |              |
  |              |                 |-- Validate API Key--------------->|              |
  |              |                 |<-- Connection OK -|----------------|              |
  |              |                 |-- Update Config   |                |              |
  |              |                 |-- Circuit Breaker Reset           |              |
  |              |                 |-- Health Check Now--------------->|              |
  |              |                 |<-- Healthy --------|---------------|              |
  |              |                 |-- Log Config Change               |              |
  |<-- Success --|                 |                  |                |              |
  |              |                 |                  |-- Start Monitoring->          |
```

**Key interactions:**

- Admin changes AI provider via Settings page
- System tests the new provider connection before applying
- Circuit breaker state is reset for the new provider
- Health check runs immediately to verify
- Configuration change is logged in audit trail
- Monitoring starts tracking the new provider

---

# Diagram 4: Student Submits Homework + AI Assessment

```
Student      Frontend         Homework Module    AI Assessment    Curriculum     Analytics
  |              |                 |                  |               |              |
  |-- Submit --->|                 |                  |               |              |
  |              |-- POST /homework/submit -->        |               |              |
  |              |                 |-- Store Response                  |              |
  |              |                 |-- Fetch Lesson Context --------->|              |
  |              |                 |<-- Rubric + Expected Answers -----|              |
  |              |                 |-- Request AI Assessment -->       |              |
  |              |                 |                  |-- Score Response              |
  |              |                 |                  |-- Generate Corrections        |
  |              |                 |                  |-- Create Feedback             |
  |              |                 |<-- Assessment ---|               |              |
  |              |                 |-- Store Grade    |               |              |
  |              |                 |-- Award XP       |               |              |
  |              |<-- Result ------|                  |               |              |
  |<-- Feedback -|                 |                  |               |              |
  |              |                 |                  |               |-- Log Event -|
```

**Key interactions:**

- Student submits homework (writing, paragraph, etc.)
- Homework Module stores the response
- Fetches rubric and expected answers from Curriculum
- Sends to AI Assessment Engine for subjective grading
- Assessment Engine scores, corrects grammar, evaluates vocabulary
- Returns structured feedback (score, corrections, improvement tips)
- XP is awarded based on score
- Analytics event logged

---

# Diagram 5: AI Module Health Check & Recovery

```
Monitoring      AI Operations    Circuit Breaker    Provider A      Provider B     Cache
    |                |                 |                |               |              |
    |-- Every 30s trigger health check                |               |              |
    |                |-- Probe Provider A ----------->|               |              |
    |                |<-- Timeout (12s) ---------------|               |              |
    |                |-- Record Failure               |               |              |
    |                |-- Check Threshold (5 failures)                 |              |
    |                |-- OPEN Circuit Breaker ------>|                |              |
    |                |-- Route Traffic to Provider B -------------->|               |
    |                |<-- Success (2s) ---------------------------------|              |
    |                |-- Start Cooldown Timer (30s)   |               |              |
    |                |                                |               |              |
    |                |-- After 30s Send Probe ------>|                |              |
    |                |<-- Success (1.5s) --------------|               |              |
    |                |-- HALF_OPEN → CLOSED -------->|                |              |
    |                |-- Restore Traffic Split                        |              |
    |<-- All Healthy-|                                |               |              |
```

**Key interactions:**

- Health check runs every 30 seconds
- Provider A times out — failure is recorded
- Circuit breaker threshold reached (5 failures) → OPEN state
- Traffic immediately routed to Provider B (healthy)
- Provider A cooldown timer starts
- After 30s, probe request sent to Provider A
- Probe succeeds → circuit transitions HALF_OPEN → CLOSED
- Traffic restored to both providers

---

# Acceptance Criteria

✓ All key integration paths are documented with sequence diagrams

✓ Each diagram shows the complete request-response flow

✓ Error paths are shown (timeouts, failures, fallbacks)

✓ Component boundaries are clearly defined

✓ Diagrams are kept in sync with implementation changes

---

# Final Rule

Sequence diagrams are the bridge between architecture documentation and implementation.

Every significant cross-component flow must be documented as a sequence diagram before implementation.

End of Document.
