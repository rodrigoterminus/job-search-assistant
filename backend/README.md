# Job Posting Collector - Backend

Flask backend for the Job Posting Collector Chrome Extension. Handles job posting data validation and saves to Notion database.

## Prerequisites

- Python 3.10 or higher
- Notion account with API integration
- Notion database for job applications

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Notion credentials:

```env
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_JOB_APPLICATIONS_ID=your_job_applications_database_id_here
NOTION_DATABASE_COMPANIES_ID=your_companies_database_id_here
NOTION_DATABASE_PEOPLE_ID=your_people_database_id_here
NOTION_DATABASE_RESOURCES_ID=your_resources_database_id_here
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=3000
```

**Note**: For MVP, only `NOTION_API_KEY` and `NOTION_DATABASE_JOB_APPLICATIONS_ID` are required. The Companies, People, and Resources databases will be used in future features.

See the [quickstart guide](../specs/001-job-posting-collector/quickstart.md) for detailed instructions on obtaining these values.

## Running the Server

### Quick Start (Recommended)

```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python wsgi.py
```

This starts the server on `http://127.0.0.1:3000` with:
- **Hot reload** - Automatically restarts when you save files
- **Debug mode** - Detailed error messages and interactive debugger
- **Port 3000** - As configured in `.env`

### Alternative: Flask CLI

```bash
flask run --debug
```

Both methods work the same - use whichever you prefer!

### VS Code Debugging

**Recommended**: Use the integrated debugger for breakpoints and step-through debugging.

1. Open Run and Debug panel (`⇧⌘D` / `Ctrl+Shift+D`)
2. Select **"Flask: Debug"** configuration
3. Press `F5` or click the green play button
4. Set breakpoints by clicking left of line numbers
5. Make requests to trigger breakpoints

**Features:**
- Full breakpoint support in all Python files
- Variable inspection and watch expressions
- Debug Console for evaluating expressions
- Hot reload enabled - save files to see changes
- Step through code (F10/F11) at breakpoints

## API Endpoints

### POST /api/job-postings

Create a new job posting in Notion database.

**Request body:**
```json
{
  "position": "Senior Software Engineer",
  "company": "Acme Corp",
  "posting_url": "https://www.linkedin.com/jobs/view/1234567890",
  "origin": "LinkedIn",
  "match": "high",
  "work_arrangement": "remote",
  "demand": "201-500",
  "budget": 150000,
  "job_description": "Full job description text...",
  "city": "San Francisco",
  "country": "United States"
}
```

**Response (201):**
```json
{
  "message": "Job posting saved successfully",
  "notion_page_id": "abc-123-def-456",
  "notion_page_url": "https://www.notion.so/abc123def456"
}
```

### GET /health

Check backend and Notion database connectivity.

**Response (200):**
```json
{
  "status": "healthy",
  "notion_connected": true,
  "database_validated": true
}
```

## Troubleshooting

**Configuration error: NOTION_API_KEY environment variable is required**
- Make sure you created `.env` file from `.env.example`
- Verify the file contains your actual Notion API key

**Notion authentication failed**
- Check that your API key is correct
- Verify the integration has access to your databases

**Database not found**
- Verify the NOTION_DATABASE_JOB_APPLICATIONS_ID is correct
- Ensure the Job Applications database is shared with your integration

**Port 3000 already in use**
- Change FLASK_PORT in .env to a different port
- Update the BACKEND_URL in chrome-extension/popup/popup.js

## Development

### Logging

The backend logs all requests, responses, and errors to the console. Debug logging is enabled when `FLASK_DEBUG=True`.

### Testing

Manual testing only for MVP. Use the Chrome extension or cURL to test endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test job posting creation
curl -X POST http://localhost:5000/api/job-postings \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Test Position",
    "company": "Test Company",
    "posting_url": "https://www.linkedin.com/jobs/view/1234567890",
    "origin": "LinkedIn"
  }'
```

## Project Structure

```
backend/
├── src/                       # Main application package
│   ├── __init__.py
│   ├── app.py                # Flask application factory
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py         # API endpoint definitions
│   │   └── validators.py     # Request validation logic
│   ├── services/
│   │   ├── __init__.py
│   │   └── notion_service.py # Notion API integration
│   └── config/
│       ├── __init__.py
│       └── settings.py       # Configuration management
├── wsgi.py                   # Entry point - run this!
├── .env                      # Your configuration (API keys, port)
├── .env.example              # Environment variable template
├── requirements.txt          # Python dependencies
├── .gitignore
└── README.md                 # This file
```

**Key Files:**
- `wsgi.py` - Simple entry point for running locally
- `.env` - Your configuration (API keys, port, debug mode)
- `src/app.py` - Application factory (creates the Flask app)
