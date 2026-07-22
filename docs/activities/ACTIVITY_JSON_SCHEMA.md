# Activity JSON Schema

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 7.0 — Architecture Design (Pre-Implementation)  
Last Updated: 2026-07-22

---

## Overview

Every Activity stores its type-specific data in the `config` field. The `config` is an opaque JSON blob to the engine — it is validated, interpreted, and scored only by the type-specific plugin.

This document defines the generic config envelope and the per-type config schemas.

---

## Generic Config Envelope

```typescript
config: {
  schemaVersion: number         // Version of this type's config schema (default: 1)
  data: unknown                 // Type-specific payload
}
```

The engine reads `schemaVersion` to determine if migration is needed before delivering to the plugin.

---

## Schema Validation Principles

1. **Each plugin owns its schema.** The plugin registers a Zod schema (or equivalent) at registration time.
2. **Schemas are additive.** New fields may be added in new versions. Existing fields are never removed without deprecation.
3. **Migration functions are registered alongside the plugin.** They run transparently on read.
4. **StudentAttempt snapshots the schema version.** The attempt knows which version of the config was active at submission time.

---

## Per-Type Config Schemas

### 1. MCQ (`mcq`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    question: string                    // Question text (rich text)
    options: Array<{
      id: string                        // Option identifier
      text: string                      // Display text (rich text)
      imageUrl?: string                 // Optional image option
    }>
    correctAnswer: string | string[]    // ID of correct option, or IDs for multi-select
    multiSelect: boolean                // Allow multiple selections (default: false)
    shuffle: boolean                    // Shuffle option order (default: true)
    explanation?: string                // Shown after answering
    revealAnswerAfterSubmission: boolean// Show correct answer after grading (default: true)
    imageLayout?: "inline" | "grid"     // Layout for image-based MCQ
  }
}
```

---

### 2. True/False (`true-false`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    statement: string                   // Statement to evaluate
    correctAnswer: boolean              // True or false
    explanation?: string                // Optional explanation
  }
}
```

---

### 3. Matching (`matching`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    pairs: Array<{
      id: string                        // Pair identifier
      left: string                      // Left column item (text or image URL)
      right: string                     // Right column item (text or image URL)
    }>
    shuffle: boolean                    // Shuffle left column (default: true)
    shuffleRight: boolean               // Shuffle right column (default: true)
    leftLabel?: string                  // Optional header for left column
    rightLabel?: string                 // Optional header for right column
  }
}
```

---

### 4. Fill in the Blank (`fill-blank`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    text: string                        // Text with {{blank}} placeholders
    blanks: Array<{
      id: string                        // Blank identifier
      correctAnswer: string             // Primary correct answer
      acceptableAnswers: string[]       // Alternative correct answers
      caseSensitive: boolean            // Default: false
      trimWhitespace: boolean           // Default: true
      maxLength?: number                // Max characters allowed
      placeholder?: string              // Placeholder text in input
    }>
    mode: "input" | "dropdown"          // Input mode (default: "input")
    dropdownOptions?: {                  // Required if mode is "dropdown"
      [blankId: string]: string[]       // Options for each blank
    }
  }
}
```

---

### 5. Drag & Drop Ordering (`drag-order`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    items: Array<{
      id: string                        // Item identifier
      content: string                   // Display content (text or image URL)
    }>
    correctOrder: string[]              // Ordered array of item IDs
    gradingMode: "exact" | "adjacent" | "positional"
    // exact: all items must be in correct position
    // adjacent: partial credit for correct adjacent pairs
    // positional: each item in correct position gets credit
    vertical: boolean                   // Vertical or horizontal layout (default: true)
  }
}
```

---

### 6. Flashcards (`flashcard`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    cards: Array<{
      id: string
      front: string                     // Front side content (rich text)
      back: string                      // Back side content (rich text)
      hint?: string                     // Optional hint
      imageUrl?: string                 // Front image
      backImageUrl?: string             // Back image
      audioUrl?: string                 // Front audio
      backAudioUrl?: string             // Back audio
    }>
    shuffle: boolean                    // Shuffle card order (default: true)
    showBothSides: boolean              // Show front and back simultaneously (default: false)
  }
}
```

---

