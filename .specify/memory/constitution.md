<!--
Sync Impact Report:
- Version change: NONE → 1.0.0
- Initial constitution creation
- Principles defined: 9 core architectural and technical mandates
- Sections added: Core Principles (9 principles), Technology Stack Mandates, Architecture & Deployment Constraints, Governance
- Templates requiring updates:
  ✅ plan-template.md - reviewed, references generic constitution principles
  ✅ spec-template.md - reviewed, no constitution-specific references to update
  ✅ tasks-template.md - reviewed, no constitution-specific references to update
  ⚠ checklist-template.md - not yet reviewed
  ⚠ agent-file-template.md - not yet reviewed
- Follow-up TODOs: None - all placeholders filled
-->

# Job Search Assistant Constitution

## Core Principles

### I. Project Identity & Single-User Focus

This project is a personal automation tool for a single user (the developer). Its primary goal is to streamline the job application process by connecting browser activity, a Notion database, and document generation.

**MUST**: All design and engineering decisions MUST prioritize simplicity and maintainability for a single technical user.

**MUST NOT**: Features like multi-user support, complex multi-tenant UI, or web-based public deployment are explicitly out of scope and MUST NOT be implemented.

**Rationale**: Single-user scope eliminates authentication complexity, scaling concerns, and UI/UX requirements for non-technical users, enabling rapid development and maintenance.

### II. Local-First Architecture (NON-NEGOTIABLE)

The system MUST operate on a local-first architecture. The backend logic MUST run on the user's local machine.

**MUST NOT**: No cloud deployment of the backend server is permitted. The backend MUST NOT be deployed to cloud hosting platforms (AWS, GCP, Azure, Heroku, etc.).

**Rationale**: Local execution ensures full control over data, eliminates hosting costs, removes deployment complexity, and guarantees the tool works offline or in restricted network environments.

### III. Backend Technology Mandate

The backend server MUST be built using Python and the Flask web framework.

**MUST**: All server-side logic, API orchestration, and data processing MUST be implemented in Python.

**MUST**: Flask MUST be used as the web framework for HTTP endpoints and request handling.

**Rationale**: Python provides rich ecosystem support for API integrations (Notion, Google, LLM providers) and Flask offers lightweight, simple HTTP routing suitable for local-only deployment.

### IV. Frontend Technology Mandate

The browser-based user interface MUST be implemented as a Chrome Extension.

**MUST**: All user-facing interactions MUST be delivered through a Chrome Extension architecture.

**MUST NOT**: Web-based standalone applications or other browser extension platforms (Firefox, Safari) are out of scope.

**Rationale**: Chrome Extensions provide direct access to browser context (current page, URL, form data), enable seamless workflow integration, and eliminate need for separate application windows.

### V. Component Communication Principle

The Chrome Extension MUST communicate only with the local Flask server. All orchestration, data processing, and external API calls MUST be handled exclusively by the Flask backend.

**MUST**: The Chrome Extension MUST act as a thin client, sending user actions and rendering responses.

**MUST**: The Flask backend MUST handle all business logic, API orchestration, and data transformations.

**MUST NOT**: The Chrome Extension MUST NOT directly call external APIs (Notion, Google, LLM providers).

**Rationale**: Centralized backend logic simplifies credential management, enables easier testing and debugging, and keeps the extension codebase minimal and maintainable.

### VI. Primary Datastore Mandate

The Notion API MUST be used as the sole persistent datastore for all job application data.

**MUST**: All job application records, metadata, and state MUST be stored in Notion via the Notion API.

**MUST NOT**: No local databases (SQLite, PostgreSQL, etc.) or file-based storage systems (JSON files, CSV) are permitted for application data persistence.

**Rationale**: Notion provides rich structured data capabilities, cross-device accessibility, and manual editing flexibility without requiring database setup or maintenance.

### VII. Document Management Mandate

The Google Drive and Google Docs APIs MUST be used for all document templating, creation, and management tasks.

**MUST**: All cover letter documents MUST be created and stored using Google Docs API.

**MUST**: Google Drive API MUST be used for organizing and managing generated documents.

**MUST NOT**: Local document generation (Word files, PDF generation) or other cloud document services (Dropbox Paper, Office 365) are not permitted.

