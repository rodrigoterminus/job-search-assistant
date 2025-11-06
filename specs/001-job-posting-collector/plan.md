# Implementation Plan: Job Posting Collector

**Branch**: `001-job-posting-collector` | **Date**: 2025-11-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-job-posting-collector/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Job Posting Collector enables review and save of LinkedIn job postings to a Notion database. The system consists of a Chrome Extension that provides a popup UI for data review/editing, and a local Flask backend that orchestrates the Notion API integration. Key workflow: User clicks extension icon on LinkedIn → Extension extracts job data from DOM and pre-fills popup form → User reviews/edits data in popup → User clicks save → Extension sends form data to Flask backend → Backend creates Notion database entry → User receives confirmation in popup.

## Technical Context

**Language/Version**: Python 3.10+ (backend), JavaScript ES6+ (Chrome Extension)
**Primary Dependencies**: Flask 3.0+, notion-client 2.2+, flask-cors 4.0+, python-dotenv 1.0+  
**Storage**: Notion API (external, primary datastore per constitution)  
**Testing**: Manual testing only (no automated tests for MVP)  
**Target Platform**: macOS local development server (Flask), Chrome browser (Extension)  
**Project Type**: Web application (backend + frontend extension)  
**Performance Goals**: <5 seconds end-to-end save, <2 seconds user feedback, 95% extraction accuracy  
**Constraints**: Local-only backend (no cloud deployment), single-user (no auth), Chrome-only extension  
**Scale/Scope**: Single user, ~50-100 job postings per job search cycle, low concurrent request volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Project Identity & Single-User Focus
- **Status**: COMPLIANT
- **Verification**: Feature designed for single user, no multi-user features, simplified UI

### ✅ Principle II: Local-First Architecture (NON-NEGOTIABLE)
- **Status**: COMPLIANT
- **Verification**: Flask backend runs on localhost, no cloud deployment planned

### ✅ Principle III: Backend Technology Mandate
- **Status**: COMPLIANT
- **Verification**: Python 3.10+ with Flask framework specified

### ✅ Principle IV: Frontend Technology Mandate
- **Status**: COMPLIANT
- **Verification**: Chrome Extension (Manifest V3) specified for frontend

### ✅ Principle V: Component Communication Principle
- **Status**: COMPLIANT
- **Verification**: Extension acts as thin client, Flask backend handles all Notion API calls

### ✅ Principle VI: Primary Datastore Mandate
- **Status**: COMPLIANT
- **Verification**: Notion API used as sole persistent datastore, no local database

### ⚠️ Principle VII: Document Management Mandate
- **Status**: NOT APPLICABLE (Future Feature)
- **Verification**: This MVP does not include document generation, will be required for cover letter feature

### ⚠️ Principle VIII: Content Generation Mandate
- **Status**: NOT APPLICABLE (Future Feature)
- **Verification**: This MVP does not include AI content generation, will be required for cover letter feature

### ✅ Principle IX: Security & Authentication Principle
- **Status**: COMPLIANT
- **Verification**: Notion API key stored in .env file (secure environment variables), not committed to version control

**GATE RESULT**: ✅ PASS - All applicable constitutional principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-job-posting-collector/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.openapi.yaml # OpenAPI specification for Flask API
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
job-search-assistant/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py          # API endpoint definitions
│   │   │   └── validators.py      # Request validation logic
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── notion_service.py  # Notion API integration
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── settings.py        # Configuration management
│   │   └── app.py                 # Flask application entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example              # Environment variable template
│   └── README.md                 # Backend setup instructions
│
├── chrome-extension/
│   ├── manifest.json             # Extension configuration (Manifest V3)
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   ├── popup.js             # Popup logic and API communication
│   │   └── popup.css            # Popup styling
│   ├── content/
│   │   └── content_script.js    # LinkedIn DOM scraping logic
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── README.md                # Extension installation instructions
│
└── .gitignore                   # Excludes .env, __pycache__, etc.
```

**Structure Decision**: Web application structure (Option 2) selected because the feature requires both a backend API server (Flask) and a frontend client (Chrome Extension). The backend handles Notion API integration per constitutional principle V (component communication), while the extension provides the browser-based UI per principle IV (frontend technology mandate).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations detected. All complexity is justified by constitutional requirements:
- Dual-component architecture (backend + extension) required by Principles IV & V
- Notion API integration required by Principle VI
- Local-only deployment simplifies infrastructure per Principle II

---

## Implementation Details

### Backend (Flask) Implementation

#### File: `backend/requirements.txt`
```text
Flask==3.0.0
notion-client==2.2.1
flask-cors==4.0.0
python-dotenv==1.0.0
```

#### File: `backend/.env.example`
```env
# Notion API Configuration
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

