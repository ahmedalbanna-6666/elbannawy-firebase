# Activity Plugin Architecture

## Overview

The Activity Plugin system provides a pluggable architecture for supporting different activity types (Multiple Choice, Fill-in-the-Blank, Matching, Speaking, Writing, etc.).

## Plugin Interface

```typescript
interface ActivityPlugin {
  readonly type: 'activity';
  readonly manifest: ActivityManifest;
  validate?(config: unknown): boolean;
  getInitialState?(context: ExecutionContext): unknown;
  render?(context: ExecutionContext): unknown;
  grade?(attempt: StudentAttempt, activity: Activity): {
    score: number;
    maxScore: number;
    feedback?: string;
    correctAnswer?: unknown;
  };
  getCorrectAnswer?(activity: Activity): unknown;
  execute?(context: ExecutionContext): Promise<Partial<ExecutionResult>>;
}
```

## Manifest Structure

```typescript
interface ActivityManifest {
  type: string;           // Unique identifier (e.g., 'multiple-choice')
  version: number;        // Schema version for this activity type
  displayName: string;    // Human-readable name
  description: string;    // Description of the activity type
  category: string;       // Category (assessment, practice, game, etc.)
  renderer: string;       // Reference to the UI renderer component
  validator: string;      // Reference to the config validator
  scorer: string;         // Reference to the scoring implementation
  migration?: string;     // Optional migration function reference
  capabilities: {
    timed: boolean;
    aiSupported: boolean;
    retryable: boolean;
    partialCredit: boolean;
    attachments: boolean;
    shuffle: boolean;
    reviewable: boolean;
  };
}
```

## Registry

The `ActivityPluginRegistry` manages plugin lifecycle:

```typescript
const registry = new ActivityPluginRegistry();
registry.register(multipleChoicePlugin);
registry.register(fillBlankPlugin);
registry.get('multiple-choice');   // Returns plugin instance
registry.has('multiple-choice');   // Boolean check
registry.disable('multiple-choice');
registry.enable('multiple-choice');
registry.unregister('multiple-choice');
```

## Creating a Plugin

1. Define the manifest with capabilities
2. Implement the plugin interface
3. Register with the registry
4. Provide the corresponding renderer component
5. Support grading (optional for practice activities)

## Built-in Activity Types (Planned)

- Multiple Choice
- Fill in the Blank
- Matching
- Drag and Drop
- Speaking (AI-assisted)
- Writing (AI-assisted)
- Listening Comprehension
- Flash Cards
- Crossword
- Word Search
