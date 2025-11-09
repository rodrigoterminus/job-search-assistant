# Data Model: LinkedIn Dual-Platform Job Saving

**Date**: 2025-11-09  
**Feature**: 002-linkedin-dual-save

## Overview

This feature introduces minimal new data entities focused on user preferences and operation tracking. The primary job data model remains unchanged in Notion (managed by existing backend).

---

## Entities

### 1. User Preference

**Purpose**: Store user's choice for dual-platform saving behavior

**Storage**: Chrome's local storage API (`chrome.storage.local`)

**Schema**:
```typescript
interface UserPreference {
  saveToLinkedIn: boolean;  // Default: true
}
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `saveToLinkedIn` | boolean | Yes | `true` | Whether to automatically click LinkedIn's save button when saving to Notion |

**Validation Rules**:
- Must be a boolean value
- Defaults to `true` on first use (opt-out pattern)
- No other constraints (simple toggle)

**Lifecycle**:
- **Created**: On first extension popup open (if not exists)
- **Read**: Every time extension popup opens to populate checkbox state
- **Updated**: Immediately when user toggles checkbox
- **Deleted**: Only when extension is uninstalled (automatic browser cleanup)

**State Transitions**:
```
[Not Set] --> [true] (first popup open)
[true] <--> [false] (user toggles checkbox)
```

**Relationships**: None (standalone preference entity)

---

### 2. Save Operation (Transient)

**Purpose**: Track state of a single dual-save operation during execution

**Storage**: In-memory only (JavaScript variables); not persisted

**Schema**:
```typescript
interface SaveOperation {
  notionSave: {
    status: 'pending' | 'success' | 'error';
    timestamp: Date;
    error?: string;
  };
  linkedInClick: {
    status: 'pending' | 'success' | 'skipped' | 'already-saved' | 'error' | 'timeout';
    timestamp: Date;
    reason?: string;
  };
}
```

**Fields**:

**notionSave**:
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | string | 'pending', 'success', 'error' | Current state of Notion save operation |
| `timestamp` | Date | Any | When operation started |
| `error` | string | Optional | Error message if status is 'error' |

**linkedInClick**:
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | string | 'pending', 'success', 'skipped', 'already-saved', 'error', 'timeout' | Current state of LinkedIn click operation |
| `timestamp` | Date | Any | When operation started |
| `reason` | string | Optional | Why operation ended in current state |

**Validation Rules**:
- Notion save must always complete (success or error; never abandoned)
- LinkedIn click may timeout after 3 seconds (advisory)
- Status transitions are unidirectional (pending → terminal state)

**Lifecycle**:
- **Created**: When user clicks "Save to Notion" button
- **Updated**: As each sub-operation (Notion, LinkedIn) completes
- **Deleted**: When operation finishes and UI updates complete (garbage collected)

**State Transitions**:

Notion Save:
```
[pending] --> [success] (API call succeeds)
[pending] --> [error] (API call fails)
```

LinkedIn Click:
```
[pending] --> [success] (button clicked successfully)
[pending] --> [skipped] (checkbox unchecked)
[pending] --> [already-saved] (button shows "Saved" state)
[pending] --> [error] (button not found or DOM error)
[pending] --> [timeout] (3-second timeout exceeded)
```

**Relationships**:
- One Save Operation contains exactly one Notion save attempt
- One Save Operation contains zero or one LinkedIn click attempt (depends on checkbox state)

---

## Data Flows

### Save Operation Flow

```
User clicks "Save to Notion"
    ↓
Create SaveOperation object
    ↓
Read saveToLinkedIn preference from chrome.storage.local
    ↓
Start Notion save (update notionSave.status = 'pending')
    ↓
If saveToLinkedIn === true:
    Start LinkedIn click (update linkedInClick.status = 'pending')
    ↓
    Send message to content script
    ↓
    Content script detects button state
    ↓
    Content script clicks or skips
    ↓
    Update linkedInClick.status with result
    ↓
Else:
    Set linkedInClick.status = 'skipped'
    ↓
Wait for Notion save completion
    ↓
Update notionSave.status with result
    ↓
Show "Job saved to Notion!" message
    ↓
Garbage collect SaveOperation object
```

### Preference Update Flow

```
User toggles checkbox
    ↓
Call chrome.storage.local.set({ saveToLinkedIn: newValue })
    ↓
Update UI checkbox immediately (optimistic update)
    ↓
Storage API confirms write
    ↓
Preference persisted for future sessions
```

---

## Storage Estimates

### Chrome Local Storage

**User Preference**:
- Size: ~50 bytes (single boolean + key)
- Quantity: 1 record per extension installation
- Total: <100 bytes

**Chrome Storage Limit**: 10MB (preference uses 0.001% of available space)

### Memory (Runtime)

**Save Operation** (transient):
- Size: ~500 bytes per operation object
- Quantity: 1 active operation at a time (save button disabled during operation)
- Total: <1KB peak memory usage

**No persistent storage impact** - all job data continues to be stored in Notion via existing backend.

---

## Migrations

**No migrations required** - this is a new feature with no existing data to migrate.

If preference storage mechanism changes in future:
1. Read old preference from previous storage
2. Write to new storage mechanism
3. Delete old preference (cleanup)

---

## Constraints & Assumptions

### Assumptions
- Users have Chrome browser with Extension support
- chrome.storage.local is available and functional
- LinkedIn DOM structure remains relatively stable (multiple selector fallbacks mitigate)

### Constraints
- Preference data is per-browser-profile (does not sync across devices unless chrome.storage.sync used)
- LinkedIn button detection limited to English UI (documented limitation)
- No historical tracking of save operations (ephemeral state only)

### Future Considerations
- Could add preference for timeout duration (currently hardcoded at 3 seconds)
- Could add preference for selector priority order (advanced users only)
- Could track success/failure metrics for analytics (out of scope for MVP)
