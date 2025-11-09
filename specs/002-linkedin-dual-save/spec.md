# Feature Specification: LinkedIn Dual-Platform Job Saving

**Feature Branch**: `002-linkedin-dual-save`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "Dual-platform saving that automatically clicks LinkedIn's Save button when saving to Notion, with user control toggle and smart status messages"

## Clarifications

### Session 2025-11-09

- Q: What happens when the user is not logged into LinkedIn (session expired)? → A: Proceed with Notion save, attempt LinkedIn click silently, and also detect logout state beforehand to temporarily disable the "Also save on LinkedIn" checkbox.
- Q: Where should the checkbox preference data be stored to persist across browser sessions? → A: Chrome's local storage API (chrome.storage.local), with checkbox checked by default.
- Q: What happens if the dual-save operation timeout (3 seconds) is exceeded? → A: Complete Notion save but cancel LinkedIn click if 3 seconds exceeded. (Note: Just the Notion response itself might take more than 3 seconds occasionally)
- Q: How should the system detect if a job is already saved on LinkedIn? → A: Check button's label (Save vs Saved), aware of the feature limitation regarding UI language switch.
- Q: How frequently should the system check if user is logged into LinkedIn? → A: Check login state when extension popup opens (on-demand).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Dual-Platform Save (Priority: P1)

As a job seeker, when I save a job posting to my Notion database, I want the system to also save it on LinkedIn automatically so that I maintain redundant records without extra manual steps.

**Why this priority**: This is the core value proposition—reducing user effort from two separate save actions to one. It delivers immediate time savings and ensures data redundancy without requiring users to remember two separate workflows.

**Independent Test**: Can be fully tested by opening any LinkedIn job page, clicking the extension's save button, and verifying that both the Notion database entry is created AND LinkedIn's "Save" button changes to "Saved" state.

**Acceptance Scenarios**:

1. **Given** I am viewing an unsaved LinkedIn job posting, **When** I click "Save to Notion" in the extension, **Then** the job is saved to my Notion database AND LinkedIn's save button is automatically clicked
2. **Given** the dual-save completes successfully, **When** I see the confirmation message, **Then** it indicates "Job saved to Notion!"
3. **Given** I have saved a job through the extension, **When** I look at LinkedIn's UI, **Then** LinkedIn's save button shows the job as "Saved"
4. **Given** the job already exists in Notion, **When** I click "Update in Notion", **Then** the system updates Notion AND ensures LinkedIn also has the job saved
5. **Given** I save 10 jobs in a row using the extension, **When** I navigate to LinkedIn's "My Jobs" section, **Then** all 10 jobs appear in the saved jobs list

---

### User Story 2 - User Control Over Save Behavior (Priority: P2)

As a job seeker, I want to control whether the extension saves to both platforms or only Notion so that I can choose based on my workflow preferences.

**Why this priority**: Provides user flexibility and addresses different use cases (research vs. serious applications). Depends on P1 being implemented but adds valuable customization.

**Independent Test**: Can be tested by toggling the checkbox on/off and verifying that save behavior changes accordingly without affecting the Notion save functionality.

**Acceptance Scenarios**:

1. **Given** I open the extension popup, **When** I see the save form, **Then** a checkbox labeled "Also save on LinkedIn" is visible and checked by default
2. **Given** the "Also save on LinkedIn" checkbox is unchecked, **When** I click "Save to Notion", **Then** the job is saved only to Notion and LinkedIn's button is not clicked
3. **Given** the "Also save on LinkedIn" checkbox is checked, **When** I click "Save to Notion", **Then** the job is saved to both platforms
4. **Given** I have set my checkbox preference, **When** I close and reopen the extension on a different job, **Then** my previous checkbox state is remembered
5. **Given** I change the checkbox state and save the job, **When** I look at LinkedIn's save button, **Then** the button state reflects whether LinkedIn save occurred

---

### User Story 3 - Graceful Handling of LinkedIn Save Failures (Priority: P3)

As a job seeker, when LinkedIn's save button cannot be clicked automatically, I want the Notion save to still succeed so that my data is never lost even if automation fails.

**Why this priority**: Ensures reliability and user confidence. While important for production quality, it's a defensive feature that doesn't add new capabilities—just improves resilience.

**Independent Test**: Can be tested by simulating various failure scenarios (button not found, page structure changed) and verifying that Notion saves succeed without blocking the user workflow.

**Acceptance Scenarios**:

1. **Given** LinkedIn's save button cannot be found on the page, **When** I save the job, **Then** the Notion save succeeds and I see the standard "Job saved to Notion!" message
2. **Given** the job is already saved on LinkedIn, **When** I save through the extension with the checkbox enabled, **Then** the system detects this state and skips clicking the button
3. **Given** LinkedIn's page structure has changed, **When** the extension attempts to click the save button, **Then** the failure is caught silently and the Notion save proceeds normally
4. **Given** the LinkedIn save automation fails, **When** I notice the failure, **Then** I can manually click LinkedIn's save button afterward
5. **Given** multiple save attempts fail for LinkedIn in a session, **When** I continue using the extension, **Then** each save to Notion completes successfully without errors

---

### Edge Cases

- User is not logged into LinkedIn (session expired): System detects logout state and temporarily disables the "Also save on LinkedIn" checkbox; if checkbox was enabled before logout detection, system proceeds with Notion save and attempts LinkedIn click silently
- Rapid consecutive saves (user clicks save button multiple times quickly): System prevents duplicate operations by disabling save button during operation
- LinkedIn's save button is obscured by a modal or overlay: System attempts click; if unsuccessful, fails silently and completes Notion save
- Job is already saved on LinkedIn before attempting to click: System detects saved state and skips clicking the button
- LinkedIn page navigates away immediately after clicking save: Notion save completes first; LinkedIn click attempt happens but may not complete if navigation occurs
- LinkedIn restricts job from being saved (expired, removed): LinkedIn click fails silently; Notion save completes successfully
- Total operation exceeds 3 second timeout: Notion save completes regardless of duration; LinkedIn click is cancelled if timeout exceeded after Notion save completes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST save job data to the Notion database when the user clicks the save button (existing functionality preserved)
- **FR-002**: System MUST attempt to click LinkedIn's native "Save" button on the job posting page when dual-save is enabled
- **FR-003**: System MUST display a checkbox control labeled "Also save on LinkedIn" in the extension popup form
- **FR-004**: System MUST set the "Also save on LinkedIn" checkbox to checked state by default on first use
- **FR-005**: System MUST persist the user's checkbox preference in Chrome's local storage API (chrome.storage.local) across browser sessions
- **FR-006**: System MUST skip the LinkedIn save action when the checkbox is unchecked
- **FR-007**: System MUST detect if a job is already saved on LinkedIn by checking the button's label text (e.g., "Save" vs "Saved") and skip clicking the button if already saved; system is aware this detection has limitations when LinkedIn UI language is switched
- **FR-008**: System MUST ensure Notion save completes successfully regardless of LinkedIn save outcome
- **FR-009**: System SHOULD complete the dual-save operation within 3 seconds total (target); if timeout exceeded, system MUST complete Notion save but MAY cancel LinkedIn click attempt
- **FR-010**: Users MUST be able to update an existing Notion entry while also ensuring LinkedIn has the job saved
- **FR-011**: System MUST fail silently if LinkedIn's save button cannot be found or clicked, without blocking the Notion save
- **FR-012**: System MUST display standard "Job saved to Notion!" confirmation message after successful Notion save
- **FR-013**: System MUST detect when user is not logged into LinkedIn by checking login state when extension popup opens, and temporarily disable the "Also save on LinkedIn" checkbox if logged out
- **FR-014**: System MUST prevent duplicate save operations by disabling the save button during an active save operation

### Key Entities

- **User Preference**: Represents the user's choice for dual-platform saving behavior; includes checkbox state (enabled/disabled) stored in Chrome's local storage API (chrome.storage.local); defaults to enabled (checked) on first use
- **Save Operation**: Represents a single job save action; includes Notion save status (success/failure), LinkedIn save status (success/failure/skipped/already-saved), and combined outcome message

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users save jobs to both platforms in under 15 seconds from opening the extension to seeing confirmation (compared to 20-25 seconds with manual two-step process)
- **SC-002**: Dual-save success rate is at least 95% when LinkedIn page is fully loaded and user is logged in
- **SC-003**: Notion save success rate remains at 100% regardless of LinkedIn save outcome
- **SC-004**: User checkbox preference persists correctly across 100% of browser sessions
- **SC-005**: System detects already-saved LinkedIn jobs with 100% accuracy when LinkedIn's UI is in English; detection may fail if LinkedIn UI language is changed
- **SC-006**: Users can disable LinkedIn auto-save and successfully save to Notion-only 100% of the time
- **SC-007**: Time saved per job averages 5-10 seconds compared to the previous manual two-step workflow
- **SC-008**: User task completion rate (saving to both platforms) improves from current baseline to 100% with dual-save enabled