#### File: `backend/src/config/settings.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration from environment variables."""
    
    # Notion API
    NOTION_API_KEY = os.getenv('NOTION_API_KEY')
    NOTION_DATABASE_ID = os.getenv('NOTION_DATABASE_ID')
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # CORS - Allow Chrome Extension origins
    CORS_ORIGINS = ['chrome-extension://*']
    
    # Validation
    @classmethod
    def validate(cls):
        """Validate required configuration is present."""
        if not cls.NOTION_API_KEY:
            raise ValueError("NOTION_API_KEY environment variable is required")
        if not cls.NOTION_DATABASE_ID:
            raise ValueError("NOTION_DATABASE_ID environment variable is required")
```

#### File: `backend/src/api/validators.py`
```python
import re
from typing import Dict, Optional

LINKEDIN_URL_PATTERN = re.compile(
    r'^https://www\.linkedin\.com/jobs/(view|collections)/.+$'
)

def validate_job_posting(data: Dict) -> tuple[bool, Optional[str]]:
    """
    Validate job posting request data.
    
    Args:
        data: Request JSON payload
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check required fields
    required_fields = ['position', 'company', 'posting_url', 'origin']
    for field in required_fields:
        if field not in data:
            return False, f"{field} is required"
        
        # Check for empty strings
        if isinstance(data[field], str) and not data[field].strip():
            return False, f"{field} cannot be empty"
    
    # Validate position length
    if len(data['position']) > 500:
        return False, "position must be 500 characters or less"
    
    # Validate company length
    if len(data['company']) > 200:
        return False, "company must be 200 characters or less"
    
    # Validate LinkedIn URL format
    if not LINKEDIN_URL_PATTERN.match(data['posting_url']):
        return False, "posting_url must be a valid LinkedIn job URL"
    
    # Validate origin
    if data['origin'] != 'LinkedIn':
        return False, "origin must be 'LinkedIn'"
    
    return True, None
```

#### File: `backend/src/services/notion_service.py`
```python
from notion_client import Client
from notion_client.errors import APIResponseError
import logging

logger = logging.getLogger(__name__)

class NotionService:
    """Service for interacting with Notion API."""
    
    def __init__(self, api_key: str, database_id: str):
        self.client = Client(auth=api_key)
        self.database_id = database_id
        
    def validate_database(self) -> tuple[bool, Optional[str]]:
        """
        Validate database exists and has required properties.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            db = self.client.databases.retrieve(database_id=self.database_id)
            properties = db.get('properties', {})
            
            required_props = {
                'Position': 'title',
                'Company': 'rich_text',
                'Posting URL': 'url',
                'Origin': 'select'
            }
            
            for prop_name, prop_type in required_props.items():
                if prop_name not in properties:
                    return False, f"Missing required property: {prop_name}"
                if properties[prop_name]['type'] != prop_type:
                    return False, f"Property {prop_name} must be type {prop_type}"
            
            return True, None
            
        except APIResponseError as e:
            logger.error(f"Notion API error during validation: {e}")
            return False, str(e)
    
    def check_duplicate(self, posting_url: str) -> Optional[str]:
        """
        Check if job posting URL already exists in database.
        
        Args:
            posting_url: LinkedIn job posting URL
            
        Returns:
            Existing page ID if duplicate found, None otherwise
        """
        try:
            response = self.client.databases.query(
                database_id=self.database_id,
                filter={
                    "property": "Posting URL",
                    "url": {
                        "equals": posting_url
                    }
                }
            )
            
            if response.get('results'):
                return response['results'][0]['id']
            return None
            
        except APIResponseError as e:
            logger.error(f"Error checking for duplicates: {e}")
            return None
    
    def create_job_posting(self, position: str, company: str, 
                          posting_url: str, origin: str = 'LinkedIn') -> Dict:
        """
        Create new job posting entry in Notion database.
        
        Args:
            position: Job title
            company: Company name
            posting_url: LinkedIn URL
            origin: Source platform (default: LinkedIn)
            
        Returns:
            Created page object from Notion API
        """
        properties = {
            "Position": {
                "title": [
                    {
                        "text": {
                            "content": position
                        }
                    }
                ]
            },
            "Company": {
                "rich_text": [
                    {
                        "text": {
                            "content": company
                        }
                    }
                ]
            },
            "Posting URL": {
                "url": posting_url
            },
            "Origin": {
                "select": {
                    "name": origin
                }
            }
        }
        
        response = self.client.pages.create(
            parent={"database_id": self.database_id},
            properties=properties
        )
        
        return response
