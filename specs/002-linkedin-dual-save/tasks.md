# Tasks: LinkedIn Dual-Platform Job Saving

**Feature**: 002-linkedin-dual-save  
**Created**: 2025-11-09  
**Status**: Not Started

## Task Organization

Tasks are organized by implementation phase and mapped to user stories from spec.md:
- **P1**: User Story 1 - Automatic Dual-Platform Save (highest priority)
- **P2**: User Story 2 - User Control Over Save Behavior
- **P3**: User Story 3 - Graceful Handling of LinkedIn Save Failures

All tasks include file paths for implementation.

---

## Phase 0: Setup & Prerequisites

- [ ] [T001] Verify Chrome extension structure and existing files (`packages/chrome-extension/manifest.json`, `popup/popup.js`, `content/content_script.js`)
- [ ] [T002] Verify manifest.json has required permissions (`storage`, `scripting`, `activeTab`)
- [ ] [T003] Verify content_scripts registration for `https://www.linkedin.com/*` in manifest.json
- [ ] [T004] Confirm existing Notion save functionality works (`popup/popup.js` → backend API)
- [ ] [T005] Set up local testing environment (load extension in Chrome, test on LinkedIn job page)

---

## Phase 1: Foundational Infrastructure

### Storage Layer

- [ ] [T101] Implement preference initialization function in `popup/popup.js` (`initializeCheckbox()`)
- [ ] [T102] Implement preference save handler in `popup/popup.js` (checkbox change listener)
- [ ] [T103] Implement preference retrieval with default value (chrome.storage.local.get with `saveToLinkedIn: true` default)
- [ ] [T104] Test preference persistence across extension reload (manual test)

### Content Script Message Handlers

- [ ] [T201] [P1] Implement LinkedIn save button detection in `content/content_script.js` (`findLinkedInSaveButton()` with selector fallbacks)
- [ ] [T202] [P1] Implement already-saved state detection in `content/content_script.js` (`isJobAlreadySaved()` checking button text)
- [ ] [T203] [P1] Implement `clickLinkedInSave` message handler in `content/content_script.js` (button detection → click → response)
- [ ] [T204] Implement login state detection in `content/content_script.js` (detect `.global-nav__me` and other indicators)
- [ ] [T205] Implement `checkLinkedInLoginState` message handler in `content/content_script.js` (check indicators → response)
- [ ] [T206] Register chrome.runtime.onMessage listener with switch statement for actions (`clickLinkedInSave`, `checkLinkedInLoginState`)

---

## Phase 2: User Story 1 - Automatic Dual-Platform Save (P1)

### Core Dual-Save Flow

