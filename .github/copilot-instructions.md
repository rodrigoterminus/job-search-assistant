# job-search-assistant Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-05

## Active Technologies
- JavaScript ES6+ (Chrome Extension), Python 3.10+ (Flask Backend - unchanged) + Chrome Extension APIs (chrome.storage, chrome.scripting, chrome.tabs), existing Flask backend (002-linkedin-dual-save)
- Chrome's local storage API (chrome.storage.local) for user preferences; Notion API for job data (existing) (002-linkedin-dual-save)

- Python 3.10+ (backend), JavaScript ES6+ (Chrome Extension) + Flask 3.0+, notion-client 2.2+, flask-cors 4.0+, python-dotenv 1.0+ (001-job-posting-collector)

## Project Structure

```text
packages/
  backend/
  chrome-extension/
```

## Commands

cd packages/backend
python -m flask run

## Code Style

Python 3.10+ (backend), JavaScript ES6+ (Chrome Extension): Follow standard conventions
Focus on functionality over test coverage for MVP

## Recent Changes
- 002-linkedin-dual-save: Added JavaScript ES6+ (Chrome Extension), Python 3.10+ (Flask Backend - unchanged) + Chrome Extension APIs (chrome.storage, chrome.scripting, chrome.tabs), existing Flask backend

- 001-job-posting-collector: Added Python 3.10+ (backend), JavaScript ES6+ (Chrome Extension) + Flask 3.0+, notion-client 2.2+, flask-cors 4.0+, python-dotenv 1.0+

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
