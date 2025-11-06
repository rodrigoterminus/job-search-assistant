# Tasks: Job Posting Collector

**Input**: Design documents from `/specs/001-job-posting-collector/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.openapi.yaml

**Tests**: No automated tests for MVP (manual testing only per spec clarification Q5)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/src/`, `chrome-extension/`
- Tasks follow structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend directory structure: backend/src/api/, backend/src/services/, backend/src/config/
- [ ] T002 Create Chrome extension directory structure: chrome-extension/popup/, chrome-extension/content/, chrome-extension/icons/
- [ ] T003 [P] Create backend/requirements.txt with Flask==3.0.0, notion-client==2.2.1, flask-cors==4.0.0, python-dotenv==1.0.0
- [ ] T004 [P] Create backend/.env.example with NOTION_API_KEY, NOTION_DATABASE_ID, FLASK_ENV, FLASK_DEBUG, FLASK_PORT placeholders
- [ ] T005 [P] Create backend/.gitignore to exclude .env, __pycache__, venv/
- [ ] T006 [P] Add placeholder icons to chrome-extension/icons/ (icon16.png, icon48.png, icon128.png)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Implement backend/src/config/settings.py with Config class loading environment variables (NOTION_API_KEY, NOTION_DATABASE_ID, FLASK_ENV, FLASK_DEBUG, FLASK_PORT, CORS_ORIGINS) and validate() method
- [ ] T008 [P] Implement backend/src/services/notion_service.py with NotionService class __init__(api_key, database_id)
- [ ] T009 [P] Implement backend/src/api/validators.py with validate_job_posting() function for required fields (position, company, posting_url, origin) and URL pattern validation
- [ ] T010 Implement backend/src/app.py with create_app() factory, CORS configuration for chrome-extension://* origins, and main entry point with Config.validate()
- [ ] T011 Implement chrome-extension/manifest.json with Manifest V3 structure, permissions (activeTab, scripting), host_permissions for LinkedIn, and action configuration
- [ ] T012 [P] Implement chrome-extension/popup/popup.css with form styling, container layout (450px width, 500px max-height), button styles, and status message styles
- [ ] T013 [P] Add console logging setup to backend/src/app.py using Python logging module with DEBUG level for development

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - One-Click Job Capture (Priority: P1) 🎯 MVP

**Goal**: User can open extension popup on LinkedIn job page and see a form with editable fields pre-filled with scraped data

**Independent Test**: Navigate to any LinkedIn job posting, click extension icon, verify popup opens with form containing 10 visible fields (Position, Company, Posting URL, Origin, Match, Work Arrangement, Demand, Budget, City, Country) that are pre-filled when data is available

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create chrome-extension/popup/popup.html with form containing 10 visible input fields (Position*, Company*, Posting URL*, Origin*, Match, Work Arrangement, Demand, Budget, City, Country) and Save button
- [ ] T015 [P] [US1] Implement chrome-extension/content/content_script.js with scrapeLinkedInJob() function to extract position (h1.top-card-layout__title), company (a.topcard__org-name-link), posting_url (window.location.href), and job_description (.jobs-description__content with innerText)
- [ ] T016 [US1] Implement chrome-extension/popup/popup.js with initialization: check if current tab is LinkedIn job page using isLinkedInJobPage(), execute content_script.js via chrome.scripting.executeScript(), receive scraped data
- [ ] T017 [US1] Implement prefillForm() function in chrome-extension/popup/popup.js to populate form fields from scraped data and store extractedJobDescription variable
- [ ] T018 [US1] Implement getFormData() function in chrome-extension/popup/popup.js to collect form values (trim strings, parse budget as number, include job_description from extractedJobDescription variable)
- [ ] T019 [US1] Add validation in chrome-extension/popup/popup.js to disable save button when required fields (position, company, posting_url, origin) are empty
- [ ] T020 [US1] Add status message updates in chrome-extension/popup/popup.js: "Extracting job data..." when popup opens, "Review and save job posting" when ready, error messages when not on LinkedIn page
- [ ] T021 [US1] Add console.log statements in chrome-extension/popup/popup.js for all errors, extraction results, and status changes
- [ ] T022 [US1] Add error display in chrome-extension/popup/popup.html for non-LinkedIn pages with message "Please navigate to a LinkedIn job posting to use this extension"

**Checkpoint**: At this point, User Story 1 should be fully functional - popup opens, scrapes data, displays form with editable pre-filled fields

---

## Phase 4: User Story 2 - Automatic Data Extraction (Priority: P2)

**Goal**: System automatically extracts all available fields from LinkedIn and pre-fills them in the popup form, with special handling for extraction failures

**Independent Test**: Open extension popup on a job posting page, verify that Position, Company, URL are extracted, optional fields (Match, Work Arrangement, Demand, Budget, City, Country, Job Description) are extracted when available, and extraction failures show warning messages without blocking the form

### Implementation for User Story 2

