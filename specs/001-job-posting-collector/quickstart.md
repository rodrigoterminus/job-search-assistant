# Quickstart Guide: Job Posting Collector

**Feature**: 001-job-posting-collector  
**Created**: 2025-11-05  
**Audience**: Developer (single user)

This guide walks you through setting up and running the Job Posting Collector MVP from scratch.

---

## Prerequisites

### Required Software
- **Python**: 3.10 or higher ([Download](https://www.python.org/downloads/))
- **Chrome Browser**: Latest version ([Download](https://www.google.com/chrome/))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### Required Accounts & API Access
- **Notion Account**: Free or paid plan ([Sign up](https://www.notion.so/signup))
- **Notion API Integration**: Created from [Notion Integrations](https://www.notion.so/my-integrations)
- **LinkedIn Account**: For accessing job postings

---

## Part 1: Notion Setup (5 minutes)

### Step 1: Create Notion Database

1. Open Notion and create a new database (full-page database, not inline)
2. Name it: **Job Applications**
3. Add the following properties (exact names required):

| Property Name | Type | Options (for Select types) |
|---------------|------|----------------------------|
| Position | Title | N/A (default) |
| Company | Rich Text | N/A |
| Posting URL | URL | N/A |
| Origin | Select | LinkedIn |
| Level | Select | Engineer, Senior Engineer, Tech Lead, Architect, Cloud Engineer, Manager, C-Level, VP, Founder |
| Match | Select | low, medium, high |
| Work Arrangement | Select | remote, hybrid, on-site |
| City | Rich Text | N/A |
| Country | Rich Text | N/A |
| Demand | Select | 0-50, 51-200, 201-500, 500+ |
| Budget | Number | N/A |
| Recruiter | Rich Text | N/A |
| Talent Acquisition | Rich Text | N/A |
| Hiring Manager | Rich Text | N/A |
| Job Description | Rich Text | N/A |

**Note**: MVP only populates Position, Company, Posting URL, and Origin. Other fields are for manual entry or future enhancements.

### Step 2: Create Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration**
3. Fill in:
   - **Name**: Job Search Assistant
   - **Associated workspace**: Choose your workspace
   - **Type**: Internal integration
4. Click **Submit**
5. Copy the **Internal Integration Token** (starts with `secret_...`)
6. Keep this token safe - you'll need it in Part 2

### Step 3: Share Database with Integration

1. Open your **Job Applications** database in Notion
2. Click the **•••** menu (top right)
3. Scroll down and click **Add connections**
4. Search for **Job Search Assistant** and select it
5. Click **Confirm**

### Step 4: Get Database ID

1. Open your **Job Applications** database in Notion
2. Copy the URL from your browser address bar
3. The database ID is the 32-character string between the workspace name and the `?v=`:

```
https://www.notion.so/{workspace}/{DATABASE_ID}?v={view_id}
                                  ^^^^^^^^^^^^^^^^
                                  This is your database ID
```

Example:
```
https://www.notion.so/myworkspace/a1b2c3d4e5f67890abcdef1234567890?v=xyz123
                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                  Database ID: a1b2c3d4e5f67890abcdef1234567890
```

**Save this database ID** - you'll need it in Part 2.

---

## Part 2: Backend Setup (10 minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/rodrigoterminus/job-search-assistant.git
cd job-search-assistant
git checkout 001-job-posting-collector
```

### Step 2: Create Virtual Environment

```bash
# Navigate to backend directory
cd packages/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected output**: Flask, notion-client, flask-cors, python-dotenv installed.

### Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
# On macOS:
open .env
# On Linux:
nano .env
# On Windows:
notepad .env
```

Fill in your credentials from Part 1:

```env
# Notion API Configuration
NOTION_API_KEY=secret_YOUR_INTEGRATION_TOKEN_HERE
NOTION_DATABASE_ID=YOUR_DATABASE_ID_HERE

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

**Example**:
```env
NOTION_API_KEY=secret_a1b2c3d4e5f67890abcdef1234567890
NOTION_DATABASE_ID=x9y8z7w6v5u43210zyxwvu9876543210
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

**⚠️ IMPORTANT**: Never commit the `.env` file to Git. It's already in `.gitignore`.

### Step 5: Start Backend Server

```bash
# Make sure you're in packages/backend/ directory with venv activated
python src/app.py
```

**Expected output**:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
 * Notion database validated successfully
```

**If you see errors**:
- `Notion authentication failed`: Check your NOTION_API_KEY in .env
- `Database not found`: Check your NOTION_DATABASE_ID in .env
- `Required properties missing`: Make sure your Notion database has Position, Company, Posting URL, Origin properties

### Step 6: Test Backend (Optional)

Open a new terminal window and test the health endpoint:

```bash
curl http://localhost:5000/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "notion_connected": true,
  "database_validated": true
}
```

**Keep the backend server running** in its terminal window. You'll need it for Part 3.

---

## Part 3: Chrome Extension Setup (5 minutes)

### Step 1: Load Unpacked Extension

1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Navigate to and select the `packages/chrome-extension/` folder in your project
6. The extension should appear in your extensions list

**Note**: The extension ID will be auto-generated (e.g., `abcdefghijklmnopqrstuvwxyz123456`). This is expected for unpacked extensions.

### Step 2: Pin Extension to Toolbar (Optional)

1. Click the **Extensions** puzzle icon in Chrome toolbar
2. Find **Job Posting Collector** in the list
3. Click the **pin** icon to keep it visible

### Step 3: Verify Extension Loaded

1. Click the **Job Posting Collector** icon in your Chrome toolbar
2. You should see a popup with:
   - Title: "Job Posting Collector"
   - Button: "Save Job to Notion"
   - Status text: "Ready"

**If you see errors**:
- Extension not loading: Check manifest.json syntax
- Icon not appearing: Clear Chrome cache and reload extension
- Permissions error: Make sure manifest.json has correct permissions

---

## Part 4: Test End-to-End (5 minutes)

### Step 1: Navigate to LinkedIn Job

1. Open LinkedIn in Chrome: [https://www.linkedin.com/jobs/](https://www.linkedin.com/jobs/)
2. Search for any job (e.g., "Software Engineer")
3. Click on a job posting to view the full details
4. Make sure the URL is a LinkedIn job page (e.g., `https://www.linkedin.com/jobs/view/...`, `https://www.linkedin.com/jobs/collections/...`, or `https://www.linkedin.com/jobs/search/...`)

### Step 2: Save Job

1. Click the **Job Posting Collector** extension icon in Chrome toolbar
2. The popup should show:
   - Auto-extracted job title (Position field)
   - Auto-extracted company name (Company field)
   - Auto-extracted optional fields when available:
     - Work Arrangement (remote/hybrid/on-site)
     - Demand (number of applicants)
     - City and Country
   - Form layout with grouped fields:
     - Row 1: Match Level + Work Arrangement
     - Row 2: Demand + Budget/Salary
     - Row 3: City + Country
   - Posting URL is hidden (automatically populated behind the scenes)
3. Click **Save to Notion**
4. Watch the status messages:
   - "Extracting job data..."
   - "Saving to Notion..."
   - "✓ Saved successfully!"

### Step 3: Verify in Notion

1. Open your **Job Applications** database in Notion
2. You should see a new entry with:
   - **Position**: The LinkedIn job title
   - **Company**: The company name
   - **Posting URL**: Clickable link to the LinkedIn posting
   - **Origin**: "LinkedIn"
   - **Work Arrangement**: remote/hybrid/on-site (if detected)
   - **Demand**: Applicant count category (if available)
   - **City**: Job location city (if detected)
   - **Country**: Job location country (if detected)
   - **Job Description**: Full job description text (extracted but not shown in popup)

**🎉 Success!** Your Job Posting Collector is working end-to-end.

---

## Common Issues & Solutions

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`
- **Solution**: Make sure virtual environment is activated and run `pip install -r requirements.txt`

**Problem**: `Notion authentication failed`
- **Solution**: 
  1. Verify NOTION_API_KEY in .env file
  2. Make sure integration token starts with `secret_`
  3. Check that integration has access to the database (Part 1, Step 3)

**Problem**: `Database not found`
- **Solution**:
  1. Verify NOTION_DATABASE_ID in .env file
  2. Make sure you copied the database ID correctly (32 characters, no hyphens)
  3. Ensure the database is shared with your integration

**Problem**: `Port 5000 already in use`
- **Solution**: Change FLASK_PORT in .env to 5001, then update backend URL in extension popup.js

### Extension Issues

**Problem**: Extension popup is blank
- **Solution**:
  1. Right-click extension icon → "Inspect popup"
  2. Check console for JavaScript errors
  3. Verify manifest.json has correct file paths

**Problem**: "Save Job" button is disabled
- **Solution**:
  1. Make sure you're on a LinkedIn job posting page (URL contains `/jobs/view/` or `/jobs/collections/`)
  2. Check content script is injecting (inspect page → Console tab → look for extension logs)

**Problem**: "Backend not reachable" error
- **Solution**:
  1. Verify backend server is running (check terminal)
  2. Test health endpoint: `curl http://localhost:5000/health`
  3. Check CORS configuration in backend

**Problem**: Job title or company not detected
- **Solution**:
  1. LinkedIn may have changed their DOM structure
  2. Current selectors target:
     - Company: `.job-details-jobs-unified-top-card__company-name a`
     - Position: `h1.jobs-unified-top-card__job-title`
     - Work Arrangement: `.job-details-fit-level-preferences`
     - Demand: `.jobs-premium-applicant-insights__list-num`
     - City: `.job-details-jobs-unified-top-card__primary-description-container .tvm__text`
  3. Check browser console for scraping errors
  4. Manually enter the missing data in the extension popup before saving

### Duplicate Job Errors

**Problem**: "Job posting already saved" error
- **Solution**: This is expected behavior to prevent duplicates. The job URL already exists in your Notion database. Check your database to see the existing entry.

---

## Development Workflow

### Making Changes to Backend

1. Edit Python files in `packages/backend/src/`
2. Save changes
3. Restart Flask server (Ctrl+C, then `python src/app.py`)
4. Test changes

**Tip**: Flask auto-reload is enabled in debug mode for most changes.

### Making Changes to Extension

1. Edit files in `packages/chrome-extension/`
2. Save changes
3. Go to `chrome://extensions/`
4. Click the **reload** icon for Job Posting Collector extension
5. Test changes (may need to close/reopen popup or refresh LinkedIn page)

---

## Next Steps

### Extend MVP
- [ ] Improve extraction accuracy for different LinkedIn page layouts
- [ ] Add more robust error handling and user feedback
- [ ] Implement duplicate detection with user choice (update vs. skip)
- [ ] Add keyboard shortcut for quick save
- [ ] Add Match Level auto-detection based on job requirements
- [ ] Add Budget/Salary extraction when available on LinkedIn

### Completed Enhancements
- [x] Extract work arrangement (remote/hybrid/on-site)
- [x] Extract demand (number of applicants)
- [x] Extract city and country from job location
- [x] Compact form layout with grouped fields
- [x] Hidden posting URL field (auto-populated)
- [x] Full job description extraction

### Future Features (Beyond MVP)
- [ ] Cover letter generation (requires Principle VIII compliance)
- [ ] Document management (requires Principle VII compliance)
- [ ] Application status tracking
- [ ] Analytics dashboard

---

## Getting Help

### Check Logs

**Backend logs**:
```bash
# Terminal where Flask is running
# Errors will appear in console output
```

**Extension logs**:
1. Right-click extension icon → "Inspect popup"
2. Open Console tab
3. Look for error messages

**Browser logs** (for content script):
1. Open LinkedIn job page
2. Right-click → "Inspect"
3. Console tab
4. Look for extension-related messages

### Debug Mode

**Enable verbose backend logging**:
Edit `packages/backend/src/app.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Enable verbose extension logging**:
Edit `packages/chrome-extension/popup/popup.js`:
```javascript
const DEBUG = true;  // Set to true for verbose console logs
```

---

## Maintenance

### Updating Dependencies

```bash
cd packages/backend
source venv/bin/activate
pip list --outdated
pip install --upgrade <package-name>
pip freeze > requirements.txt
```

### Backing Up Notion Data

Your job posting data is stored in Notion. Notion provides automatic backups, but you can also export:
1. Open your database
2. Click •••  → Export
3. Choose format (Markdown, CSV, or PDF)

---

## Security Notes

- **Never commit `.env` file** - Contains sensitive API keys
- **Keep Notion integration token private** - Anyone with this token can access your database
- **Extension is local-only** - Backend runs on localhost, not exposed to internet
- **No authentication needed** - Single-user tool, credentials stored in .env

---

## Performance Tips

- **Notion API has rate limits**: ~3 requests per second. The backend implements exponential backoff.
- **Extension content script**: Caches DOM selectors to avoid repeated queries
- **Backend startup**: Validates Notion database schema once at startup, not on every request

---

## Support

For issues specific to this MVP:
1. Check Common Issues section above
2. Review logs (backend + extension console)
3. Verify Notion database schema matches requirements
4. Test with a different LinkedIn job posting (some pages may have unusual formatting)

For Notion API issues:
- [Notion API Documentation](https://developers.notion.com/)
- [Notion API Status](https://status.notion.so/)

For Chrome Extension issues:
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
