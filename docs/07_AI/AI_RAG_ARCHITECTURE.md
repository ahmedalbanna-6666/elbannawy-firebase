# AI_RAG_ARCHITECTURE.md

# El-bannawy Platform

## Retrieval-Augmented Generation (RAG)

Version: 2.0.0

---

# Purpose

Defines the Retrieval-Augmented Generation architecture.

RAG is the only approved knowledge source for educational responses.

---

# Knowledge Sources

Lesson Content

Vocabulary

Grammar Notes

Stories

Homework

Teacher Notes

Official Curriculum

Platform Documentation

---

# Retrieval Flow

Student Question

↓

Embedding

↓

Vector Search

↓

Top K Results

↓

Prompt Builder

↓

LLM

↓

Validated Response

---

# Vector Database

Provider Agnostic

Examples

Qdrant

Pinecone

Weaviate

pgvector

Version 1

PostgreSQL + pgvector

---

# Hybrid Search

Version 1 uses pure semantic (vector) search.

Version 2 must implement hybrid search combining dense vectors with keyword (BM25) search.

## Why Hybrid Search

- Semantic search excels at understanding intent but can miss exact keyword matches (e.g., "past perfect continuous").
- Keyword search captures exact terminology but misses synonyms and context.
- Hybrid search combines both for maximum recall.

## Hybrid Search Strategy

```
Student Question
  ↓
Dense Embedding (vector) ──┐
                           ├──> Weighted Fusion → Top K Results
BM25 Keyword Searcher  ────┘
```

## Fusion Strategy

- Reciprocal Rank Fusion (RRF): `score = 1/(k + rank_vector) + 1/(k + rank_keyword)`
- Default k = 60 (standard RRF constant)
- Vector weight: 0.7, Keyword weight: 0.3 (configurable)

## Fallback

If vector search returns < 3 results with similarity > 0.7:

- Increase BM25 weight to 0.6
- Expand keyword query with WordNet synonyms
- If still < 3 results, expand search to parent unit/grade

---

# Chunk Size

500–1000 Tokens

Overlap

100 Tokens

---

# Metadata

Lesson

Unit

Grade

Difficulty

Language

Topic

Version

---

# Ranking

Semantic Similarity

Curriculum Priority

Lesson Priority

Recency

Confidence

---

# Evaluation Metrics

## Retrieval Quality Metrics

| Metric                                       | Definition                                                    | Target | Measured |
| -------------------------------------------- | ------------------------------------------------------------- | ------ | -------- |
| Hit Rate                                     | % of queries where top-K contains at least one relevant chunk | > 90%  | Weekly   |
| Mean Reciprocal Rank (MRR)                   | Average reciprocal rank of the first relevant result          | > 0.85 | Weekly   |
| Normalized Discounted Cumulative Gain (NDCG) | Ranking quality weighted by relevance position                | > 0.80 | Weekly   |
| Precision@K                                  | % of retrieved chunks that are relevant                       | > 70%  | Weekly   |
| Recall@K                                     | % of all relevant chunks that were retrieved                  | > 80%  | Weekly   |

## Retrieval Latency Metrics

| Metric              | Target  | P95 Target |
| ------------------- | ------- | ---------- |
| P50 Embedding Time  | < 200ms | < 500ms    |
| P50 Vector Search   | < 100ms | < 300ms    |
| P50 Total Retrieval | < 500ms | < 1s       |

## Quality Assurance Pipeline

Every week, run an automated evaluation using a curated test set of 200+ question-answer pairs drawn from real student conversations.

The test set is versioned and stored alongside the knowledge base.

Results are logged to the AI Analytics dashboard.

If any metric falls below target for 2 consecutive weeks, trigger a knowledge base review.

---

# Feedback Loop

## Explicit Feedback

After each AI response, the student may rate it:

```
[ 👍 Helpful ]  [ 👎 Not Helpful ]  [ ✏ Report Incorrect ]
```

- **Helpful**: Logged as positive signal. No further action.
- **Not Helpful**: Logged as negative signal. Triggers a review flag if same user rates 3+ responses negatively in a session.
- **Report Incorrect**: Opens a text input for the student to explain why. This is sent to a review queue for teachers/admins.

## Implicit Feedback

The system automatically detects:

| Signal                                       | Detection                                    | Action                              |
| -------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| Student rephrases question                   | Same intent, new question within 30s         | Log as "retrieval miss"             |
| Student abandons conversation                | No response for > 5min after AI answer       | Log as "likely unhelpful"           |
| Student asks follow-up clarification         | "I don't understand", "Can you explain more" | Log as "insufficient explanation"   |
| Student switches to different topic          | Immediately after response                   | Log as "off-topic retrieval"        |
| Student repeats same mistake after AI advice | Same error in homework/quiz                  | Log as "ineffective recommendation" |

## Review Queue

All "Report Incorrect" submissions and accumulated negative implicit signals are sent to a moderation queue accessible by teachers and administrators.

Each review item contains:

- Original student question
- Retrieved chunks (with excerpts)
- AI response
- Student feedback / implicit signal
- Timestamp

Reviewers can:

- Mark as "Correct — student misunderstanding"
- Mark as "Incorrect retrieval — flag knowledge base"
- Mark as "Incorrect response — flag prompt"
- Dismiss

## Feedback-Driven Improvements

When a chunk is flagged as incorrect by reviewers:

1. The chunk is quarantined (removed from active retrieval).
2. A notification is sent to the content team.
3. The chunk author receives a task to review and fix.
4. After fix, re-embedding is triggered.
5. The quarantined chunk is restored after successful re-embedding.

## Metrics Dashboard

The RAG Feedback Loop dashboard (admin only) displays:

- Helpful rate (last 7 days / 30 days)
- Not helpful rate
- Report rate
- Average review resolution time
- Top failing chunks (most flagged)
- Top failing queries (most rephrased)
- Knowledge base health score (aggregate of all metrics)

---

# Response Rules

Never answer without retrieved evidence.

Always cite lesson context internally.

---

# Acceptance Criteria

✓ Accurate Retrieval (Hit Rate > 90%, MRR > 0.85)

✓ Fast Search (P50 < 500ms, P95 < 1s)

✓ Curriculum Aware

✓ Hybrid Search (dense + BM25 with RRF fusion)

✓ Evaluation Pipeline (automated weekly, 200+ test queries)

✓ Feedback Loop (explicit rating + implicit signals + review queue)

✓ Self-Improving (flagged chunks auto-quarantined, content team notified)

✓ Scalable

---

# Final Rule

RAG is the primary knowledge source.

The LLM is responsible for explanation, not knowledge storage.

End of Document.
