# Feature Specification: Job Posting Collector

**Feature Branch**: `001-job-posting-collector`  
**Created**: 2025-11-05  
**Status**: Draft  
**Input**: User description: "Job Posting Collector - One-click LinkedIn job saving to Notion"

## Clarifications

### Session 2025-11-06

**Q1: Duplicate Job Posting Detection**
- **Question**: When saving a job posting that already exists in Notion (same posting_url), should the system: A) Silently skip, B) Update existing, or C) Prompt user?
- **Answer**: On popup load, check if job exists. Configure UI accordingly: Button A ("Open on Notion") enabled if exists, Button B shows "Update in Notion" if exists or "Save to Notion" if new. User can click Update to directly update existing entry or click Open to view in Notion first.

**Q2: Backend Server Unreachable**
- **Question**: When the Flask backend (localhost:5000) is not running, should the system: A) Show generic error, B) Show specific "server not running" message with setup link, or C) Queue for later?
- **Answer**: B - Show specific error message "Backend server not running. Please start Flask server (see setup docs)" with link to quickstart documentation

**Q3: Required Field Extraction Failure**
- **Question**: When auto-extraction fails for required fields (Position, Company, Posting URL, Origin), should the system: A) Abort with error, B) Allow manual entry but block save, or C) Use placeholder values?
- **Answer**: B - Display warning message for failed extractions, leave fields empty for manual entry, block save button until all required fields are filled

**Q4: Notion API Failures**
- **Question**: When Flask backend receives request successfully but Notion API call fails (rate limit, timeout, service degradation), should the system: A) Silent failure with generic error, B) Detailed error with retry prompt, or C) Automatic retry with exponential backoff?
- **Answer**: B - Display specific error messages based on failure type (rate limit, timeout, credentials), provide "Retry" button in popup, preserve form data during retry attempts

**Q5: Error Logging & Observability**
- **Question**: What level of error logging should the MVP include: A) No logging, B) Console logging only, or C) Persistent file logging?
- **Answer**: B - Log errors to browser console (extension) and terminal (Flask), including error messages, API responses, and extraction results, with no persistent storage

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-Click Job Capture (Priority: P1)

As a job seeker, when I find an interesting job posting on LinkedIn, I want to click a single button to save that job so that I can quickly capture opportunities without interrupting my browsing flow.

**Why this priority**: This is the core user-facing interaction that provides immediate value. It eliminates the manual process of copying and pasting job details, which is time-consuming and error-prone. This story alone delivers a complete, usable feature.

**Independent Test**: Can be fully tested by navigating to any LinkedIn job posting, clicking the extension icon, and verifying that scraped data is automatically populated in the form fields with the option to review and edit before saving.

**Acceptance Scenarios**:

1. **Given** I am viewing a LinkedIn job posting, **When** I click the browser extension icon, **Then** the extension popup opens with a form displaying all job posting fields
2. **Given** the extension popup is open, **When** the page loads, **Then** the system checks if this job already exists in Notion and configures button states accordingly
3. **Given** the system is checking if the job exists in Notion, **When** the check is in progress, **Then** the primary button (Button B) is disabled and displays "Checking..." until the check completes
4. **Given** the popup has finished loading, **When** the job does not exist in Notion, **Then** I see both buttons visible: "Open on Notion" button (Button A) is disabled and grayed out, and "Save to Notion" button (Button B) is enabled
5. **Given** the popup has finished loading, **When** the job already exists in Notion, **Then** I see both buttons visible and enabled: "Open on Notion" button (Button A) and "Update in Notion" button (Button B)
6. **Given** the extension popup is open, **When** the page loads, **Then** all available fields are automatically pre-filled with data scraped from the LinkedIn page
7. **Given** I see the pre-filled form, **When** I review the extracted data, **Then** I can edit any field before saving or updating
8. **Given** the job exists in Notion, **When** I click the "Open on Notion" button (Button A), **Then** the job application page opens in a new browser tab
9. **Given** I have reviewed the data, **When** I click the "Save to Notion" or "Update in Notion" button (Button B), **Then** the system provides immediate visual feedback that the save/update action has been initiated
10. **Given** I successfully save a new job, **When** the save completes, **Then** the "Open on Notion" button becomes enabled and the primary button changes to "Update in Notion"
11. **Given** I successfully save or update a job, **When** the operation completes, **Then** the popup remains open to allow further interaction with the buttons or form
12. **Given** the job posting page has loaded completely, **When** I open the extension popup, **Then** all editable fields are clearly visible and easily accessible
13. **Given** I am not on a LinkedIn job posting page, **When** I navigate to another website, **Then** the extension popup shows an appropriate message that this page is not supported

