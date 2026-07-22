# Activity Types Catalog

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 7.0 — Architecture Design (Pre-Implementation)  
Last Updated: 2026-07-22

---

## Overview

Every Activity is differentiated by its `type` field. The engine does not distinguish activities by pedagogical category — it delegates all type-specific logic to registered plugins.

This document catalogs every supported Activity Type, its category, grading method, and config structure.

---

## Type Catalog

### 1. Multiple Choice (`mcq`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Exact match, partial credit possible for multi-select |
| Retryable | Configurable (default: no) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ❌, shuffle: ✅, reviewable: ✅ |

**Variants:**

- Single-select (1 correct answer)
- Multi-select (N correct answers)
- Image-based (options are images)
- Audio-based (question is audio)

---

### 2. True/False (`true-false`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Exact match (binary) |
| Retryable | Configurable (default: no) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ❌, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
statement: string
correctAnswer: boolean
explanation: string?          // Shown after answering
```

---

### 3. Matching (`matching`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Partial credit per matched pair |
| Retryable | Configurable (default: no) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ❌, shuffle: ✅, reviewable: ✅ |

**Config Structure:**

```
pairs: [{ left: string, right: string }]
shuffle: boolean              // Shuffle left column (default: true)
shuffleRight: boolean         // Shuffle right column (default: true)
```

**Scoring:** Each correct match = `maxScore / pairs.length` points.

---

### 4. Fill in the Blank (`fill-blank`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Exact match or fuzzy match |
| Retryable | Configurable (default: yes) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
text: string                  // Text with {{blank}} placeholders
blanks: [{
  id: string,
  correctAnswer: string,
  acceptableAnswers: string[] // Alternative correct answers
  caseSensitive: boolean      (default: false)
  trimWhitespace: boolean     (default: true)
}]
```

**Variants:**

- Single blank
- Multiple blanks (cloze)
- Dropdown blanks (choose from options)

---

### 5. Drag & Drop Ordering (`drag-order`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Exact order or partial credit for adjacent pairs |
| Retryable | Configurable (default: no) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
items: [{ id: string, content: string }]
correctOrder: string[]        // Ordered array of item IDs
gradingMode: "exact" | "adjacent" | "positional"
```

---

### 6. Flashcards (`flashcard`)

| Property | Value |
|----------|-------|
| Category | Study |
| Grading | Practice (no score) |
| Scoring | N/A (self-assessed) |
| Retryable | Yes (unlimited) |
| Manifest Version | 1 |
| Capabilities | timed: ❌, aiSupported: ❌, retryable: ✅, partialCredit: ❌, attachments: ✅, shuffle: ✅, reviewable: ✅ |

**Config Structure:**

```
cards: [{
  front: string               // Content on front side
  back: string                // Content on back side
  hint: string?               // Optional hint
  imageUrl: string?           // Optional image
  audioUrl: string?           // Optional audio
}]
shuffle: boolean              // Shuffle card order (default: true)
```

**Self-assessment:** Student rates each card as "easy", "medium", "hard". This is stored as metadata, not score.

---

### 7. Vocabulary Card (`vocab-card`)

| Property | Value |
|----------|-------|
| Category | Study |
| Grading | Practice or Auto |
| Scoring | Optional (can be configures as practice or scored) |
| Retryable | Yes |
| Manifest Version | 1 |
| Capabilities | timed: ❌, aiSupported: ❌, retryable: ✅, partialCredit: ❌, attachments: ✅, shuffle: ✅, reviewable: ✅ |

**Config Structure:**

```
vocabulary: [{
  term: string                // Word/phrase in target language
  definition: string          // Definition/translation
  partOfSpeech: string?       // Noun, verb, adjective, etc.
  exampleSentence: string?    // Usage example
  phonetic: string?           // Pronunciation guide
  imageUrl: string?           // Visual aid
  audioUrl: string?           // Pronunciation audio
  synonyms: string[]?         // Related terms
}]
showDefinition: boolean       // Show definition with term
quizMode: boolean             // Enable self-quiz mode
```

---

### 8. Reading Passage (`reading`)

| Property | Value |
|----------|-------|
| Category | Content |
| Grading | N/A (passage only) or Auto (comprehension questions) |
| Scoring | Via embedded MCQ/FillBlank questions |
| Retryable | Configurable |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
passages: [{
  title: string
  body: string                // Rich text (HTML/Markdown)
  source: string?             // Attribution/source
  wordCount: number?
  lexileLevel: string?        // Reading difficulty
  imageUrl: string?           // Accompanying image
  audioUrl: string?           // Audio narration
}]
questions: [{
  // Embedded question config (references MCQ or FillBlank schema)
  type: "mcq" | "fill-blank" | "true-false"
  config: { ... }
}]
```