- [ ] T023 [P] [US2] Enhance chrome-extension/content/content_script.js to extract city from location information when available
- [ ] T024 [P] [US2] Enhance chrome-extension/content/content_script.js to extract country from location information when available
- [ ] T025 [P] [US2] Enhance chrome-extension/content/content_script.js to extract match level from LinkedIn AI match indicator when available
- [ ] T026 [P] [US2] Enhance chrome-extension/content/content_script.js to extract work_arrangement from job details section when available
- [ ] T027 [P] [US2] Enhance chrome-extension/content/content_script.js to extract demand from number of applicants when available
- [ ] T028 [P] [US2] Enhance chrome-extension/content/content_script.js to extract budget from salary information when available
- [ ] T029 [US2] Add extraction failure detection in chrome-extension/popup/popup.js: check if required fields (position, company) are null after scraping
- [ ] T030 [US2] Implement warning display in chrome-extension/popup/popup.js: show "Auto-extraction failed for [field name]. Please enter manually." for failed required fields
- [ ] T031 [US2] Update save button validation in chrome-extension/popup/popup.js: block save (disable button) until all required fields have values (whether extracted or manually entered)
- [ ] T032 [US2] Add console logging in chrome-extension/content/content_script.js for all extraction attempts (success and failure) with field names and values
- [ ] T033 [US2] Preserve job_description formatting in chrome-extension/content/content_script.js using innerText to maintain line breaks and structure

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - popup extracts all available data, handles extraction failures gracefully, allows manual entry

---

## Phase 5: User Story 3 - Notion Database Integration (Priority: P3)

**Goal**: When user clicks save button after reviewing form data, the system creates a new Notion database entry with the exact values from the form

**Independent Test**: Review data in extension popup (edit any field if desired), click save, then check Notion database to verify new entry exists with correct values matching the form, including any user edits

### Implementation for User Story 3

- [ ] T034 [P] [US3] Implement validate_job_posting() optional field validation in backend/src/api/validators.py: match enum (low/medium/high), work_arrangement enum (remote/hybrid/on-site), demand enum (0-50/51-200/201-500/500+), budget positive number, city max 200 chars, country max 200 chars
- [ ] T035 [US3] Implement validate_database() method in backend/src/services/notion_service.py: retrieve database schema, verify required properties exist (Position title, Company rich_text, Posting URL url, Origin select), verify optional properties if present
- [ ] T036 [US3] Implement check_duplicate() method in backend/src/services/notion_service.py: query database for posting_url match, return existing page ID if found
- [ ] T037 [US3] Implement create_job_posting() method in backend/src/services/notion_service.py: build Notion API payload with required fields (Position title, Company rich_text, Posting URL url, Origin select), conditionally add optional fields if provided (Match, Work Arrangement, Demand, Budget, Job Description, City, Country), call notion.pages.create()
- [ ] T038 [US3] Implement POST /api/job-postings route in backend/src/api/routes.py: validate request with validate_job_posting(), check for duplicates with check_duplicate(), call create_job_posting(), return 201 with notion_page_id and notion_page_url
- [ ] T039 [US3] Implement GET /health route in backend/src/api/routes.py: call validate_database(), return 200 with notion_connected and database_validated flags
- [ ] T040 [US3] Add error handling in backend/src/api/routes.py for validation errors (400), duplicate URLs (409), Notion auth errors (401), database not found (404), rate limits (429), timeouts (504), generic errors (500)
- [ ] T041 [US3] Add console logging in backend/src/api/routes.py for all API requests, Notion API calls, validation failures, and errors
- [ ] T042 [US3] Implement saveJobToNotion() function in chrome-extension/popup/popup.js: send POST request to http://localhost:5000/api/job-postings with form data from getFormData(), handle response
- [ ] T043 [US3] Add form submission handler in chrome-extension/popup/popup.js: prevent default, disable save button, call saveJobToNotion(), show success message with Notion page URL, close popup after 2 seconds
- [ ] T044 [US3] Add duplicate handling in chrome-extension/popup/popup.js: detect 409 response, display existing entry values vs. new form values (highlight differences), show Update/Cancel prompt, require confirmation before calling update endpoint
- [ ] T045 [US3] Add backend error handling in chrome-extension/popup/popup.js: detect unreachable backend (network error), show "Backend server not running. Please start Flask server (see setup docs)" with link to quickstart.md
- [ ] T046 [US3] Add Notion API error handling in chrome-extension/popup/popup.js: detect rate limit (429) → show "Notion API rate limit reached. Retry in 5 seconds?" with Retry button, detect timeout (504) → show "Notion API timeout. Would you like to retry?" with Retry button, detect auth error (401) → show "Failed to connect to Notion. Check API credentials and retry." with Retry button, detect other errors → show "Failed to save to Notion: [error message]. Retry?" with Retry button
- [ ] T047 [US3] Implement retry functionality in chrome-extension/popup/popup.js: preserve all form data when Retry button is clicked, re-attempt save with same data
- [ ] T048 [US3] Add console logging in chrome-extension/popup/popup.js for all API calls (request payload, response status, response body, errors)

