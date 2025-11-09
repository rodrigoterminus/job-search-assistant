# Quickstart Guide: LinkedIn Dual-Platform Job Saving

**Date**: 2025-11-09  
**Feature**: 002-linkedin-dual-save  
**Audience**: Developers implementing this feature

## Prerequisites

- Existing Chrome Extension setup in `packages/chrome-extension/`
- Existing Flask backend with Notion integration in `packages/backend/`
- Chrome browser for testing (version 88+)
- LinkedIn account for testing save functionality

## Development Setup

### 1. Verify Current Extension Setup

```bash
cd packages/chrome-extension

# Check existing structure
ls -la popup/    # Should have popup.html, popup.js, popup.css
ls -la content/  # Should have content_script.js
cat manifest.json # Verify Manifest V3 and existing permissions
```

### 2. Update manifest.json (if needed)

Ensure these permissions are present:

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",      // For chrome.storage.local
    "scripting",    // For content script injection
    "activeTab"     // For accessing LinkedIn tab
  ],
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/*"],
      "js": ["content/content_script.js"],
      "run_at": "document_idle"
    }
  ]
}
```

## Implementation Checklist

### Phase 1: Add UI Checkbox (popup/)

**File**: `popup/popup.html`

Add checkbox to form (before "Save to Notion" button):
```html
<div class="form-group">
  <label class="checkbox-label">
    <input type="checkbox" id="save-to-linkedin" checked>
    <span>Also save on LinkedIn</span>
  </label>
</div>
```

**File**: `popup/popup.css`

Style the checkbox:
```css
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**File**: `popup/popup.js`

1. Load preference on popup open
2. Save preference on checkbox change
3. Disable checkbox if logged out
4. Trigger LinkedIn click on save

```javascript
// Initialize checkbox state from storage
async function initializeCheckbox() {
  const { saveToLinkedIn } = await chrome.storage.local.get({ saveToLinkedIn: true });
  document.getElementById('save-to-linkedin').checked = saveToLinkedIn;
}

// Save preference when checkbox changes
document.getElementById('save-to-linkedin').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ saveToLinkedIn: e.target.checked });
});

// Check login state and disable checkbox if logged out
async function checkLoginState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'checkLinkedInLoginState'
    });
    
    const checkbox = document.getElementById('save-to-linkedin');
    const label = checkbox.parentElement;
    
    if (!response.loggedIn) {
      checkbox.disabled = true;
      label.classList.add('disabled');
    }
  } catch (error) {
    // Content script not loaded or not on LinkedIn; leave checkbox enabled
    console.warn('Could not check login state:', error);
  }
}

// Call on popup load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeCheckbox();
  await checkLoginState();
});
```

### Phase 2: Implement Content Script Message Handlers

**File**: `content/content_script.js`

Add message listener and handlers:

```javascript
// LinkedIn Save Button Detection
function findLinkedInSaveButton() {
  const selectors = [
    'button[aria-label*="Save"]',
    'button.jobs-save-button',
    'button[data-control-name*="save"]',
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) return button;
  }
  return null;
}

function isJobAlreadySaved(button) {
  const text = (button.textContent || button.innerText || '').toLowerCase();
  return text.includes('saved');
}

function handleClickLinkedInSave(sendResponse) {
  try {
    const button = findLinkedInSaveButton();
    
    if (!button) {
      sendResponse({ 
        success: false, 
        reason: 'button-not-found',
        message: 'LinkedIn save button not found'
      });
      return;
    }
    
    if (isJobAlreadySaved(button)) {
      sendResponse({ 
        success: true, 
        reason: 'already-saved',
        message: 'Job already saved on LinkedIn'
      });
      return;
    }
    
    button.click();
    sendResponse({ 
      success: true, 
      reason: 'clicked',
      message: 'LinkedIn save button clicked'
    });
  } catch (error) {
    sendResponse({ 
      success: false, 
      reason: 'error',
      message: error.message
    });
  }
}

// LinkedIn Login State Detection
function handleCheckLoginState(sendResponse) {
  const loginIndicators = [
    '.global-nav__me',
    '.global-nav__me-photo',
    '[data-control-name="identity_profile_photo"]',
  ];
  
  const detected = loginIndicators.filter(selector => 
    document.querySelector(selector) !== null
  );
  
  sendResponse({
    loggedIn: detected.length > 0,
    indicators: detected
  });
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'clickLinkedInSave':
      handleClickLinkedInSave(sendResponse);
      return true; // Keep channel open for async response
      
    case 'checkLinkedInLoginState':
      handleCheckLoginState(sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});
```

### Phase 3: Update Save Flow in Popup

**File**: `popup/popup.js`

Modify the existing save button click handler:

```javascript
// Function to click LinkedIn save button
async function clickLinkedInSaveButton() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'clickLinkedInSave'
    });
    return response;
  } catch (error) {
    return { 
      success: false, 
      reason: 'error',
      message: error.message
    };
  }
}

// Update existing save button handler
document.getElementById('save-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Disable button to prevent double-clicks
  const saveBtn = e.target;
  saveBtn.disabled = true;
  
  try {
    // 1. Get job data (existing logic)
    const jobData = getFormData();
    
    // 2. Save to Notion (existing API call - ALWAYS happens)
    const notionResult = await saveToNotion(jobData);
    
    // 3. Click LinkedIn button if enabled
    const { saveToLinkedIn } = await chrome.storage.local.get({ saveToLinkedIn: true });
    
    if (saveToLinkedIn) {
      // Fire and forget - don't block on LinkedIn click
      clickLinkedInSaveButton().catch(err => {
        console.warn('LinkedIn click failed:', err);
        // Gracefully ignore - Notion save succeeded
      });
    }
    
    // 4. Show success message (existing UI update)
    showSuccess('Job saved to Notion!');
    
  } catch (error) {
    showError('Failed to save job: ' + error.message);
  } finally {
    saveBtn.disabled = false;
  }
});
```

## Testing Guide

### Manual Testing Checklist

1. **Checkbox Persistence**
   - [ ] Check checkbox → reload extension → checkbox still checked
   - [ ] Uncheck checkbox → reload extension → checkbox still unchecked
   - [ ] Default state on first install is checked

2. **Login State Detection**
   - [ ] Logged into LinkedIn → checkbox enabled
   - [ ] Logged out of LinkedIn → checkbox disabled and grayed out
   - [ ] On non-LinkedIn page → checkbox enabled (default)

3. **Dual-Save Flow**
   - [ ] Checkbox checked → click save → job saved to Notion AND LinkedIn button clicked
   - [ ] Checkbox unchecked → click save → job saved to Notion only
   - [ ] LinkedIn button already "Saved" → skip clicking (no duplicate)

4. **Edge Cases**
   - [ ] LinkedIn button not found → Notion save succeeds, no error shown
   - [ ] Rapid double-click on save button → button disabled, only one save operation
   - [ ] Close popup during save → operation completes (non-blocking)

5. **Error Scenarios**
   - [ ] Notion API fails → error shown, LinkedIn click not attempted
   - [ ] LinkedIn DOM changed → Notion save succeeds, LinkedIn click fails silently

### Browser Console Debugging

```javascript
// Check stored preference
chrome.storage.local.get(['saveToLinkedIn'], console.log);

// Manually trigger login check
chrome.tabs.query({active: true}, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'checkLinkedInLoginState'}, console.log);
});

// Manually trigger LinkedIn click
chrome.tabs.query({active: true}, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'clickLinkedInSave'}, console.log);
});
```

## Development Workflow

### 1. Local Development

```bash
# Navigate to extension directory
cd packages/chrome-extension

# Make changes to popup/, content/, or manifest.json

# Reload extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Click "Reload" button under Job Search Assistant extension
# 3. Test on LinkedIn job page
```

### 2. Test on LinkedIn

1. Navigate to any LinkedIn job posting: `https://www.linkedin.com/jobs/view/{job-id}`
2. Open extension popup
3. Verify checkbox state
4. Fill in job details (or use existing scraping)
5. Click "Save to Notion"
6. Verify:
   - Notion database entry created
   - LinkedIn button changes to "Saved" (if checkbox was checked)
   - Success message shown

### 3. Debug Content Script

```javascript
// Add to content_script.js for debugging
console.log('[Content Script] Loaded on LinkedIn');

// Log button detection
const button = findLinkedInSaveButton();
console.log('[Content Script] Save button:', button);

// Log login state
const loggedIn = isUserLoggedIn();
console.log('[Content Script] Logged in:', loggedIn);
```

## Common Issues & Solutions

### Issue: Checkbox preference not persisting

**Solution**: Verify `storage` permission in manifest.json

```json
"permissions": ["storage"]
```

### Issue: Content script not receiving messages

**Solution**: 
1. Check content script is loaded: inspect LinkedIn page → Console → look for console.log
2. Verify URL matches pattern in manifest.json
3. Reload extension after changes

### Issue: LinkedIn button not found

**Solution**:
1. Inspect LinkedIn page → find save button element
2. Check button's attributes (class, aria-label, data-control-name)
3. Add new selector to fallback list in `findLinkedInSaveButton()`

### Issue: Save button doesn't disable during save

**Solution**: Ensure `disabled` attribute is set immediately on click:
```javascript
saveBtn.disabled = true;
// ... save operations ...
saveBtn.disabled = false; // Re-enable in finally block
```

## Next Steps

After implementing this feature:

1. **User Testing**: Test with real job searches over several days
2. **LinkedIn UI Changes**: Monitor for LinkedIn redesigns that break selectors
3. **Analytics**: Consider adding optional success/failure tracking (future enhancement)
4. **Multi-Language Support**: Add locale detection and button text mapping (future enhancement)

## Resources

- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