---

### 9. Listening Exercise (`listening`)

| Property | Value |
|----------|-------|
| Category | Content |
| Grading | Auto (comprehension questions) |
| Scoring | Via embedded MCQ/FillBlank |
| Retryable | Configurable (limited) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
audio: {
  url: string                 // Audio file URL
  duration: number            // Duration in seconds
  transcript: string?         // Full transcript
  transcriptVisible: boolean  // Show transcript to student
  allowSpeedControl: boolean  // Allow playback speed changes
  maxPlays: number?           // Max play count (null = unlimited)
}
questions: [{
  type: "mcq" | "fill-blank" | "true-false"
  config: { ... }
  timestamp: number?          // At which second in the audio this question appears
}]
```

---

### 10. Writing Prompt (`writing`)

| Property | Value |
|----------|-------|
| Category | Production |
| Grading | Manual or AI-assisted |
| Scoring | Rubric-based |
| Retryable | No (submission is final) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
prompt: string                // Writing prompt/task
instructions: string?         // Additional instructions
wordLimit: {
  min: number?                // Minimum words (default: 0)
  max: number?                // Maximum words (default: unlimited)
}
rubric: {
  criteria: [{
    name: string              // e.g. "Grammar", "Vocabulary", "Structure"
    weight: number            // Weight percentage (sum = 100)
    description: string
  }]
}
aiAssisted: boolean           // Enable AI for initial grading
```

---

### 11. Speaking Prompt (`speaking`)

| Property | Value |
|----------|-------|
| Category | Production |
| Grading | Manual or AI-assisted |
| Scoring | Rubric-based |
| Retryable | Configurable (limited) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
prompt: string                // Speaking prompt/task
instructions: string?
timeLimit: number             // Recording time limit (seconds)
preparationTime: number?      // Preparation time before recording
allowReRecording: boolean     // Allow re-recording before submission
rubric: {
  criteria: [{
    name: string              // e.g. "Pronunciation", "Fluency", "Accuracy"
    weight: number
    description: string
  }]
}
aiAssisted: boolean
```

---

### 12. Conversation (`conversation`)

| Property | Value |
|----------|-------|
| Category | Production |
| Grading | AI-assisted |
| Scoring | Rubric-based (completion + quality) |
| Retryable | No |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ❌ |

**Config Structure:**

```
scenario: string              // Conversation scenario description
role: string                  // Student's role
aiRole: string                // AI's role/character
turns: number                 // Number of dialogue turns
context: string?              // Setup context before conversation
rubric: {
  criteria: [{
    name: string
    weight: number
    description: string
  }]
}
```

---

### 13. Story (`story`)

| Property | Value |
|----------|-------|
| Category | Content |
| Grading | Practice or Auto (comprehension) |
| Scoring | Via embedded questions |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
story: {
  title: string
  body: string                // Rich text, multi-paragraph
  author: string?
  source: string?
  wordCount: number?
  difficulty: string?
  imageUrl: string?
  audioUrl: string?
}
questions: [{
  type: "mcq" | "fill-blank" | "true-false"
  config: { ... }
  pageBreakAfter?: boolean    // Show question after this page
}]
pages: boolean                // Paginate story body
```

---