---

### User Story 2 - Automatic Data Extraction (Priority: P2)

As a job seeker, when I save a job posting, I want the system to automatically extract the key details from the page and pre-fill them in an editable form so that I can review and adjust the data before saving it to my tracking system.

**Why this priority**: This builds on P1 by adding the intelligence that makes the feature truly valuable. Without automatic extraction, users would need to manually enter all job information. Auto-population with the ability to correct errors provides the best balance of automation and control.

**Independent Test**: Can be fully tested by opening the extension popup on a job posting page and verifying that Job Title, Company Name, URL, and other available fields are automatically populated and editable.

**Acceptance Scenarios**:

1. **Given** I am viewing a job posting with a clear job title, **When** I open the extension popup, **Then** the Position field is pre-filled with the extracted job title and is editable
2. **Given** I am viewing a job posting with company information, **When** I open the extension popup, **Then** the Company field is pre-filled with the extracted company name and is editable
3. **Given** I open the extension popup, **When** the form loads, **Then** the Posting URL field is pre-filled with the exact URL of the current page and is editable
4. **Given** I open the extension popup, **When** the form loads, **Then** all optional fields (Match, Work Arrangement, Demand, Budget, Job Description, City, Country) are visible and pre-filled with extracted data when available
5. **Given** the job posting has unusual formatting or structure, **When** I open the extension popup, **Then** the system makes a best effort to extract available data and allows me to manually correct or complete missing information
6. **Given** an extracted field contains incorrect data, **When** I edit the field, **Then** my changes are preserved and used when saving to Notion

---

### User Story 3 - Notion Database Integration (Priority: P3)

As a job seeker, when I review the extracted job details and click save, I want them automatically saved to my Notion "Job Applications" database so that all my job opportunities are organized in one central location where I can track my application progress.

**Why this priority**: This completes the automation workflow by persisting the user-reviewed data to their tracking system. It depends on both P1 (popup UI with save button) and P2 (data extraction and display) being complete. While valuable for full automation, the review step ensures data accuracy.

**Independent Test**: Can be fully tested by reviewing data in the extension popup, clicking save, then checking the Notion database to verify a new entry exists with the correct values from the form.

**Acceptance Scenarios**:

1. **Given** I have reviewed the job details in the popup, **When** I click the "Save Job" button, **Then** a new entry is created in the "Job Applications" database
2. **Given** a new Notion entry is created, **When** I view the entry, **Then** the Position field is populated with the value from the popup form
3. **Given** a new Notion entry is created, **When** I view the entry, **Then** the Company field is populated with the value from the popup form
4. **Given** a new Notion entry is created, **When** I view the entry, **Then** the Posting URL field contains the URL from the popup form
5. **Given** I edited fields in the popup before saving, **When** I check my Notion database, **Then** the entry reflects my edited values, not the original scraped values
6. **Given** I save multiple jobs in sequence, **When** I check my Notion database, **Then** each job appears as a separate entry with all fields correctly populated from the popup forms

---

### Edge Cases