### 7. Vocabulary Card (`vocab-card`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    vocabulary: Array<{
      id: string
      term: string
      definition: string
      partOfSpeech?: string
      exampleSentence?: string
      phonetic?: string
      imageUrl?: string
      audioUrl?: string
      synonyms?: string[]
      antonyms?: string[]
      collocations?: string[]           // Common word pairings
    }>
    showDefinition: boolean             // Show definition alongside term (default: true)
    quizMode: boolean                   // Enable quiz mode (default: false)
    quizType?: "definition" | "term" | "example" // Quiz direction
  }
}
```

---

### 8. Reading Passage (`reading`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    passages: Array<{
      id: string
      title: string
      body: string                      // Rich text (HTML or Markdown)
      source?: string
      wordCount?: number
      lexileLevel?: string
      imageUrl?: string
      audioUrl?: string                 // Narration audio
    }>
    questions: Array<{
      id: string
      type: "mcq" | "fill-blank" | "true-false"
      passageId?: string                // Link to specific passage
      embedAfterParagraph?: number      // Show after this paragraph
      config: unknown                   // Type-specific question config
    }>
    showGlossary: boolean               // Enable inline glossary (default: true)
    glossary?: Array<{
      term: string
      definition: string
    }>
  }
}
```

---

### 9. Listening Exercise (`listening`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    audio: {
      url: string
      duration: number                  // Seconds
      transcript?: string
      transcriptVisible: boolean        // Show transcript (default: false)
      allowSpeedControl: boolean        // Allow playback speed change (default: true)
      maxPlays?: number                 // Max play count (null = unlimited)
      autoplay: boolean                 // Auto-play on load (default: false)
    }
    questions: Array<{
      id: string
      type: "mcq" | "fill-blank" | "true-false"
      timestamp?: number                // At which second this question appears
      config: unknown
    }>
    showQuestionsBeforeListening: boolean // Show questions before audio starts (default: false)
  }
}
```

---

### 10. Writing Prompt (`writing`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    prompt: string                      // Main prompt (rich text)
    instructions?: string               // Additional instructions
    wordLimit: {
      min?: number                      // Minimum words (default: 0)
      max?: number                      // Maximum words (default: no limit)
    }
    rubric: {
      criteria: Array<{
        name: string
        weight: number                  // Sum of all weights = 100
        description: string
        levels?: Array<{
          label: string                 // e.g. "Excellent", "Good", "Needs Improvement"
          points: number                // Points for this level
          description: string
        }>
      }>
    }
    aiAssisted: boolean                 // Enable AI grading (default: false)
    aiInstructions?: string             // Specific instructions for AI evaluator
  }
}
```

---

### 11. Speaking Prompt (`speaking`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    prompt: string
    instructions?: string
    timeLimit: number                   // Recording time limit (seconds)
    preparationTime?: number            // Preparation time before recording
    allowReRecording: boolean           // Allow re-recording before submission
    maxRecordings?: number              // Maximum recordings (if re-recording allowed)
    rubric: {
      criteria: Array<{
        name: string
        weight: number
        description: string
        levels?: Array<{ label: string; points: number; description: string }>
      }>
    }
    aiAssisted: boolean
    aiInstructions?: string
  }
}
```

---

### 12. Conversation (`conversation`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    scenario: string
    role: string                        // Student's role in conversation
    aiRole: string                      // AI's character/role
    systemPrompt: string                // System prompt to configure AI behavior
    initialMessage: string              // AI's opening message
    maxTurns: number                    // Max student-AI exchanges
    context?: string                    // Setup context
    completionCriteria: "turns" | "goal" // What constitutes completion
    completionGoal?: string             // Description of completion goal
    language: string                    // Target language code
    rubric: {
      criteria: Array<{
        name: string
        weight: number
        description: string
      }>
    }
  }
}
```

---

### 13. Story (`story`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    story: {
      title: string
      body: string                      // Multi-paragraph text (rich text)
      author?: string
      source?: string
      wordCount?: number
      difficulty?: string
      coverImageUrl?: string
      audioUrl?: string                 // Narration
    }
    paginate: boolean                   // Split body into pages (default: true)
    pagesPerScreen: number              // Pages shown at once (default: 1)
    questions: Array<{
      id: string
      type: "mcq" | "fill-blank" | "true-false"
      pageIndex?: number                // Show after this page
      config: unknown
    }>
    glossary?: Array<{ term: string; definition: string }>
  }
}
```

---

### 14. Grammar Exercise (`grammar`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    grammarTopic: string                // e.g. "Present Perfect vs Past Simple"
    instruction: string
    questions: Array<{
      id: string
      type: "mcq" | "fill-blank" | "matching" | "drag-order"
      config: unknown
    }>
    showExplanation: boolean            // Show grammar explanation (default: true)
    explanation?: string                // Grammar rule explanation
  }
}
```