- [ ] [T301] [P1] US1 Update save button handler in `popup/popup.js` to call LinkedIn click after Notion save
- [ ] [T302] [P1] US1 Implement `clickLinkedInSaveButton()` function in `popup/popup.js` (chrome.tabs.sendMessage with `clickLinkedInSave` action)
- [ ] [T303] [P1] US1 Add error handling for LinkedIn click failure (try/catch with console.warn, don't block Notion save)
- [ ] [T304] [P1] US1 Ensure Notion save proceeds regardless of LinkedIn outcome (fire-and-forget pattern)
- [ ] [T305] [P1] US1 Add save button disable/enable logic to prevent duplicate operations (`saveBtn.disabled = true/false`)

### Testing & Validation

- [ ] [T306] [P1] US1 Test dual-save on unsaved LinkedIn job (verify both Notion entry created AND LinkedIn button shows "Saved")
- [ ] [T307] [P1] US1 Test dual-save on already-saved LinkedIn job (verify Notion update AND LinkedIn button not clicked again)
- [ ] [T308] [P1] US1 Test rapid consecutive saves (verify button disables during operation, no duplicate saves)
- [ ] [T309] [P1] US1 Verify confirmation message "Job saved to Notion!" displays correctly after dual-save
- [ ] [T310] [P1] US1 Test with 10 consecutive job saves, verify all appear in LinkedIn's "My Jobs" section

---

## Phase 3: User Story 2 - User Control Toggle (P2)

### UI Implementation

- [ ] [T401] [P2] US2 Add checkbox HTML to `popup/popup.html` (before save button, id="save-to-linkedin", checked by default)
- [ ] [T402] [P2] US2 Add checkbox label "Also save on LinkedIn" in `popup/popup.html`
- [ ] [T403] [P2] US2 Style checkbox in `popup/popup.css` (`.checkbox-label` with flex layout, gap, cursor)
- [ ] [T404] [P2] US2 Add disabled state styling in `popup/popup.css` (`.checkbox-label.disabled` with reduced opacity)

### Checkbox Logic

- [ ] [T405] [P2] US2 Connect checkbox state to save flow in `popup/popup.js` (read `saveToLinkedIn` preference before LinkedIn click)
- [ ] [T406] [P2] US2 Add conditional logic: if unchecked, skip LinkedIn click entirely
- [ ] [T407] [P2] US2 Verify checkbox state persists across browser sessions (manual test: check → close browser → reopen → still checked)

### Testing & Validation

- [ ] [T408] [P2] US2 Test Notion-only save (checkbox unchecked → save → Notion entry created, LinkedIn button NOT clicked)
- [ ] [T409] [P2] US2 Test dual-save (checkbox checked → save → both platforms saved)
- [ ] [T410] [P2] US2 Test checkbox persistence (toggle → close extension → reopen on different job → state remembered)
- [ ] [T411] [P2] US2 Verify default checkbox state is checked on first install

---

## Phase 4: User Story 3 - Graceful Failure Handling (P3)

### Login State Detection

- [ ] [T501] [P3] US3 Implement `checkLoginState()` function in `popup/popup.js` (send `checkLinkedInLoginState` message)
- [ ] [T502] [P3] US3 Add checkbox disable logic when logged out (set `checkbox.disabled = true`, add `.disabled` class)
- [ ] [T503] [P3] US3 Call `checkLoginState()` on popup load (in DOMContentLoaded listener)
- [ ] [T504] [P3] US3 Add error handling for login check failure (if content script not loaded, leave checkbox enabled)

### Error Handling & Edge Cases

- [ ] [T505] [P3] US3 Add timeout handling for LinkedIn click (3-second advisory timeout using Promise.race)
- [ ] [T506] [P3] US3 Ensure Notion save always succeeds even if LinkedIn times out
- [ ] [T507] [P3] US3 Test LinkedIn button not found scenario (delete button from DOM → save → Notion succeeds, no error shown)
- [ ] [T508] [P3] US3 Test logged-out scenario (log out of LinkedIn → open extension → checkbox disabled)
- [ ] [T509] [P3] US3 Test LinkedIn page structure change (modify button selector → save → Notion succeeds, LinkedIn fails silently)
- [ ] [T510] [P3] US3 Test manual fallback (LinkedIn click fails → user can manually click LinkedIn button afterward)

### Additional Edge Cases

- [ ] [T511] [P3] US3 Test LinkedIn save button obscured by modal (create overlay → save → Notion succeeds)
- [ ] [T512] [P3] US3 Test LinkedIn page navigation during save (start save → navigate away → Notion completes)
- [ ] [T513] [P3] US3 Test LinkedIn job restriction (expired job → save → Notion succeeds, LinkedIn fails silently)

---

## Phase 5: Polish & Optimization

### Code Quality

- [ ] [T601] Add console.log debugging statements to content script for button detection
- [ ] [T602] Add console.log debugging statements to popup script for preference loading
- [ ] [T603] Add JSDoc comments to all new functions (`initializeCheckbox`, `clickLinkedInSaveButton`, `findLinkedInSaveButton`, etc.)
- [ ] [T604] Add inline comments explaining LinkedIn selector fallback strategy
- [ ] [T605] Add inline comments explaining login state detection indicators

### Error Messages & Logging

- [ ] [T606] Add console.warn for LinkedIn click failures (with reason)
- [ ] [T607] Add console.log for successful LinkedIn clicks (with timestamp)
- [ ] [T608] Add console.error for unexpected errors (with stack trace)

### Performance

- [ ] [T609] Verify dual-save completes within 3 seconds for typical jobs (manual testing with timer)
- [ ] [T610] Verify UI remains responsive during save operation (button disables, no freezing)
- [ ] [T611] Test with slow network (throttle network in DevTools → save → Notion prioritized)

### Final Validation

- [ ] [T612] Run through all acceptance scenarios from spec.md User Story 1 (5 scenarios)
- [ ] [T613] Run through all acceptance scenarios from spec.md User Story 2 (5 scenarios)
- [ ] [T614] Run through all acceptance scenarios from spec.md User Story 3 (5 scenarios)
- [ ] [T615] Verify all 7 edge cases from spec.md are handled correctly
- [ ] [T616] Verify all 8 success criteria from spec.md are met
- [ ] [T617] Test on multiple LinkedIn job pages (different companies, job types, locations)
- [ ] [T618] Verify extension still works on non-LinkedIn pages (graceful degradation)

---

## Dependencies

### Critical Path
```
T001-T005 (Setup)
    ↓
T101-T104 (Storage Layer)
    ↓
T201-T206 (Content Script Handlers)
    ↓
T301-T310 (P1: Dual-Save Flow)
    ↓
T401-T411 (P2: UI Toggle)
    ↓
T501-T513 (P3: Failure Handling)
    ↓
T601-T618 (Polish & Validation)
```

### Parallel Execution Opportunities

**After T005 (Setup Complete)**:
- Can work on T101-T104 (Storage) in parallel with T201-T206 (Content Script)

**After T206 (Handlers Ready)**:
- T301-T305 (Dual-Save Logic) can proceed
- T401-T404 (UI HTML/CSS) can proceed in parallel (no dependency on dual-save logic)

**After T305 (Dual-Save Logic Done)**:
- T306-T310 (P1 Testing) can run
- T405-T407 (Connect Toggle) can proceed in parallel

**After T407 (Toggle Connected)**:
- T408-T411 (P2 Testing) can run
- T501-T504 (Login Detection) can proceed in parallel

**After T504 (Login Detection Done)**:
- T505-T513 (P3 Error Handling) can proceed
- T601-T605 (Code Quality) can proceed in parallel

**After T513 (All Features Complete)**:
- T606-T611 (Logging & Performance) can run
- T612-T618 (Final Validation) should run sequentially to ensure all features work together

### Task Blocking Relationships

| Task | Blocks | Reason |
|------|--------|--------|
| T001-T005 | ALL | Must verify project structure before implementation |
| T104 | T405 | Preference storage must work before connecting to toggle |
| T206 | T301 | Message handlers must exist before popup can send messages |
| T305 | T306-T310 | Dual-save logic must be implemented before testing |
| T407 | T408-T411 | Toggle connection must work before testing toggle behavior |
| T504 | T505-T513 | Login detection must work before testing failure scenarios |
| T513 | T612-T618 | All features must be complete before final validation |

---

## Estimated Effort

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 0: Setup | T001-T005 | 30 minutes | Critical |
| Phase 1: Foundation | T101-T206 | 2 hours | Critical |
| Phase 2: P1 Dual-Save | T301-T310 | 2 hours | High |
| Phase 3: P2 Toggle | T401-T411 | 1.5 hours | Medium |
| Phase 4: P3 Failure | T501-T513 | 2.5 hours | Medium |
| Phase 5: Polish | T601-T618 | 2 hours | Low |
| **Total** | **63 tasks** | **~10.5 hours** | - |

---

## Task Checklist Format

Each task follows this format:
```
- [ ] [TaskID] [Priority?] [Story?] Description (file path if applicable)
```

Where:
- `TaskID`: Unique identifier (T001-T618)
- `Priority`: P1, P2, or P3 (if task maps to specific user story)
- `Story`: US1, US2, or US3 (if task maps to specific user story acceptance scenario)
- `Description`: Clear action item with implementation details
- `File path`: Target file(s) for code changes

---

## Success Criteria Validation

After completing all tasks, verify these outcomes from spec.md:

1. **SC-001**: Users save jobs in <15 seconds (vs 20-25 seconds manual) → Test with T609
2. **SC-002**: Dual-save success rate ≥95% when logged in → Test with T306, T307, T310
3. **SC-003**: Notion save success rate = 100% regardless of LinkedIn → Test with T304, T507, T509
4. **SC-004**: Checkbox preference persists 100% of sessions → Test with T407, T410
5. **SC-005**: Already-saved detection = 100% accuracy (English UI) → Test with T307, T202
6. **SC-006**: Notion-only save works 100% of time when checkbox unchecked → Test with T408
7. **SC-007**: Time saved averages 5-10 seconds per job → Test with T609
8. **SC-008**: Task completion rate = 100% with dual-save enabled → Test with T310, T617

---

## Notes

- **No backend changes required**: All tasks are Chrome Extension only (popup/, content/, manifest.json)
- **English-only limitation**: LinkedIn button detection (T202) works only with English UI (documented in spec.md)
- **No hard timeout on Notion save**: 3-second timeout (T505) is advisory and only affects LinkedIn click, not Notion save
- **Fire-and-forget pattern**: LinkedIn click (T302) does not block Notion save (T304)
- **Testing is manual**: No automated test suite; manual testing on real LinkedIn pages (T306-T618)

---

## Implementation Order Recommendation

For optimal development flow, execute tasks in this order:

1. **Day 1 Morning**: T001-T005 (Setup) + T101-T104 (Storage) + T201-T206 (Content Script)
2. **Day 1 Afternoon**: T301-T310 (P1 Dual-Save + Testing)
3. **Day 2 Morning**: T401-T411 (P2 Toggle + Testing)
4. **Day 2 Afternoon**: T501-T513 (P3 Failure Handling + Testing)
5. **Day 3**: T601-T618 (Polish, Logging, Final Validation)

This approach delivers working dual-save (P1) by end of Day 1, adds user control (P2) by Day 2, and ensures production quality (P3) by Day 3.