```

#### File: `backend/src/api/routes.py`
```python
from flask import Blueprint, request, jsonify
from notion_client.errors import APIResponseError
import logging

from ..services.notion_service import NotionService
from ..api.validators import validate_job_posting
from ..config.settings import Config

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize Notion service
notion_service = NotionService(
    api_key=Config.NOTION_API_KEY,
    database_id=Config.NOTION_DATABASE_ID
)

@api_bp.route('/job-postings', methods=['POST'])
def create_job_posting():
    """
    Create new job posting in Notion database.
    
    Expected JSON:
    {
        "position": "Senior Software Engineer",
        "company": "Acme Corp",
        "posting_url": "https://www.linkedin.com/jobs/view/1234567890",
        "origin": "LinkedIn"
    }
    """
    data = request.get_json()
    
    # Validate request
    is_valid, error_msg = validate_job_posting(data)
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    
    # Check for duplicate
    existing_page_id = notion_service.check_duplicate(data['posting_url'])
    if existing_page_id:
        page_url = f"https://www.notion.so/{existing_page_id.replace('-', '')}"
        return jsonify({
            "error": "Job posting already saved",
            "duplicate_field": "posting_url",
            "existing_page_id": existing_page_id,
            "existing_page_url": page_url
        }), 409
    
    # Create page in Notion
    try:
        page = notion_service.create_job_posting(
            position=data['position'],
            company=data['company'],
            posting_url=data['posting_url'],
            origin=data['origin']
        )
        
        page_id = page['id']
        page_url = page['url']
        
        return jsonify({
            "message": "Job posting saved successfully",
            "notion_page_id": page_id,
            "notion_page_url": page_url,
            "job_data": data
        }), 201
        
    except APIResponseError as e:
        logger.error(f"Notion API error: {e}")
        
        if e.code == 'unauthorized':
            return jsonify({"error": "Notion authentication failed"}), 401
        elif e.code == 'object_not_found':
            return jsonify({"error": "Notion database not found"}), 404
        elif e.code == 'rate_limited':
            return jsonify({
                "error": "Rate limit exceeded",
                "retry_after": 60
            }), 429
        else:
            return jsonify({"error": "Internal server error"}), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    is_valid, error_msg = notion_service.validate_database()
    
    if is_valid:
        return jsonify({
            "status": "healthy",
            "notion_connected": True,
            "database_validated": True
        }), 200
    else:
        return jsonify({
            "status": "unhealthy",
            "notion_connected": False,
            "database_validated": False,
            "error": error_msg
        }), 500
```

#### File: `backend/src/app.py`
```python
from flask import Flask
from flask_cors import CORS
import logging