### 14. Grammar Exercise (`grammar`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto |
| Scoring | Exact or partial |
| Retryable | Configurable |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
grammarTopic: string          // e.g. "Present Simple vs Present Continuous"
instruction: string
questions: [{
  type: "mcq" | "fill-blank" | "matching" | "drag-order"
  config: { ... }
}]
```

---

### 15. Game (`game`)

| Property | Value |
|----------|-------|
| Category | Engagement |
| Grading | Practice |
| Scoring | Points-based (gamified) |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ❌, retryable: ✅, partialCredit: ❌, attachments: ❌, shuffle: ✅, reviewable: ❌ |

**Config Structure:**

```
gameType: string              // e.g. "word-search", "crossword", "hangman", "memory"
config: { ... }               // Game-type-specific configuration
pointsConfig: {
  correctAnswer: number       // Points per correct answer
  bonusTime: number?          // Bonus points for speed
  streakBonus: number?        // Bonus for consecutive correct
}
```

---

### 16. AI Dialogue (`ai-dialogue`)

| Property | Value |
|----------|-------|
| Category | AI-Powered |
| Grading | Practice |
| Scoring | Completion-based |
| Retryable | No |
| Manifest Version | 1 |
| Capabilities | timed: ❌, aiSupported: ✅, retryable: ❌, partialCredit: ❌, attachments: ❌, shuffle: ❌, reviewable: ❌ |

**Config Structure:**

```
scenario: string
systemPrompt: string          // System prompt for the AI
initialMessage: string        // AI's first message
maxTurns: number              // Max student-AI exchanges
completionCriteria: string    // What constitutes completion
language: string              // Target language
persona: string?              // AI persona description
```

---

### 17. AI Writing Review (`ai-writing`)

| Property | Value |
|----------|-------|
| Category | AI-Powered |
| Grading | AI-assisted |
| Scoring | Rubric-based |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ❌, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
prompt: string
rubric: { criteria: [...] }
aiInstructions: string        // Instructions for AI evaluator
feedbackLevel: "basic" | "detailed" | "comprehensive"
showScore: boolean            // Whether to show AI score to student
```

---

### 18. AI Speaking Review (`ai-speaking`)

| Property | Value |
|----------|-------|
| Category | AI-Powered |
| Grading | AI-assisted |
| Scoring | Rubric-based |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
prompt: string
rubric: { criteria: [...] }
aiInstructions: string
languageLevel: string         // For pronunciation assessment
feedbackLevel: "basic" | "detailed"
```

---

### 19. Homework (`homework`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto, Manual, or Mixed |
| Scoring | Aggregate of embedded activities |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ✅, partialCredit: ✅, attachments: ✅, shuffle: ❌, reviewable: ✅ |

**Config Structure:**

```
title: string
dueDate: string?              // ISO date (optional)
instructions: string?
activities: [{
  type: ActivityType
  config: { ... }             // Embedded activity definition
}]
aggregateScoring: "average" | "sum" | "best" | "allRequired"
```

---

### 20. Exam (`exam`)

| Property | Value |
|----------|-------|
| Category | Assessment |
| Grading | Auto, Manual, or Mixed |
| Scoring | Aggregate of sections |
| Manifest Version | 1 |
| Capabilities | timed: ✅, aiSupported: ✅, retryable: ❌, partialCredit: ✅, attachments: ❌, shuffle: ✅, reviewable: ✅ |

**Config Structure:**

```
title: string
instructions: string?
timeLimit: number             // Total time limit (seconds)
passingScore: number          // Percentage required to pass
shuffleQuestions: boolean     // Randomize question order
showResults: boolean          // Show results immediately
sections: [{
  title: string
  weight: number              // Section weight in total score
  timeLimit: number?          // Section time limit
  activities: [{
    type: ActivityType
    config: { ... }
  }]
}]
```

---

## Type Classification Matrix

| Type | Assessment | Study | Content | Production | AI | Engagement |
|------|-----------|-------|---------|------------|-----|------------|
| mcq | ✅ | | | | | |
| true-false | ✅ | | | | | |
| matching | ✅ | | | | | |
| fill-blank | ✅ | | | | | |
| drag-order | ✅ | | | | | |
| flashcard | | ✅ | | | | |
| vocab-card | | ✅ | | | | |
| reading | | | ✅ | | | |
| listening | | | ✅ | | | |
| writing | | | | ✅ | | |
| speaking | | | | ✅ | | |
| conversation | | | | ✅ | ✅ | |
| story | | | ✅ | | | |
| grammar | ✅ | | | | | |
| game | | | | | | ✅ |
| ai-dialogue | | | | | ✅ | |
| ai-writing | | | | ✅ | ✅ | |
| ai-speaking | | | | ✅ | ✅ | |
| homework | ✅ | | | | | |
| exam | ✅ | | | | | |

---

## Future Type Expansion

New types are added via the plugin system. Candidates for future addition:

| Type | Description |
|------|-------------|
| `video` | Video content with embedded questions |
| `pdf` | PDF resource viewer |
| `interactive-video` | Video with branching paths |
| `simulation` | Interactive simulation/game-like scenario |
| `poll` | Live classroom polling |
| `discussion` | Discussion forum thread |
| `peer-review` | Peer assessment activity |
| `survey` | Student survey/feedback |
| `live-coding` | Code editor with test cases |
| `3d-model` | 3D model exploration |
