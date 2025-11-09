# Chrome Extension Internal API Contracts

**Date**: 2025-11-09  
**Feature**: 002-linkedin-dual-save

## Overview

This document defines the internal message-passing contracts between Chrome Extension components (popup script, content script) for the LinkedIn dual-save feature.

---

## 1. Chrome Storage API Contract

### Set Preference

**Purpose**: Persist user's checkbox preference

**API**: `chrome.storage.local.set()`

**Request**:
```javascript
await chrome.storage.local.set({
  saveToLinkedIn: boolean
});
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saveToLinkedIn` | boolean | Yes | Whether to auto-click LinkedIn save button |

**Response**: Promise<void>

**Success**: Promise resolves with no value

**Errors**:
- Browser storage quota exceeded (unlikely with <100 bytes)
- Extension context invalidated (extension unloaded/reloaded)

**Example**:
```javascript
// Enable LinkedIn auto-save
await chrome.storage.local.set({ saveToLinkedIn: true });
```

---

### Get Preference

**Purpose**: Retrieve user's checkbox preference

**API**: `chrome.storage.local.get()`

**Request**:
```javascript
const result = await chrome.storage.local.get({
  saveToLinkedIn: true  // Default value if not set
});
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saveToLinkedIn` | boolean | No | Default value if preference not yet set |

**Response**:
```typescript
{
  saveToLinkedIn: boolean
}
```

**Success**: Promise resolves with object containing preference

**Errors**:
- Extension context invalidated

**Example**:
```javascript
// Get preference with default to true
const { saveToLinkedIn } = await chrome.storage.local.get({ saveToLinkedIn: true });
console.log(saveToLinkedIn); // true or false
```

---

## 2. Content Script Message API

### Message: clickLinkedInSave

**Purpose**: Request content script to click LinkedIn's save button

**Direction**: Popup Script → Content Script

**API**: `chrome.tabs.sendMessage()`

**Request**:
```javascript
const response = await chrome.tabs.sendMessage(tabId, {
  action: 'clickLinkedInSave'
});
```

**Request Schema**:
```typescript
{
  action: 'clickLinkedInSave'
}
```

**Response Schema**:
```typescript
{
  success: boolean;
  reason: 'clicked' | 'already-saved' | 'button-not-found' | 'timeout' | 'error';
  message?: string;  // Optional human-readable message
}
```

**Response Fields**:
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `success` | boolean | true/false | Whether operation succeeded |
| `reason` | string | See values | Why operation resulted in success/failure |
| `message` | string | Optional | Human-readable description (for logging) |

**Reason Values**:
| Reason | Success | Description |
|--------|---------|-------------|
| `clicked` | true | Button found and clicked successfully |
| `already-saved` | true | Job already saved (button shows "Saved" state) |
| `button-not-found` | false | LinkedIn save button not found in DOM |
| `timeout` | false | Operation exceeded 3-second timeout |
| `error` | false | DOM error or unexpected exception |

**Examples**:

Success - Button clicked:
```javascript
{
  success: true,
  reason: 'clicked',
  message: 'LinkedIn save button clicked'
}
```

Success - Already saved:
```javascript
{
  success: true,
  reason: 'already-saved',
  message: 'Job already saved on LinkedIn'
}
```

Failure - Button not found:
```javascript
{
  success: false,
  reason: 'button-not-found',
  message: 'Could not locate LinkedIn save button'
}
```

**Error Handling**:
- Content script not loaded: Popup should catch messaging error and treat as failure
- Tab closed/navigated: Promise rejects; popup handles gracefully
- LinkedIn DOM changed: Returns `button-not-found` reason

---

### Message: checkLinkedInLoginState

**Purpose**: Request content script to check if user is logged into LinkedIn

**Direction**: Popup Script → Content Script

**API**: `chrome.tabs.sendMessage()`

**Request**:
```javascript
const response = await chrome.tabs.sendMessage(tabId, {
  action: 'checkLinkedInLoginState'
});
```

**Request Schema**:
```typescript
{
  action: 'checkLinkedInLoginState'
}
```

