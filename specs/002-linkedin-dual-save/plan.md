````markdown
# Implementation Plan: LinkedIn Dual-Platform Job Saving

**Branch**: `002-linkedin-dual-save` | **Date**: 2025-11-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-linkedin-dual-save/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the existing Chrome Extension to automatically click LinkedIn's native "Save" button when saving a job to Notion, with user-controlled toggle and graceful failure handling. The extension will add a checkbox for user preference (persisted in chrome.storage.local), detect LinkedIn login state, and handle timeout/failure scenarios while ensuring Notion save always succeeds.

## Technical Context

**Language/Version**: JavaScript ES6+ (Chrome Extension), Python 3.10+ (Flask Backend - unchanged)  
**Primary Dependencies**: Chrome Extension APIs (chrome.storage, chrome.scripting, chrome.tabs), existing Flask backend  
**Storage**: Chrome's local storage API (chrome.storage.local) for user preferences; Notion API for job data (existing)  
**Testing**: Manual testing on LinkedIn job pages with various edge cases  
**Target Platform**: Chrome Browser (Manifest V3 extension)  
**Project Type**: Web application (Chrome Extension + Flask Backend)  
**Performance Goals**: Complete dual-save operation within 3 seconds (target); UI responsiveness maintained during saves  
**Constraints**: LinkedIn DOM structure may change; English-only button label detection; no hard timeout on Notion save  
**Scale/Scope**: Single-user tool; ~10-50 job saves per day; minimal storage (<1KB for preferences)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research)

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Single-User Focus** | ✅ PASS | Feature is personal automation for single user; no multi-user complexity |
| **II. Local-First Architecture** | ✅ PASS | No backend changes; all logic runs in Chrome Extension (client-side) |
| **III. Backend Technology Mandate** | ✅ PASS | Flask backend unchanged; existing Notion save functionality reused |
| **IV. Frontend Technology Mandate** | ✅ PASS | Implementation entirely within existing Chrome Extension |
| **V. Component Communication** | ✅ PASS | Extension continues to communicate with Flask backend for Notion saves; LinkedIn click is DOM manipulation only (no new external API calls) |
| **VI. Primary Datastore Mandate** | ✅ PASS | Notion remains sole datastore for job data; chrome.storage.local only for UI preference (not application data) |
| **VII. Document Management Mandate** | ✅ PASS | No document management changes |
| **VIII. Content Generation Mandate** | ✅ PASS | No LLM or content generation involved |
| **IX. Security & Authentication** | ✅ PASS | No new credentials; reuses existing Notion API authentication; chrome.storage.local is browser-native |

**Initial Gate Status**: ✅ **PASS**

### Post-Design Check (After Phase 1)

| Principle | Compliance | Design Validation |
|-----------|------------|-------------------|
| **I. Single-User Focus** | ✅ PASS | Design confirms single-user tool; preference stored per-browser-profile |
| **II. Local-First Architecture** | ✅ PASS | All components run locally (popup script, content script); no cloud services |
| **III. Backend Technology Mandate** | ✅ PASS | Zero backend changes; Flask/Python untouched |
| **IV. Frontend Technology Mandate** | ✅ PASS | Uses Chrome Extension APIs (storage, messaging, scripting); Manifest V3 |
| **V. Component Communication** | ✅ PASS | Internal messaging between popup/content scripts; existing Notion API flow unchanged |
| **VI. Primary Datastore Mandate** | ✅ PASS | Notion database remains sole source of truth for job data; chrome.storage.local is UI state only |
| **VII. Document Management Mandate** | ✅ PASS | No document operations |
| **VIII. Content Generation Mandate** | ✅ PASS | No AI/LLM usage |
| **IX. Security & Authentication** | ✅ PASS | Chrome storage is browser-isolated; no new credentials or external auth |

**Post-Design Gate Status**: ✅ **PASS** - Design fully compliant with all constitutional principles. No new architectural patterns, external dependencies, or datastore requirements introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-linkedin-dual-save/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── extension-api.md # Internal Chrome Extension API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── backend/             # Flask backend (UNCHANGED for this feature)
│   ├── src/
│   │   ├── api/        # Existing Notion API routes
│   │   ├── services/   # Existing Notion service
│   │   └── config/     # Existing configuration
│   └── tests/
│
└── chrome-extension/    # Chrome Extension (PRIMARY CHANGES HERE)
    ├── manifest.json    # Update permissions if needed
    ├── popup/
    │   ├── popup.html   # Add checkbox UI
    │   ├── popup.js     # Add preference logic, LinkedIn click orchestration
    │   └── popup.css    # Style checkbox
    ├── content/
    │   └── content_script.js  # Add LinkedIn save button detection/click logic
    └── background/      # (Optional) May add for preference management
        └── service_worker.js
```

**Structure Decision**: This is a Chrome Extension enhancement feature. All implementation occurs within `packages/chrome-extension/`. The Flask backend in `packages/backend/` is unchanged - existing Notion save functionality is reused as-is. Primary modifications:
- `popup/`: Add checkbox UI, preference persistence, LinkedIn click orchestration
- `content/`: Add LinkedIn button detection, login state detection, click automation
- Minimal or no changes to backend required
````
```

**Structure Decision**: This is a Chrome Extension enhancement feature. All implementation occurs within `packages/chrome-extension/`. The Flask backend in `packages/backend/` is unchanged - existing Notion save functionality is reused as-is. Primary modifications:
- `popup/`: Add checkbox UI, preference persistence, LinkedIn click orchestration
- `content/`: Add LinkedIn button detection, login state detection, click automation
- Minimal or no changes to backend required

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