from .config.settings import Config
from .api.routes import api_bp

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if Config.FLASK_DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app():
    """Application factory."""
    app = Flask(__name__)
    
    # Configure CORS for Chrome Extension
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.CORS_ORIGINS,
            "methods": ["POST", "OPTIONS", "GET"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    return app

if __name__ == '__main__':
    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        exit(1)
    
    # Create and run app
    app = create_app()
    logger.info(f"Starting Flask server on port {Config.FLASK_PORT}")
    app.run(
        host='127.0.0.1',
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
```

---

### Frontend (Chrome Extension) Implementation

#### File: `chrome-extension/manifest.json`
```json
{
  "manifest_version": 3,
  "name": "Job Posting Collector",
  "version": "1.0.0",
  "description": "Save LinkedIn job postings to Notion with one click",
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://www.linkedin.com/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_scripts": []
}
```

#### File: `chrome-extension/content/content_script.js`
```javascript
/**
 * LinkedIn job posting scraper
 * Extracts job data from LinkedIn job pages
 * Note: Job description formatting is preserved for Notion rich text field
 */

function scrapeLinkedInJob() {
  const result = {
    position: null,
    company: null,
    posting_url: window.location.href,
    origin: 'LinkedIn',
    job_description: null
  };
  
  // Extract job title
  // Primary selector: h1 with job title class
  const titleElement = document.querySelector('h1.top-card-layout__title') ||
                       document.querySelector('[data-job-title]') ||
                       document.querySelector('h1.jobs-unified-top-card__job-title');
  
  if (titleElement) {
    result.position = titleElement.textContent.trim();
  }
  
  // Extract company name
  // Primary selector: company link in top card
  const companyElement = document.querySelector('a.topcard__org-name-link') ||
                        document.querySelector('.topcard__flavor--black-link') ||
                        document.querySelector('a.jobs-unified-top-card__company-name');
  
  if (companyElement) {
    result.company = companyElement.textContent.trim();
  }
  
  // Extract job description
  // Preserve formatting by using innerHTML to keep structure
  const descriptionElement = document.querySelector('.jobs-description__content') ||
                            document.querySelector('.jobs-box__html-content') ||
                            document.querySelector('[class*="description"]');
  
  if (descriptionElement) {
    // Get text content (formatting will be handled by Notion API)
    // Preserve line breaks and basic structure
    result.job_description = descriptionElement.innerText || descriptionElement.textContent;
  }
  
  return result;
}

// Execute scraping and return result
scrapeLinkedInJob();
```

#### File: `chrome-extension/popup/popup.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Job Posting Collector</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>Save Job to Notion</h1>
    
    <div id="status" class="status">Review and save job posting</div>
    
    <form id="job-form">
      <!-- Required Fields -->
      <div class="form-group">
        <label for="position">Position <span class="required">*</span></label>
        <input type="text" id="position" name="position" required maxlength="500" />
      </div>
      
      <div class="form-group">
        <label for="company">Company <span class="required">*</span></label>
        <input type="text" id="company" name="company" required maxlength="200" />
      </div>
      
      <div class="form-group">
        <label for="posting_url">Posting URL <span class="required">*</span></label>
        <input type="url" id="posting_url" name="posting_url" required readonly />
      </div>
      
      <!-- Optional Fields -->
      <div class="form-group">
        <label for="match">Match Level</label>
        <select id="match" name="match">
          <option value="">-- Select --</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="work_arrangement">Work Arrangement</label>
        <select id="work_arrangement" name="work_arrangement">
          <option value="">-- Select --</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="on-site">On-site</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="demand">Company Size</label>
        <select id="demand" name="demand">
          <option value="">-- Select --</option>
          <option value="0-50">0-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value="500+">500+ employees</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="budget">Budget/Salary</label>
        <input type="number" id="budget" name="budget" min="0" step="1000" />
      </div>
      
      <div class="form-group">
        <label for="city">City</label>
        <input type="text" id="city" name="city" maxlength="200" />
      </div>
      
      <div class="form-group">
        <label for="country">Country</label>
        <input type="text" id="country" name="country" maxlength="200" />
      </div>
      
      <button type="submit" id="save-btn" class="save-btn">Save to Notion</button>
    </form>
    
    <div id="error" class="error" style="display: none;"></div>
    <div id="success" class="success" style="display: none;"></div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

#### File: `chrome-extension/popup/popup.css`
```css
body {
  width: 450px;
  max-height: 500px;
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-y: auto;
}

.container {
  padding: 16px;
}

h1 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #333;
}

.status {
  font-size: 13px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
  color: #666;
}

.status.loading {
  background: #fff3cd;
  color: #856404;
}

.status.success {
  background: #d4edda;
  color: #155724;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.form-group label .required {
  color: #dc3545;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group input[type="url"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
}

.form-group input[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 8px;
}

.save-btn:hover {
  background: #0052a3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 13px;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 13px;
}
```

#### File: `chrome-extension/popup/popup.js`
```javascript
#### File: `chrome-extension/popup/popup.js`
```javascript
const BACKEND_URL = 'http://localhost:5000';

const statusEl = document.getElementById('status');
const formEl = document.getElementById('job-form');
const saveBtn = document.getElementById('save-btn');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// Form field elements
const fields = {
  position: document.getElementById('position'),
  company: document.getElementById('company'),
  posting_url: document.getElementById('posting_url'),
  match: document.getElementById('match'),
  work_arrangement: document.getElementById('work_arrangement'),
  demand: document.getElementById('demand'),
  budget: document.getElementById('budget'),
  city: document.getElementById('city'),
  country: document.getElementById('country')
};

// Hidden field: job_description is extracted but not displayed in UI
let extractedJobDescription = null;

// Update status message
function setStatus(message, type = 'normal') {
  statusEl.textContent = message;
  statusEl.className = 'status';
  if (type === 'loading') statusEl.classList.add('loading');
  if (type === 'success') statusEl.classList.add('success');
}

// Show error message
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  successEl.style.display = 'none';
}

// Show success message
function showSuccess(message) {
  successEl.textContent = message;
  successEl.style.display = 'block';
  errorEl.style.display = 'none';
}

// Hide messages
function hideMessages() {
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
}

// Check if current tab is a LinkedIn job page
async function isLinkedInJobPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url && (
    tab.url.includes('linkedin.com/jobs/view') ||
    tab.url.includes('linkedin.com/jobs/collections')
  );
}