**Response Schema**:
```typescript
{
  loggedIn: boolean;
  indicators?: string[];  // Optional: which indicators detected (for debugging)
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `loggedIn` | boolean | Whether user appears to be logged into LinkedIn |
| `indicators` | string[] | Optional array of detected login indicators (for logging) |

**Examples**:

Logged in:
```javascript
{
  loggedIn: true,
  indicators: ['.global-nav__me', '.global-nav__me-photo']
}
```

Logged out:
```javascript
{
  loggedIn: false,
  indicators: []
}
```

**Error Handling**:
- Content script not loaded: Treat as logged out (safe default)
- LinkedIn page structure changed: May return false negative (acceptable; user can still manually save)

---

## 3. Content Script Implementation Requirements

### Required Message Handlers

Content script MUST register listener for these actions:

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'clickLinkedInSave':
      handleClickLinkedInSave(sendResponse);
      return true; // Async response
      
    case 'checkLinkedInLoginState':
      handleCheckLoginState(sendResponse);
      return true; // Async response
      
    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});
```

### Button Detection Strategy

**Selector Fallbacks** (in priority order):
1. `button[aria-label*="Save"]` - ARIA label contains "Save"
2. `button.jobs-save-button` - LinkedIn's job save button class
3. `button[data-control-name*="save"]` - Data attribute matching
4. Text content matching "Save" (case-insensitive)

**Already-Saved Detection**:
- Check button text content for "Saved" (case-insensitive)
- If button text is "Saved", return `already-saved` without clicking

### Login State Detection Strategy

**Login Indicators** (any match indicates logged in):
1. `.global-nav__me` - User profile nav item
2. `.global-nav__me-photo` - User avatar image
3. `[data-control-name="identity_profile_photo"]` - Profile photo element

**Logout Indicators** (presence indicates logged out):
1. `.login-page` - Login page container
2. `.authwall` - Authentication wall
3. `form[action*="login"]` - Login form

---

## 4. Error Handling Contracts

### Content Script Errors

All content script message handlers MUST catch errors and return structured response:

```javascript
try {
  // Attempt operation
  sendResponse({ success: true, reason: 'clicked' });
} catch (error) {
  sendResponse({ 
    success: false, 
    reason: 'error',
    message: error.message 
  });
}
```

### Popup Script Error Handling

Popup MUST handle these scenarios:
1. **Messaging failure**: Content script not loaded or tab closed
   - Treat as LinkedIn save failure
   - Ensure Notion save still proceeds
   
2. **Timeout**: No response within 3 seconds
   - Cancel LinkedIn operation
   - Ensure Notion save still proceeds

3. **Unexpected response**: Malformed or missing fields
   - Log error for debugging
   - Treat as failure, proceed with Notion save

---

## 5. Timing & Performance Contracts

### Content Script Response Time

**Target**: <100ms for button detection and click  
**Maximum**: 3 seconds (advisory timeout)

**Rationale**: DOM operations are fast; only network-related delays (rare) should cause slowness

### Storage Operations

**Target**: <50ms for preference read/write  
**Maximum**: 500ms (Chrome API internal timeout)

**Rationale**: Local storage is in-memory; disk write is async and fast

### Total Dual-Save Operation

**Target**: <3 seconds (Notion + LinkedIn)  
**Breakdown**:
- LinkedIn detection + click: <100ms
- Notion API call: 1-5 seconds (variable)
- UI update: <50ms

**Note**: Notion save has no hard timeout; 3-second target is advisory

---

## 6. Manifest Requirements

### Permissions

Required in `manifest.json`:
```json
{
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ]
}
```

### Content Script Registration

```json
{
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/*"],
      "js": ["content/content_script.js"],
      "run_at": "document_idle"
    }
  ]
}
```

**run_at: document_idle** ensures DOM is loaded before script executes

---

## Version Compatibility

**Chrome Version**: 88+ (Manifest V3 support)  
**Extension API Version**: Manifest V3  
**LinkedIn Compatibility**: Current UI structure (as of 2025-11); selectors may need updates if LinkedIn redesigns

---

## Testing Contracts

### Unit Test Coverage

Required test cases for content script:
1. Button found and clicked successfully
2. Button already in "Saved" state
3. Button not found in DOM
4. Login state detected correctly (logged in)
5. Login state detected correctly (logged out)
6. Multiple selector fallbacks work

Required test cases for popup:
1. Preference saved and retrieved correctly
2. Default preference is `true`
3. Checkbox state syncs with storage
4. Message sent to content script on save
5. Notion save proceeds even if LinkedIn fails

### Integration Test Scenarios

1. Full dual-save flow on real LinkedIn job page
2. Preference persists across browser restarts
3. Graceful failure when not on LinkedIn page
4. Graceful failure when LinkedIn button missing
5. Checkbox disabled when logged out of LinkedIn