- When LinkedIn page structure changes and extraction fails to find Position or Company fields, the system shows a warning message "Auto-extraction failed for [field name]" in the popup, leaves the field empty for manual entry, and blocks the save/update button until the user provides the required data
- How does the system handle job postings that are missing key information (e.g., no company name listed)?
- What happens if the user's Notion database is temporarily unavailable or the credentials are invalid?
- When the popup loads and detects the job already exists in Notion (by URL), the system enables the "Open on Notion" button and changes the primary button label to "Update in Notion", allowing the user to either view the existing entry or update it with current form values
- What happens if the user clicks the update button without reviewing or editing the pre-filled data?
- What happens if the user manually clears a required field before clicking save/update?
- When the backend Flask server is not running or unreachable, the extension immediately displays a clear error message: "Backend server not running. Please start Flask server (see setup docs)" with a link to the quickstart guide
- When the Notion API call fails after the Flask backend successfully receives the request, the system displays specific error messages based on the failure type (rate limit: "Notion API rate limit reached. Retry in 5 seconds?", timeout: "Notion API timeout. Would you like to retry?", authentication: "Failed to connect to Notion. Check API credentials and retry.", other: "Failed to save to Notion: [error message]. Retry?"), provides a "Retry" button in the popup, and preserves all form data during retry attempts
- What happens when the LinkedIn page is still loading and the user opens the extension popup?
- How does the system handle LinkedIn pages that require login to view full job details?
- What happens if the Notion database structure doesn't match expected field names?
- How does the extension popup behave when opened on a non-LinkedIn page?
- What happens if extraction fails but the user manually enters data in the popup?