// Scrape job data from current LinkedIn page
async function scrapeJobData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/content_script.js']
  });
  
  if (results && results[0] && results[0].result) {
    return results[0].result;
  }
  
  throw new Error('Failed to scrape job data');
}

// Pre-fill form with scraped data
function prefillForm(jobData) {
  if (jobData.position) fields.position.value = jobData.position;
  if (jobData.company) fields.company.value = jobData.company;
  if (jobData.posting_url) fields.posting_url.value = jobData.posting_url;
  if (jobData.match) fields.match.value = jobData.match;
  if (jobData.work_arrangement) fields.work_arrangement.value = jobData.work_arrangement;
  if (jobData.demand) fields.demand.value = jobData.demand;
  if (jobData.budget) fields.budget.value = jobData.budget;
  if (jobData.city) fields.city.value = jobData.city;
  if (jobData.country) fields.country.value = jobData.country;
  
  // Store job description (not displayed in UI, but sent to backend)
  if (jobData.job_description) {
    extractedJobDescription = jobData.job_description;
  }
}

// Get form data
function getFormData() {
  const data = {
    position: fields.position.value.trim(),
    company: fields.company.value.trim(),
    posting_url: fields.posting_url.value.trim(),
    origin: 'LinkedIn'
  };
  
  // Add optional visible fields if they have values
  if (fields.match.value) data.match = fields.match.value;
  if (fields.work_arrangement.value) data.work_arrangement = fields.work_arrangement.value;
  if (fields.demand.value) data.demand = fields.demand.value;
  if (fields.budget.value) data.budget = parseFloat(fields.budget.value);
  if (fields.city.value.trim()) data.city = fields.city.value.trim();
  if (fields.country.value.trim()) data.country = fields.country.value.trim();
  
  // Add job description (extracted, not displayed in UI)
  // Formatting is preserved as extracted from LinkedIn
  if (extractedJobDescription) {
    data.job_description = extractedJobDescription;
  }
  
  return data;
}

