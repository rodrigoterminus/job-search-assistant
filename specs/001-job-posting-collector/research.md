# Research: Job Posting Collector

**Feature**: 001-job-posting-collector  
**Created**: 2025-11-05  
**Phase**: 0 - Research & Technology Decisions

## Research Tasks Completed

### 1. LinkedIn DOM Structure Analysis

**Decision**: Use CSS selectors with fallback strategy for job data extraction

**Rationale**:
- LinkedIn job posting pages follow consistent DOM patterns for core fields
- Primary selectors target data-test-id and ARIA attributes (more stable than class names)
- Fallback selectors use class names and element hierarchy for resilience

**Extraction Strategy**:
- **Job Title**: Primary selector: `h1.top-card-layout__title`, Fallback: `[data-job-title]`
- **Company Name**: Primary selector: `a.topcard__org-name-link`, Fallback: `.topcard__flavor--black-link`
- **Job URL**: Use `window.location.href` directly from content script context

**Alternatives Considered**:
- XPath selectors: More brittle to page structure changes
- LinkedIn API: Requires OAuth, rate limits, not suitable for personal scraping use case
- Third-party scraping services: Violates local-first principle, adds external dependency

**Best Practices**:
- Implement retry logic for dynamically loaded content
- Wait for DOM ready state before extraction
- Gracefully handle missing fields (partial data is better than no data)
- Log extraction failures for debugging selector changes

---

### 2. Flask Backend Architecture

**Decision**: Lightweight Flask application with minimal middleware stack

**Rationale**:
- Single endpoint requirement doesn't justify complex frameworks (Django, FastAPI)
- Flask provides simple routing and request handling
- Minimal dependencies align with single-user, local-first constraints
- Easy to extend for future endpoints (cover letter generation)

**Architecture**:
```
app.py (entry point)
  ├── routes.py (POST /api/job-postings endpoint)
  ├── validators.py (request schema validation)
  ├── notion_service.py (Notion API client wrapper)
  └── settings.py (environment config, CORS settings)
```

**Dependencies Justification**:
- `flask`: Core web framework
- `flask-cors`: Required for Chrome Extension → localhost communication
- `notion-client`: Official Notion SDK, handles API versioning and retries
- `python-dotenv`: Secure environment variable management

**Alternatives Considered**:
- FastAPI: Overkill for single endpoint, adds async complexity
- Django: Too heavyweight, includes unnecessary ORM and admin interface
- Custom HTTP server: Reinventing the wheel, less maintainable

**Best Practices**:
- Use Flask blueprints for future modularity (even with one endpoint)
- Implement structured error responses with HTTP status codes
- Add request logging for debugging
- Use environment-based configuration (dev vs. production Flask settings)

---

### 3. Notion API Integration Strategy

**Decision**: Use official `notion-client` Python SDK with page creation API

**Rationale**:
- Official SDK handles authentication, retries, and API versioning automatically
- Page creation API (`notion.pages.create`) matches our use case exactly
- SDK provides type hints and validation for API payloads

**Integration Approach**:
- Store `NOTION_API_KEY` and `NOTION_DATABASE_ID` in environment variables
- Initialize client once on application startup (singleton pattern)
- Map job posting fields to Notion database properties
- Handle Notion API errors gracefully (rate limits, network failures, invalid tokens)

**Notion Database Schema Requirements**:
The Job Applications database must have these properties (exact names):
- **Position** (Title type) - Job title
- **Company** (Rich Text) - Company name
- **Posting URL** (URL) - Link to original LinkedIn posting
- **Level** (Select) - Options: Engineer, Senior Engineer, Tech Lead, Architect, Cloud Engineer, Manager, C-Level, VP, Founder
- **Match** (Select) - Options: low, medium, high
- **Work Arrangement** (Select) - Options: remote, hybrid, on-site
- **City** (Rich Text) - Job location city
- **Country** (Rich Text) - Job location country
- **Demand** (Select) - Options: 0-50, 51-200, 201-500, 500+
- **Budget** (Number) - Salary budget
- **Recruiter** (Rich Text) - Recruiter name
- **Talent Acquisition** (Rich Text) - TA contact
- **Hiring Manager** (Rich Text) - Hiring manager name
- **Job Description** (Rich Text) - Full job description text
- **Origin** (Select) - Options: LinkedIn (default for this feature)

**MVP Scope for v1**:
Only populate these fields initially:
- Position (required)
- Company (required)
- Posting URL (required)
- Origin (always "LinkedIn")

Future enhancement: Extract additional fields from LinkedIn page (location, seniority, description)

**Error Handling**:
- Validate database exists before page creation
- Check required properties exist in database schema
- Implement exponential backoff for rate limiting (429 responses)
- Return descriptive errors to extension for user feedback

**Alternatives Considered**:
- Direct HTTP requests to Notion API: More boilerplate, manual retry logic
- Notion database templates: Not applicable, user provides existing database
- Local caching: Violates Principle VI (Notion as sole datastore)

**Best Practices**:
- Validate Notion credentials on application startup
- Use structured logging for API calls (request/response debugging)
- Implement idempotency checks (duplicate URL detection)
- Set reasonable timeouts for Notion API calls (10 seconds)

---

### 4. Chrome Extension Architecture (Manifest V3)

**Decision**: Use Manifest V3 with popup UI and content script injection

