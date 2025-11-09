# Research: LinkedIn Dual-Platform Job Saving

**Date**: 2025-11-09  
**Feature**: 002-linkedin-dual-save  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Areas

### 1. Chrome Extension Storage API (chrome.storage.local)

**Decision**: Use `chrome.storage.local` for persisting user checkbox preference

**Rationale**:
- Chrome Extension Manifest V3 standard for persistent data
- Provides async storage API with Promises/callbacks
- Data persists across browser sessions automatically
- Storage limit: 10MB (more than sufficient for single boolean preference)
- No additional permissions required beyond `storage` in manifest.json
- Simple key-value API: `chrome.storage.local.set({key: value})` and `chrome.storage.local.get(['key'])`

**Alternatives Considered**:
- **localStorage**: Synchronous API, not recommended for Manifest V3 extensions; blocked in service workers
- **chrome.storage.sync**: Syncs across user's Chrome instances; unnecessary for this single-device preference
- **IndexedDB**: Overkill for storing a single boolean value

**Implementation Pattern**:
```javascript
// Set preference
await chrome.storage.local.set({ saveToLinkedIn: true });

// Get preference with default
const { saveToLinkedIn = true } = await chrome.storage.local.get({ saveToLinkedIn: true });
```

**References**:
- [Chrome Storage API Documentation](https://developer.chrome.com/docs/extensions/reference/storage/)
- Manifest V3 best practices recommend storage API over localStorage

---

### 2. LinkedIn DOM Button Detection & Click Simulation

**Decision**: Use multiple fallback selectors + programmatic click via injected content script

**Rationale**:
- LinkedIn uses dynamic React-rendered DOM; selectors may change
- Multiple selector fallbacks increase resilience to UI changes
- Content scripts have full DOM access on linkedin.com pages
- Programmatic `element.click()` works for most LinkedIn buttons
- Button label text detection ("Save" vs "Saved") is most reliable signal despite language limitation

**Alternatives Considered**:
- **ARIA attributes only**: LinkedIn's ARIA implementation inconsistent across updates
- **CSS class matching only**: Classes are obfuscated and change frequently
- **XPath selectors**: More brittle than CSS selectors for dynamic content
- **Mutation observers**: Unnecessary overhead; on-demand detection sufficient

**Implementation Pattern**:
```javascript
// Content script injected into LinkedIn page
function findLinkedInSaveButton() {
  const selectors = [
    'button[aria-label*="Save"]',
    'button.jobs-save-button',
    'button[data-control-name*="save"]',
    'button:has-text("Save")', // If supported
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) return button;
  }
  return null;
}

function isJobAlreadySaved(button) {
  const text = button.textContent || button.innerText || '';
  return text.toLowerCase().includes('saved');
}

function clickLinkedInSaveButton() {
  const button = findLinkedInSaveButton();
  if (!button) return { success: false, reason: 'button_not_found' };
  if (isJobAlreadySaved(button)) return { success: true, reason: 'already_saved' };
  
  button.click();
  return { success: true, reason: 'clicked' };
}
```

**References**:
- [Content Scripts Documentation](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- LinkedIn job save button typically in `.jobs-details__main-content` section

---

### 3. LinkedIn Login State Detection

**Decision**: Check for presence of user profile elements + cookie indicators when popup opens

**Rationale**:
- Logged-out state shows login prompts instead of user navigation
- User avatar/profile picture elements only present when logged in
- Content script can detect these DOM elements on-demand
- No need for continuous monitoring; check only when extension popup opens
- False positives (detecting logged in when logged out) are acceptable since LinkedIn click fails silently

**Alternatives Considered**:
- **Cookie inspection**: Requires `cookies` permission; unnecessary complexity
- **LinkedIn API call**: Overkill; would require additional permissions and network request
- **Continuous background monitoring**: Wastes resources; on-demand sufficient

**Implementation Pattern**:
```javascript
// Content script function
function isUserLoggedInToLinkedIn() {
  // Check for common logged-in indicators
  const indicators = [
    '.global-nav__me',              // User profile nav item
    '.global-nav__me-photo',        // User avatar
    '[data-control-name="identity_profile_photo"]',
  ];
  
  return indicators.some(selector => document.querySelector(selector) !== null);
}
```

**References**:
- LinkedIn's global navigation structure includes `.global-nav__me` for logged-in users
- Login page has distinct class `.login-page` or `.authwall`

---

### 4. Timeout Handling for Dual-Save Operation

**Decision**: Allow Notion save to complete regardless of duration; apply timeout only to LinkedIn click

**Rationale**:
- Notion API response time varies (network latency, API load)
- Cancelling Notion save mid-flight risks data loss
- LinkedIn click is DOM manipulation (fast, <100ms typically)
- 3-second target is advisory; not a hard constraint
- Extension should prioritize data integrity (Notion) over convenience (LinkedIn)

**Alternatives Considered**:
- **Hard 3-second timeout on everything**: Risks incomplete Notion save
- **Parallel execution**: Already implemented; Notion save starts first
- **No timeout**: LinkedIn click might hang indefinitely on rare DOM issues

**Implementation Pattern**:
```javascript
async function dualSave(jobData, saveToLinkedInEnabled) {
  // Start Notion save (no timeout)
  const notionPromise = saveToNotion(jobData);
  
  // If LinkedIn save enabled, attempt with timeout
  let linkedInPromise = Promise.resolve({ skipped: true });
  if (saveToLinkedInEnabled) {
    linkedInPromise = Promise.race([
      clickLinkedInButton(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ]).catch(err => ({ success: false, reason: err.message }));
  }
  
  // Wait for Notion (critical), LinkedIn (best-effort)
  const [notionResult, linkedInResult] = await Promise.allSettled([
    notionPromise,
    linkedInPromise,
  ]);
  
  return {
    notion: notionResult.status === 'fulfilled' ? notionResult.value : notionResult.reason,
    linkedIn: linkedInResult.value,
  };
}
```

**References**:
- [Promise.race() MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
- [Promise.allSettled() MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

---

### 5. Chrome Extension Messaging Between Popup and Content Script

**Decision**: Use `chrome.tabs.sendMessage()` from popup to content script for LinkedIn button operations

**Rationale**:
- Popup script has access to UI state (checkbox value)
- Content script has access to LinkedIn page DOM
- Messaging API allows popup to request content script actions
- No background service worker needed for simple request-response pattern
- Content script can send results back via callback/Promise

**Alternatives Considered**:
- **Background service worker as intermediary**: Unnecessary complexity for this use case
- **Shared storage only**: Requires polling; inefficient and delayed
- **chrome.scripting.executeScript()**: Works but less elegant for complex logic; better for simple injections

**Implementation Pattern**:
```javascript
// In popup.js
async function clickLinkedInSaveButton() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'clickLinkedInSave',
  });
  
  return response;
}

// In content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clickLinkedInSave') {
    const result = clickLinkedInSaveButton(); // Function defined earlier
    sendResponse(result);
  }
  return true; // Keep message channel open for async response
});
```

**References**:
- [Message Passing Documentation](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [chrome.tabs.sendMessage() API](https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage)

---

## Best Practices Summary

### Chrome Extension Development
1. Use Manifest V3 APIs (storage, scripting, messaging)
2. Minimize permissions requested (only `storage`, `activeTab`, `scripting`)
3. Keep content scripts focused on DOM manipulation only
4. Handle async operations with Promises
5. Provide graceful degradation for failures

### LinkedIn DOM Interaction
1. Use multiple selector fallbacks for resilience
2. Detect button state before clicking (avoid duplicates)
3. Fail silently on DOM structure changes
4. Never block core functionality (Notion save) on LinkedIn automation
5. Document known limitations (English-only detection)

### User Experience
1. Persist preferences immediately on change
2. Provide visual feedback (checkbox state, save button state)
3. Disable controls during operations (prevent double-clicks)
4. Default to enabled (opt-out pattern for convenience)
5. Ensure core value (Notion save) never fails due to secondary feature (LinkedIn click)

---

## Security & Privacy Considerations

### No New Security Concerns
- Feature uses existing Notion authentication (no changes)
- chrome.storage.local is browser-native and isolated per extension
- LinkedIn click is DOM manipulation only (no credentials or data extraction)
- No new external network requests or API calls

### Data Handling
- User preference (boolean) stored locally in browser only
- No preference data sent to backend or external services
- LinkedIn button interaction is ephemeral (no state persisted about LinkedIn)

### Permissions Required
- **storage**: For chrome.storage.local API (preference persistence)
- **activeTab**: Already required for existing extension functionality
- **scripting**: May already be present; needed for content script injection

**No new privacy risks introduced by this feature.**
