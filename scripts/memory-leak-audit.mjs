#!/usr/bin/env node

/**
 * Memory Leak & Resource Audit Script
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/memory-leak-audit.mjs
 *
 * Audits:
 *   - AbortController patterns in API client
 *   - setInterval/setTimeout cleanup in hooks
 *   - Event listener cleanup in useEffect return
 *   - Object URL revocation
 *   - WebSocket connection management
 *   - Subscription cleanup (Firebase, TanStack Query)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const SRC_DIR = join(import.meta.dirname, "..", "apps", "web", "src");
const LIB_DIR = join(import.meta.dirname, "..", "lib");
const ISSUES = [];
const PASS = [];
const WARN = [];

function readFiles(dir, ext = ".ts", files = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith("node_modules") && !entry.name.startsWith("__tests__") && !entry.name.startsWith(".next")) {
        readFiles(full, ext, files);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(full);
      }
    }
  } catch { /* skip */ }
  return files;
}

function checkPattern(filePath, content, pattern, label, severity = "issue") {
  const matches = content.matchAll(pattern);
  for (const match of matches) {
    const lines = content.slice(0, match.index).split("\n");
    const lineNum = lines.length;
    const context = content.slice(Math.max(0, match.index - 40), match.index + 40).replace(/\n/g, "↵");
    const relPath = relative(join(import.meta.dirname, ".."), filePath);
    if (severity === "issue") {
      ISSUES.push(`[${relPath}:${lineNum}] ${label}: ${context.trim()}`);
    } else {
      WARN.push(`[${relPath}:${lineNum}] ${label}: ${context.trim()}`);
    }
  }
  return matches;
}

function checkMissingCleanup(filePath, content) {
  const lines = content.split("\n");
  const relPath = relative(join(import.meta.dirname, ".."), filePath);

  // useEffect without return (potential leak)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("useEffect(") || line.includes("useEffect (")) {
      // Find the opening brace
      let braceCount = 0;
      let startIdx = i;
      let foundOpen = false;
      for (let j = i; j < Math.min(i + 40, lines.length); j++) {
        if (lines[j].includes("=>") || lines[j].includes("function")) {
          for (const ch of lines[j]) {
            if (ch === "{") { braceCount++; foundOpen = true; }
            else if (ch === "}") braceCount--;
          }
          if (foundOpen && braceCount === 0) {
            // Check if this useEffect has a return
            const block = lines.slice(startIdx, j + 1).join("\n");
            if (!block.includes("return ") && block.includes("addEventListener")) {
              ISSUES.push(`[${relPath}:${i + 1}] useEffect with addEventListener but no cleanup return`);
            }
            break;
          }
        }
      }
    }
  }
}

function auditFile(filePath) {
  const content = readFileSync(filePath, "utf-8");

  // Event listeners with cleanup
  checkPattern(filePath, content, /addEventListener\(/g, "addEventListener found — verify cleanup in useEffect return");

  // setInterval / setTimeout without cleanup reference
  checkPattern(filePath, content, /setInterval\(/g, "setInterval found — verify cleanup in useEffect return", "warn");
  checkPattern(filePath, content, /setTimeout\(/g, "setTimeout found — verify cleanup if component unmounts", "warn");

  // Object URLs
  checkPattern(filePath, content, /createObjectURL\(/g, "createObjectURL found — verify revokeObjectURL is called", "issue");
  checkPattern(filePath, content, /revokeObjectURL\(/g, "revokeObjectURL found — good cleanup ✅");

  // WebSocket
  checkPattern(filePath, content, /new WebSocket\(/g, "WebSocket found — verify close() on unmount", "issue");
  checkPattern(filePath, content, /\.close\(\)/g, ".close() found — good cleanup ✅");

  // AbortController
  checkPattern(filePath, content, /new AbortController\(/g, "AbortController found — verify signal passed to fetch", "warn");
  checkPattern(filePath, content, /\.abort\(\)/g, ".abort() found — good cleanup ✅");

  // Firebase onSnapshot / onAuthStateChanged
  checkPattern(filePath, content, /onSnapshot\(/g, "Firestore onSnapshot — verify unsubscribe()", "issue");
  checkPattern(filePath, content, /onAuthStateChanged\(/g, "Auth onAuthStateChanged — verify unsubscribe()", "issue");
  checkPattern(filePath, content, /unsubscribe\(\)/g, "unsubscribe() found — good cleanup ✅");

  // Subscription patterns
  checkPattern(filePath, content, /\.subscribe\(/g, ".subscribe() found — verify unsubscribe() cleanup", "warn");

  // Check useEffect cleanup patterns
  checkMissingCleanup(filePath, content);
}

console.log("\n═══════════════════════════════════════════════");
console.log("  Memory Leak & Resource Cleanup Audit");
console.log("═══════════════════════════════════════════════\n");

const files = readFiles(SRC_DIR, ".ts");
const tsxFiles = readFiles(SRC_DIR, ".tsx");
const libFiles = readFiles(LIB_DIR, ".ts");
const allFiles = [...files, ...tsxFiles, ...libFiles];

console.log(`Scanning ${allFiles.length} files...\n`);

for (const f of allFiles) {
  auditFile(f);
}

console.log("\n───────────────────────────────────────────────");
console.log(`  Issues Found: ${ISSUES.length}`);
console.log(`  Warnings: ${WARN.length}`);
console.log(`  Clean Patterns: ${PASS.length}`);
console.log("───────────────────────────────────────────────\n");

if (ISSUES.length > 0) {
  console.log("  ❌ ISSUES (must fix):\n");
  for (const issue of ISSUES) {
    console.log(`    ${issue}`);
  }
  console.log("");
}

if (WARN.length > 0) {
  console.log("  ⚠️  WARNINGS (review recommended):\n");
  for (const w of WARN) {
    console.log(`    ${w}`);
  }
  console.log("");
}

if (ISSUES.length === 0) {
  console.log("  ✅ No critical resource leak issues found.\n");
}

process.exit(ISSUES.length > 0 ? 1 : 0);