**Logging Strategy**: System logs all errors, API responses, and extraction results to the browser console (Chrome extension) and terminal output (Flask backend) for development debugging. No persistent file logging or log storage is implemented in MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a browser extension popup interface when the user clicks the extension icon
- **FR-001a**: System MUST render two action buttons in the popup interface: "Open on Notion" (Button A, secondary) and a primary action button (Button B)
- **FR-001b**: System MUST check on popup load whether the current job posting already exists in Notion (by URL)
- **FR-001c**: System MUST configure button states based on whether job exists in Notion
- **FR-001d**: System MUST disable the primary button (Button B) and display "Checking..." label while checking if job exists in Notion
- **FR-002**: System MUST detect when the user is on a LinkedIn job posting page versus other pages
- **FR-003**: System MUST display an editable form in the extension popup with visible job posting fields (Position, Company, Posting URL, Origin, Match, Work Arrangement, Demand, Budget, City, Country)
- **FR-004**: System MUST automatically extract and pre-fill the Position field from the LinkedIn job posting page when the popup opens
- **FR-005**: System MUST automatically extract and pre-fill the Company field from the LinkedIn job posting page when the popup opens
- **FR-006**: System MUST automatically capture and pre-fill the Posting URL field with the current page URL when the popup opens
- **FR-007**: System MUST automatically set the Origin field to "LinkedIn" when the popup opens
- **FR-008**: System MUST attempt to extract and pre-fill Match level (low, medium, high) from LinkedIn's AI match indicator when available
- **FR-009**: System MUST attempt to extract and pre-fill Work Arrangement (remote, hybrid, on-site) from the job posting details when available
- **FR-010**: System MUST attempt to extract and pre-fill Demand level (0-50, 51-200, 201-500, 500+) from the total number of applicants displayed on the job posting
- **FR-011**: System MUST attempt to extract and pre-fill Budget (salary information) from the job posting when available
- **FR-012**: System MUST attempt to extract Job Description text from the job posting (not displayed in popup, sent to backend with formatting preserved)
- **FR-013**: System MUST attempt to extract and pre-fill City from the job posting location information when available
- **FR-014**: System MUST attempt to extract and pre-fill Country from the job posting location information when available
- **FR-015**: System MUST allow users to edit any visible pre-filled field in the popup form before saving
- **FR-016**: System MUST validate that required fields (Position, Company, Posting URL, Origin) are not empty when the user clicks save or update
- **FR-017**: System MUST display "Open on Notion" button (Button A) as always visible in the popup interface
- **FR-017a**: System MUST display "Open on Notion" button (Button A) in disabled state (grayed out) when job does not exist in Notion
- **FR-017b**: System MUST display "Open on Notion" button (Button A) in enabled state when job exists in Notion
- **FR-017c**: System MUST open the existing Notion job application page in a new browser tab when user clicks enabled "Open on Notion" button
- **FR-017d**: System MUST display primary button (Button B) with label "Save to Notion" when job does not exist in Notion
- **FR-017e**: System MUST display primary button (Button B) with label "Update in Notion" when job already exists in Notion
- **FR-017f**: System MUST create a new Notion entry when user clicks "Save to Notion" button
- **FR-017g**: System MUST update the existing Notion entry when user clicks "Update in Notion" button
- **FR-017h**: System MUST enable "Open on Notion" button and change primary button label to "Update in Notion" after successful save of new job
- **FR-017i**: System MUST keep the popup open after successful save or update operations to allow further user interaction
- **FR-018**: System MUST block save/update button until all required fields contain data (whether auto-extracted or manually entered)
- **FR-019**: System MUST send the user-reviewed form data plus the extracted Job Description (including any edits) to the backend API when the save or update button is clicked
- **FR-020**: System MUST preserve original formatting (HTML/rich text) when extracting and sending Job Description to the backend
- **FR-021**: System MUST create a new entry in the user's Notion "Job Applications" database with the values from the popup form and extracted Job Description when "Save to Notion" is clicked
- **FR-021a**: System MUST update the existing entry in the user's Notion "Job Applications" database with the values from the popup form and extracted Job Description when "Update in Notion" is clicked
- **FR-022**: System MUST NOT send Level, Recruiter, Talent Acquisition, or Hiring Manager fields in API requests (these are populated by Notion AI Autofill)
- **FR-023**: System MUST provide clear status updates to the user during the save/update process (checking existence, extracting, saving/updating, complete)
- **FR-024**: System MUST handle missing or incomplete data gracefully, allowing users to manually fill in the popup form
- **FR-025**: System MUST detect duplicate job postings based on URL during initial popup load to configure button states
- **FR-025a**: System MUST retrieve existing entry data (page ID and URL) when duplicate URL is detected during popup load
- **FR-026**: System MUST display existing job's Notion page ID internally for "Open on Notion" functionality
- **FR-027**: System MUST construct proper Notion page URL from page ID for "Open on Notion" button
- **FR-028**: System MUST update button states immediately after successful save (enable "Open on Notion", change label to "Update in Notion")
- **FR-029**: System MUST provide error messages when the save/update process fails, with clear explanation of the issue
- **FR-030**: System MUST detect when backend server (localhost:5000) is unreachable and display specific error message: "Backend server not running. Please start Flask server (see setup docs)" with link to quickstart documentation
- **FR-029**: System MUST validate that required Notion database fields exist before attempting to save
- **FR-030**: System MUST detect when backend server (localhost:5000) is unreachable and display specific error message: "Backend server not running. Please start Flask server (see setup docs)" with link to quickstart documentation
- **FR-031**: System MUST handle Notion API rate limit errors by displaying message "Notion API rate limit reached. Retry in 5 seconds?" with Retry button
- **FR-032**: System MUST handle Notion API timeout errors by displaying message "Notion API timeout. Would you like to retry?" with Retry button
- **FR-033**: System MUST handle Notion API authentication errors by displaying message "Failed to connect to Notion. Check API credentials and retry." with Retry button
- **FR-034**: System MUST handle other Notion API errors by displaying message "Failed to save to Notion: [error message]. Retry?" with Retry button
- **FR-035**: System MUST preserve all form data when user clicks Retry button after Notion API failure
- **FR-036**: System MUST validate that required Notion database fields exist before attempting to save
- **FR-037**: System MUST validate optional field values match allowed enums when provided (e.g., match must be "low", "medium", or "high")
- **FR-038**: System MUST validate Budget is a positive number when provided
- **FR-039**: System MUST display an appropriate message in the popup when opened on a non-LinkedIn page
- **FR-040**: System MUST preserve user edits in the popup form if extraction fails or returns incomplete data
- **FR-041**: Chrome extension MUST log all errors, extraction results, and API responses to browser console for debugging
- **FR-042**: Flask backend MUST log all errors, Notion API requests/responses, and validation failures to terminal output for debugging
- **FR-043**: System MUST NOT implement persistent file logging or log storage in MVP

### Key Entities