**Checkpoint**: All user stories should now be independently functional - complete end-to-end flow from LinkedIn → Extension → Flask → Notion works with full error handling

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T049 [P] Create backend/README.md with setup instructions, virtual environment commands, environment variable configuration, running the server
- [ ] T050 [P] Create chrome-extension/README.md with extension installation instructions (load unpacked), testing on LinkedIn job pages
- [ ] T051 Update backend/src/config/settings.py docstrings and add inline comments for configuration values
- [ ] T052 Update chrome-extension/popup/popup.js with detailed comments explaining flow: initialization → scraping → form prefill → validation → save → error handling
- [ ] T053 Verify all console logging follows consistent format: component name, log level, message, relevant data
- [ ] T054 Run manual testing per quickstart.md validation: test extraction accuracy on 5 different LinkedIn job postings, test error scenarios (backend offline, invalid credentials, duplicate URL), test optional field handling (empty vs. populated)
- [ ] T055 Code review for hardcoded values: verify BACKEND_URL uses localhost:5000, verify CORS allows chrome-extension://* origins, verify Notion API version matches notion-client 2.2+

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 content_script.js and popup.js but is independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Adds backend integration to US1/US2 frontend but is independently testable (requires backend running)

### Within Each User Story

- **US1 Tasks**:
  - T014 (popup.html) and T015 (content_script.js) can run in parallel
  - T016 (popup.js init) depends on T014 and T015 being complete
  - T017-T022 extend T016 sequentially
  
- **US2 Tasks**:
  - T023-T028 (enhanced extraction) can all run in parallel
  - T029-T033 (failure handling) depend on T023-T028 being complete
  
- **US3 Tasks**:
  - T034 (validators), T035-T037 (notion_service), T038-T041 (routes) can run in parallel
  - T042-T048 (frontend integration) depend on backend tasks being complete

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within US1: T014 and T015 in parallel
- Within US2: T023-T028 in parallel
- Within US3: T034, T035-T037, T038-T041 in parallel (backend implementation)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 3 (Backend)

```bash
# Launch backend implementation tasks together:
Task T034: "Implement optional field validation in backend/src/api/validators.py"
Task T035: "Implement validate_database() in backend/src/services/notion_service.py"
Task T036: "Implement check_duplicate() in backend/src/services/notion_service.py"
Task T037: "Implement create_job_posting() in backend/src/services/notion_service.py"
Task T038: "Implement POST /api/job-postings in backend/src/api/routes.py"
Task T039: "Implement GET /health in backend/src/api/routes.py"

# These can all be worked on simultaneously by different developers
# Then T040-T041 (error handling and logging) integrate them
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013) - CRITICAL blocker
3. Complete Phase 3: User Story 1 (T014-T022)
4. **STOP and VALIDATE**: Test popup opens, scrapes data, displays editable form
5. Demo/review if ready (minimal viable feature - data capture without backend)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T013)
2. Add User Story 1 → Test independently → Demo (T014-T022) - MVP: Popup with scraping!
3. Add User Story 2 → Test independently → Demo (T023-T033) - Enhanced: All field extraction!
4. Add User Story 3 → Test independently → Demo (T034-T048) - Complete: End-to-end save to Notion!
5. Polish → Final validation (T049-T055)

### Parallel Team Strategy

With 2-3 developers:

1. Team completes Setup + Foundational together (T001-T013)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T014-T022) - Frontend popup
   - **Developer B**: User Story 3 backend (T034-T041) - Flask API
   - **Developer C**: User Story 2 (T023-T033) - Enhanced extraction
3. Stories integrate: US2 enhances US1, US3 connects US1+US2 to backend
4. All developers collaborate on Polish (T049-T055)

---

## Notes

- **No automated tests**: Per spec clarification Q5, use console logging (browser + terminal) for debugging instead of persistent logs
- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Manual testing**: After each phase, manually test with real LinkedIn job postings per quickstart.md
- **Error handling**: US3 includes comprehensive error scenarios per spec clarifications (duplicates, backend offline, Notion API failures)
- **Job Description**: Extracted but not displayed in popup UI (hidden field sent to backend)
- **Commit strategy**: Commit after each task or logical group of parallel tasks
- **Checkpoint validation**: Stop at each checkpoint to validate story independently before proceeding

---

## Total Task Count

- **Setup**: 6 tasks
- **Foundational**: 7 tasks (BLOCKING)
- **User Story 1**: 9 tasks (MVP)
- **User Story 2**: 11 tasks
- **User Story 3**: 15 tasks
- **Polish**: 7 tasks

**TOTAL**: 55 tasks

**Parallel Opportunities**:
- Phase 1: 4 tasks can run in parallel (T003-T006)
- Phase 2: 3 tasks can run in parallel (T008, T009, T012)
- US1: 2 tasks in parallel (T014, T015)
- US2: 6 tasks in parallel (T023-T028)
- US3: 8 tasks in parallel (T034, T035-T037, T038-T041)
- Polish: 2 tasks in parallel (T049-T050)

**Suggested MVP Scope**: Complete through User Story 1 (T001-T022) = 22 tasks for basic working popup with data extraction and form display
