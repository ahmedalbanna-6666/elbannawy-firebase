# AI Architecture

## El-bannawy Platform - AI Service Architecture

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose

This document defines the AI service architecture and the role of the vector store in the El-bannawy Platform. It is a design contract only. No implementation is created in Phase 1.

## Architectural Overview

The AI architecture is an **independent service** with clear boundaries:

1. **AI Service (pgvector)** is the operational storage for vector embeddings and semantic search
2. **Firestore** is the operational document store for user data, content, progress, ledger, and state
3. **Cloud Storage** hosts document and media files
4. **Firebase Auth** handles authentication and authorization

## pgvector Usage

pgvector is used to support:
- High-dimensional semantic embeddings for AI/RAG search
- Fast vector similarity queries for knowledge document retrieval
- Scalable vector similarity at production scale (thousands of concurrent queries)
- Persistent storage of learned vector representations

## Independence and Synchronization

### Independent Service Model
pgvector operates as its own database service with:
- Separate deployment and scaling requirements
- Independent backup and disaster recovery
- Dedicated monitoring and alerting
- No cross-schema dependencies with Firestore

### Synchronization Strategy

1. **Two-way synchronization** between Firestore and pgvector:
   - When a `knowledgeDocument` is approved in Firestore, its vector embedding is computed and stored in pgvector
   - When vector data is updated in pgvector, the corresponding metadata in Firestore is kept in sync

2. **Event-driven updates** through backend services:
   - Document approval → Trigger embedding computation → Store vector → Update Firestore metadata
   - Vector updates → Trigger metadata refresh → Update Firestore

3. **Idempotent operations** with version tracking:
   - Both databases use version numbers to track changes
   - Failed sync operations are retried until successful

## Failure Handling

### Partial Failure Scenarios

1. **pgvector unavailable**: 
   - Vector search falls back to metadata-only search
   - Knowledge retrieval continues but without semantic similarity
   - System reports degraded performance to operators

2. **Firestore unavailable**:
   - AI users may still access vector search
   - No new vector data can be created
   - Existing vectors remain accessible until service restart

3. **Synchronization failure**:
   - Operations are idempotent and retried with exponential backoff
   - Failed operations are logged for manual review
   - System maintains consistency between databases through reconciliation jobs

### Recovery Strategy

- Automatic retry mechanisms for transient failures
- Manual reconciliation processes for persistent failures
- Priority queues for critical operations (e.g., document approvals)
- Circuit breaker pattern to prevent cascade failures

## Future Replacement Strategy

### Phased Migration

1. **Phase 1 (Current)**: pgvector as primary vector store, Firestore for operational data
2. **Phase 2**: Consider managed vector database services if available
3. **Phase 3**: Evaluate vector-native document database options if requirements shift

### Backward Compatibility

- Vector data is versioned and can be exported/imported
- Migration paths are designed for zero-downtime
- Current TensorFlow/PyTorch embeddings can be re-computed if needed

## Operational Guarantees

### Vector Store Requirements

- 99.99% uptime SLA
- Sub-second vector similarity queries for up to 10,000 vectors
- Robust vector similarity queries across different embedding providers
- Automated backups with point-in-time recovery
- Network isolation and encryption

### Database Roles

1. **Firestore**: The single source of truth for all operational data
2. **pgvector**: Independent AI vector database focused solely on embeddings
3. **Cloud Storage**: Binary content storage (documents, media files)

## Cross-Validation

### Data Consistency

- Every vector entry has a corresponding metadata record in Firestore
- Vector versions match metadata versions
- Draft vectors are not exposed to users

### Access Control

- Vector access is controlled through the same authentication and authorization as Firestore
- Knowledge document approval ensures vector accessibility
- Vector data is only accessible after proper document approval

## Performance Objectives

### Vector Search

- Sub-millisecond response for small vector sets (≤1,000)
- Sub-100ms response for medium sets (≤10,000)
- Checkpoint performance monitoring with auto-scaling

### Database Operations

- Firestore write latency <300ms
- pgvector write latency <100ms
- Cross-database sync latency <500ms (within SLA)

## Migration Planning

### Current State

- Firestore stores metadata and operational data
- pgvector stores vector embeddings
- Two independent services with synchronization

### Future State

- Firestore remains operational database
- Vector store remains independent AI service
- Clear separation of concerns maintained

## Conclusion

The AI architecture uses pgvector as an independent service that complements Firestore. This design provides:
- Clear operational boundaries
- Independent scaling and deployment
- Robust failure handling and recovery
- Future migration paths
- Maintains Firestore as the single source of truth for operational data