**Rationale**: Google Docs provides collaborative editing, version history, cloud accessibility, and established template/formatting capabilities without local file management overhead.

### VIII. Content Generation Mandate

An external LLM API (e.g., OpenAI, Gemini, Anthropic) MUST be used for all generative text, specifically the creation of cover letter content.

**MUST**: All AI-generated content (cover letters, application customizations) MUST use an external LLM API.

**MUST**: The system MUST support configurable LLM providers to allow switching between OpenAI, Gemini, Anthropic, or similar services.

**MUST NOT**: Local LLM inference, rule-based text generation, or template-only approaches are insufficient for content generation requirements.

**Rationale**: External LLM APIs provide state-of-the-art language generation quality, eliminate local model hosting complexity, and enable rapid iteration on prompt engineering.

### IX. Security & Authentication Principle

All external API credentials (Notion, Google, LLM) MUST be handled securely. Authentication with the Google APIs MUST be implemented using a local OAuth 2.0 flow.

**MUST**: API credentials MUST be stored securely (encrypted configuration, system keychain, or secure environment variables).

**MUST**: Google API authentication MUST use OAuth 2.0 with local authorization code flow.

**MUST**: The Flask backend MUST serve as the OAuth callback endpoint during Google authentication.

**MUST NOT**: API keys MUST NOT be hardcoded in source code or committed to version control.

**MUST NOT**: Third-party authentication services (Auth0, Firebase Auth) are out of scope for this single-user tool.

**Rationale**: OAuth 2.0 provides secure, user-controlled authorization for Google services. Local credential storage protects sensitive API keys without requiring external secret management infrastructure.

## Technology Stack Mandates

### Required Stack

- **Backend**: Python 3.10+ with Flask web framework
- **Frontend**: Chrome Extension (Manifest V3)
- **Datastores**: Notion API (application data), Google Drive/Docs APIs (document management)
- **AI Services**: External LLM API (OpenAI, Gemini, Anthropic, or equivalent)
- **Authentication**: OAuth 2.0 for Google APIs, API keys for Notion and LLM services

### Prohibited Technologies

- Cloud hosting platforms for backend deployment
- Alternative databases (SQL, NoSQL) for application data
- Non-Google document management services
- Local LLM inference or rule-based text generation
- Multi-user authentication frameworks

## Architecture & Deployment Constraints

### Deployment Model

- **Backend**: Local execution only (development server or local production server)
- **Frontend**: Installed Chrome Extension (unpacked development mode or packaged .crx)
- **Communication**: Chrome Extension ↔ Flask backend via HTTP (localhost)

### Data Flow Requirements

1. User interacts with Chrome Extension UI
2. Extension sends HTTP requests to Flask backend (localhost)
3. Flask backend orchestrates external API calls (Notion, Google, LLM)
4. Flask backend processes responses and returns to Extension
5. Extension renders results to user

### Security Boundaries

- Chrome Extension: Untrusted browser context → minimal logic, no secrets
- Flask Backend: Trusted local environment → holds credentials, orchestrates APIs
- External APIs: Authenticated via backend only, never directly from extension

## Governance

### Constitutional Authority

This constitution supersedes all other development practices, coding conventions, and architectural decisions. Any feature, implementation approach, or technical decision that conflicts with these principles MUST be rejected or the constitution MUST be amended first.

### Amendment Process

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Evaluate consistency with project goals and existing principles
3. **Migration Plan**: Define how existing code/features will adapt to amended principles
4. **Version Bump**: Apply semantic versioning rules (MAJOR/MINOR/PATCH)
5. **Update**: Amend constitution, update dependent templates/docs, commit changes

### Compliance Verification

- All feature specifications MUST include a "Constitution Check" section referencing relevant principles
- Implementation plans MUST validate compliance with architectural and technology mandates
- Code reviews MUST verify adherence to component communication and datastore principles

### Versioning Policy

- **MAJOR** (X.0.0): Removal or fundamental redefinition of core principles (e.g., allowing cloud deployment, changing primary datastore)
- **MINOR** (0.X.0): Addition of new principles or significant expansion of existing guidance
- **PATCH** (0.0.X): Clarifications, wording improvements, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2025-11-05 | **Last Amended**: 2025-11-05