**Rationale**:
- Manifest V3 is the current standard (V2 deprecated by Chrome)
- Popup provides simple UI for save button
- Content script has access to LinkedIn page DOM for scraping
- Message passing enables popup ↔ content script communication

**Architecture**:
```
popup.html/popup.js (UI layer)
  ├── User clicks "Save Job" button
  ├── Injects content_script.js into active tab
  ├── Receives scraped data via chrome.tabs.sendMessage
  └── Sends POST request to Flask backend
  
content_script.js (scraping layer)
  ├── Executes in LinkedIn page context
  ├── Scrapes DOM for job title, company, URL
  ├── Returns data to popup via chrome.runtime.sendMessage
```

**Permissions Required**:
- `activeTab`: Access current tab URL and inject content script
- `scripting`: Inject content_script.js dynamically
- `host_permissions`: ["https://www.linkedin.com/*"] for content script execution

**Communication Flow**:
1. User clicks save button in popup
2. Popup executes `chrome.scripting.executeScript()` to inject content script
3. Content script scrapes LinkedIn DOM, returns data object
4. Popup receives data, validates, sends to Flask backend
5. Popup displays success/error message based on backend response

**Alternatives Considered**:
- Background service worker: Not needed, all logic handled in popup
- Persistent content script: Unnecessary overhead for on-demand scraping
- Chrome storage API: Violates Principle VI (Notion as sole datastore)

**Best Practices**:
- Validate LinkedIn URL before injection attempt
- Implement timeout for content script execution (5 seconds)
- Display loading state during scraping and API call
- Handle extension update scenarios gracefully
- Use semantic versioning for extension releases

---

### 5. CORS Configuration

**Decision**: Configure Flask-CORS to allow Chrome Extension origin

**Rationale**:
- Chrome extensions have origin format: `chrome-extension://<extension-id>`
- Extension ID is generated during development (changes per install in dev mode)
- Need to allow both development and packaged extension origins

**Configuration Strategy**:
```python
# Development: Allow all chrome-extension origins
CORS(app, resources={
    r"/api/*": {
        "origins": ["chrome-extension://*"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

**Security Considerations**:
- Local-only backend (localhost:5000) not exposed to internet
- Single-user tool, no cross-origin security concerns
- Chrome extension policy enforces same origin for extension resources

**Alternatives Considered**:
- Whitelist specific extension ID: Breaks during development (ID changes)
- Allow all origins (*): Acceptable for local-only server, but less explicit
- Custom CORS headers: More boilerplate, Flask-CORS handles OPTIONS preflight

**Best Practices**:
- Document CORS configuration in backend README
- Test preflight OPTIONS requests during development
- Log CORS-rejected requests for debugging

---

## Technology Stack Summary

### Backend
- **Python**: 3.10+ (latest stable with type hints support)
- **Flask**: 3.0+ (lightweight web framework)
- **notion-client**: 2.2+ (official Notion SDK)
- **flask-cors**: 4.0+ (CORS handling)
- **python-dotenv**: 1.0+ (environment variables)
- **pytest**: 7.4+ (testing framework)

### Frontend (Chrome Extension)
- **Manifest Version**: V3 (Chrome's current standard)
- **JavaScript**: ES6+ (modern syntax, async/await)
- **Chrome APIs**: tabs, scripting, runtime (message passing)

### Development Tools
- **VS Code**: Recommended IDE with Python and JavaScript extensions
- **Chrome DevTools**: Extension debugging and network inspection
- **Postman/cURL**: Backend API testing

### External Services
- **Notion API**: v2022-06-28 (latest stable)
- **LinkedIn**: Web scraping (no API, read-only DOM access)

---

## Risk Assessment

### High Risk
- **LinkedIn DOM changes**: Mitigation → Fallback selectors, error handling, user manual entry option

### Medium Risk
- **Notion API rate limiting**: Mitigation → Exponential backoff, request throttling, user feedback
- **Extension ID changes in development**: Mitigation → Wildcard CORS origin, documentation

### Low Risk
- **Flask backend crashes**: Mitigation → Error logging, graceful degradation, restart instructions
- **Network failures**: Mitigation → Retry logic, timeout handling, clear error messages

---

## Implementation Priorities

1. **Phase 1**: Backend API endpoint + Notion integration
2. **Phase 2**: Chrome Extension popup + content script
3. **Phase 3**: Integration testing (extension → backend → Notion)
4. **Phase 4**: Error handling and user feedback refinement
5. **Phase 5**: Documentation and deployment instructions

---

## Open Questions

**Q: Should we implement duplicate detection in MVP?**
A: YES - Check for existing Notion pages with same Posting URL before creation. Prevents accidental re-saves.

**Q: Should we validate Notion database schema on startup?**
A: YES - Query database properties via Notion API, verify Position, Company, Posting URL fields exist. Fail fast with clear error message.

**Q: Should we extract additional LinkedIn fields (location, description) in MVP?**
A: NO - Start with Position, Company, URL only. Additional extraction adds complexity and fragility. Future enhancement after MVP validation.

**Q: Should we support LinkedIn Easy Apply vs. external application links?**
A: NOT APPLICABLE - Both use same DOM structure for job title/company. URL capture works for both.

**Q: Should we add logging to backend?**
A: YES - Use Python logging module with file output. Essential for debugging Notion API issues and scraping failures.