- **Job Posting Form (Extension Popup)**: Represents the editable user interface displayed in the Chrome Extension popup. Key attributes include:
  - **Action buttons**: Two buttons always visible - Button A ("Open on Notion", secondary, disabled when job doesn't exist, enabled when job exists or after successful save) and Button B (primary, label changes between "Save to Notion" and "Update in Notion" based on existence check)
  - **Existence state**: Boolean indicating whether job already exists in Notion (determined on popup load via URL check)
  - **Notion page reference**: Page ID and URL of existing Notion entry (retrieved during existence check, used for "Open on Notion" functionality)
  - **Visible form fields**: 10 editable inputs displayed to user (Position, Company, Posting URL, Origin, Match, Work Arrangement, Demand, Budget, City, Country)
  - **Hidden field**: Job Description (extracted but not displayed in UI, sent to backend with preserved formatting)
  - **Pre-filled values**: Automatically populated from scraped LinkedIn data when popup opens
  - **User edits**: Any modifications made by user to visible fields before clicking save/update
  - **Validation state**: Real-time feedback on required fields and format constraints

- **Job Posting Data**: Represents the final validated data submitted from the popup form to the backend. Key attributes include:
  - **Required fields**: Position (job title), Company name, Posting URL (link to original posting), Origin (platform source - always "LinkedIn")
  - **Optional fields** (included when extracted or user-provided): Match level (low/medium/high), Work Arrangement (remote/hybrid/on-site), Demand (0-50/51-200/201-500/500+), Budget (salary), City, Country, Job Description (full text with formatting preserved)
  - **AI Autofill fields** (populated automatically by Notion AI, not sent by application): Level (seniority), Recruiter name, Talent Acquisition contact, Hiring Manager name

- **Notion Database Entry**: Represents a saved record in the user's job tracking system. Key attributes include entry ID, Position field value, Company field value, Posting URL field value, Origin field value, optional fields (Match, Work Arrangement, Demand, Budget, Job Description with formatting, City, Country), AI-populated fields (Level, Recruiter, Talent Acquisition, Hiring Manager), creation timestamp, and database reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can review and save/update a job posting from LinkedIn to Notion in under 15 seconds from opening the popup to seeing confirmation
- **SC-002**: Extension popup opens and completes existence check within 2 seconds of clicking the extension icon
- **SC-003**: All form fields and both action buttons are visible and properly labeled in the popup interface
- **SC-003a**: Both buttons are always visible: "Open on Notion" button appears disabled (grayed out) when job doesn't exist, enabled when job exists
- **SC-003b**: Primary button (Button B) is disabled and displays "Checking..." label during the existence check phase
- **SC-003c**: Button states correctly reflect job existence status within 2 seconds of popup load
- **SC-003d**: "Open on Notion" button successfully opens existing job page in Notion 100% of the time when enabled
- **SC-004**: Job title extraction accuracy is at least 95% for standard LinkedIn job posting formats (pre-fills Position field)
- **SC-005**: Company name extraction accuracy is at least 90% for standard LinkedIn job posting formats (pre-fills Company field)
- **SC-006**: URL capture succeeds 100% of the time when on a valid LinkedIn job posting page (pre-fills Posting URL field)
- **SC-007**: User can successfully edit any pre-filled field value before saving or updating
- **SC-008**: Duplicate job detection correctly identifies existing entries by URL 100% of the time during popup load
- **SC-008a**: Button states update correctly 100% of the time after successful save (enable "Open on Notion", change label to "Update in Notion")
- **SC-008b**: Popup remains open after successful save or update operations, allowing user to continue interacting with buttons or form
- **SC-009**: System provides user feedback within 2 seconds of clicking the save/update button in the popup
- **SC-010**: Complete end-to-end save/update process (from popup to Notion) completes within 5 seconds for 95% of cases
- **SC-011**: System gracefully handles and reports at least 90% of common error scenarios (network failures, missing data, authentication issues)
- **SC-012**: User can successfully save and update at least 10 job postings consecutively without errors
- **SC-013**: Saved/updated jobs in Notion database match the form values from the popup (including user edits) with 100% accuracy
