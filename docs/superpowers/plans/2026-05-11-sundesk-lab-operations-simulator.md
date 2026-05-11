# Sundesk Lab Operations Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Sundesk Lab as a working operations simulator where fake records are edited directly on the practice surface.

**Architecture:** Keep the existing route, state boundary, lesson ids, and persistence path. Replace the visual shell with a dominant stage, a compact mission rail, a coach/check panel, and a sync inspector. Move lesson actions from the coach into the sandbox surface.

**Tech Stack:** React, TypeScript, CSS, Vitest, Playwright, Vite.

---

### Task 1: Preserve Sync-Ready State

**Files:**
- Modify: `src/data/educationState.ts`
- Test: `src/data/educationState.test.ts`

- [x] Add simulator-facing state fields while keeping the snapshot JSON-serializable.
- [x] Normalize missing fields from older snapshots.
- [x] Keep fake records separate from real workspace records.

### Task 2: Rebuild Lab Screen

**Files:**
- Modify: `src/components/SundeskLabScreen.tsx`
- Modify: `src/App.css`

- [x] Replace the lesson-page layout with an operations simulator shell.
- [x] Move action controls onto the stage.
- [x] Turn the coach into checks and completion only.
- [x] Add inspector state and receipt visibility.
- [x] Keep existing route and navigation labels.

### Task 3: Test Behaviour

**Files:**
- Modify: `src/data/sundeskLab.test.ts`
- Modify: `e2e/smoke.spec.ts`

- [x] Assert stage-visible controls exist.
- [x] Assert actions update fake state.
- [x] Assert completion remains gated.
- [x] Assert mobile layout exposes the mission rail and simulator stage.

### Task 4: Verify

**Commands:**
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
- [x] Browser screenshot at desktop.
- [x] Browser screenshot at phone.

### Task 5: Handoff

**Files:**
- Modify: Sundesk Build History snapshot note.
- Modify: Sundesk Build History index.

- [x] Write the session handoff note.
- [x] Link it from Sundesk Build History.
- [x] Keep the existing Sundesk project bridge connected.