// Save job to Notion via Flask backend
async function saveJobToNotion(jobData) {
  const response = await fetch(`${BACKEND_URL}/api/job-postings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jobData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save job');
  }
  
  return data;
}

// Handle form submission
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  saveBtn.disabled = true;
  setStatus('Saving to Notion...', 'loading');
  
  try {
    const jobData = getFormData();
    const result = await saveJobToNotion(jobData);
    
    setStatus('Saved successfully!', 'success');
    showSuccess(`Job saved to Notion! View: ${result.notion_page_url}`);
    
    // Optional: Close popup after success
    setTimeout(() => window.close(), 2000);
  } catch (error) {
    console.error('Save error:', error);
    setStatus('Ready to save', 'normal');
    showError(error.message || 'Failed to save job posting');
  } finally {
    saveBtn.disabled = false;
  }
});

// Initialize popup on load
(async () => {
  try {
    const isJobPage = await isLinkedInJobPage();
    
    if (!isJobPage) {
      setStatus('Not a LinkedIn job page');
      formEl.style.display = 'none';
      showError('Please navigate to a LinkedIn job posting to use this extension');
      return;
    }
    
    setStatus('Extracting job data...', 'loading');
    const scrapedData = await scrapeJobData();
    
    prefillForm(scrapedData);
    setStatus('Review and save job posting');
    
  } catch (error) {
    console.error('Initialization error:', error);
    setStatus('Error extracting data');
    showError('Could not extract job data. You can still manually fill the form.');
  }
})();
```

// Main save handler
async function handleSave() {
  hideError();
  saveBtn.disabled = true;
  
  try {
    setStatus('Extracting job data...', 'loading');
    
    const jobData = await scrapeJobData();
    
    if (!jobData.position || !jobData.company) {
      throw new Error('Could not extract job details from page');
    }
    
    setStatus('Saving to Notion...', 'loading');
    
    const result = await saveJobToNotion(jobData);
    
    setStatus('✓ Saved successfully!', 'success');
    previewEl.style.display = 'none';
    
    // Reset after 2 seconds
    setTimeout(() => {
      setStatus('Ready');
      saveBtn.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error saving job:', error);
    setStatus('Error', 'normal');
    showError(error.message);
    saveBtn.disabled = false;
  }
}

// Initialize popup
async function init() {
  const isJobPage = await isLinkedInJobPage();
  
  if (!isJobPage) {
    setStatus('Not on a LinkedIn job page');
    saveBtn.disabled = true;
    return;
  }
  
  try {
    // Preview job data
    const jobData = await scrapeJobData();
    currentJobData = jobData;
    
    if (jobData.position && jobData.company) {
      previewPositionEl.textContent = jobData.position;
      previewCompanyEl.textContent = jobData.company;
      previewEl.style.display = 'block';
      setStatus('Ready to save');
    } else {
      setStatus('Could not detect job details');
      saveBtn.disabled = true;
    }
  } catch (error) {
    console.error('Error initializing:', error);
    setStatus('Error loading job data');
    saveBtn.disabled = true;
  }
}

// Event listeners
saveBtn.addEventListener('click', handleSave);

// Initialize on load
init();
```

---

## Next Steps

This plan is now complete through Phase 1 (Design & Contracts). The next command to run is:

```
/speckit.tasks
```

This will generate the `tasks.md` file with a prioritized, sequenced list of implementation tasks based on the user stories, technical design, and project structure defined in this plan.