---

### 15. Game (`game`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    gameType: string                    // e.g. "word-search", "crossword", "memory"
    settings: Record<string, unknown>   // Game-type-specific settings
    content: {                          // Game content
      words?: string[]
      clues?: Array<{ clue: string; answer: string }>
      pairs?: Array<{ a: string; b: string }>
      // Type-specific content fields
    }
    pointsConfig: {
      correctAnswer: number
      bonusTime?: number                // Bonus for fast answers
      streakBonus?: number
      perfectScore?: number             // Bonus for all correct
    }
    timeLimit?: number
    difficulty?: "easy" | "medium" | "hard"
  }
}
```

---

### 16. AI Dialogue (`ai-dialogue`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    scenario: string
    systemPrompt: string                // AI system prompt
    initialMessage: string              // AI first message
    maxTurns: number
    completionCriteria: string
    language: string
    persona?: string
    context?: string
    model?: string                      // AI model to use (default: configured default)
    temperature?: number                // AI creativity (0.0 - 1.0)
  }
}
```

---

### 17. AI Writing Review (`ai-writing`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    prompt: string
    rubric: {
      criteria: Array<{
        name: string
        weight: number
        description: string
      }>
    }
    aiInstructions: string              // Instructions for the AI evaluator
    feedbackLevel: "basic" | "detailed" | "comprehensive"
    showScore: boolean                  // Show AI score to student (default: true)
    maxScore?: number
  }
}
```

---

### 18. AI Speaking Review (`ai-speaking`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    prompt: string
    rubric: {
      criteria: Array<{
        name: string
        weight: number
        description: string
      }>
    }
    aiInstructions: string
    languageLevel: string               // For pronunciation baseline
    feedbackLevel: "basic" | "detailed"
    showScore: boolean
  }
}
```

---

### 19. Homework (`homework`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    title: string
    instructions?: string
    dueDate?: string                    // ISO date
    activities: Array<{
      id: string
      type: ActivityType
      title: string
      config: unknown                   // Embedded activity config
    }>
    aggregateScoring: "average" | "sum" | "best" | "allRequired"
    passingScore?: number
    allowLateSubmission: boolean        (default: false)
    latePenaltyRate?: number            // Percentage deducted per day late
  }
}
```

---

### 20. Exam (`exam`)

```typescript
config: {
  schemaVersion: 1,
  data: {
    title: string
    instructions?: string
    timeLimit: number                   // Total time in seconds
    passingScore: number                // Percentage to pass
    shuffleQuestions: boolean           // Randomize question order
    showResults: boolean                // Show results immediately (default: true)
    showCorrectAnswers: boolean         // Show correct answers after (default: true)
    allowReview: boolean                // Allow reviewing answers before final submit
    sections: Array<{
      id: string
      title: string
      weight: number                    // Section weight in total score
      timeLimit?: number                // Section time limit
      shuffleWithinSection: boolean     (default: false)
      activities: Array<{
        id: string
        type: ActivityType
        title: string
        points: number                  // Points for this question
        config: unknown
      }>
    }>
  }
}
```

---

## Answer Schema

Each activity type defines its answer format. The answer is stored in `StudentAttempt.answer`.

| Type | Answer Format |
|------|---------------|
| mcq | `string \| string[]` — selected option ID(s) |
| true-false | `boolean` |
| matching | `Array<{ leftId: string, rightId: string }>` |
| fill-blank | `Array<{ blankId: string, value: string }>` |
| drag-order | `string[]` — ordered item IDs |
| flashcard | `Array<{ cardId: string, rating: "easy" \| "medium" \| "hard" }>` |
| vocab-card | `Array<{ vocabId: string, answer: string }>` |
| reading | `Array<{ questionId: string, answer: unknown }>` |
| listening | `Array<{ questionId: string, answer: unknown }>` |
| writing | `{ text: string, wordCount: number }` |
| speaking | `{ audioUrl: string, duration: number }` |
| conversation | `Array<{ turn: number, message: string }>` |
| story | `Array<{ questionId: string, answer: unknown }>` |
| grammar | `Array<{ questionId: string, answer: unknown }>` |
| game | `{ score: number, answers: unknown[] }` |
| ai-dialogue | `Array<{ turn: number, message: string }>` |
| ai-writing | `{ text: string }` |
| ai-speaking | `{ audioUrl: string }` |
| homework | `Array<{ activityId: string, answer: unknown }>` |
| exam | `Array<{ sectionId: string, activityId: string, answer: unknown }>` |
