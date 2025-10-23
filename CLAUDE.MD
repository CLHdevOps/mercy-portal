# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a 2-page password-gated internal demo site for Mercy House that consists of:
- **Home page** (`index.html`): Landing page with two embedded videos showcasing vehicle donation and rehab programs
- **Portal page** (`portal.html`): Internal portal with Agent Assistant UI and links to HR/company documents

## Running the Demo

Serve locally with any static file server:
```bash
python3 -m http.server 8080
# Then navigate to http://localhost:8080
```

Open `index.html` directly in a browser (file:// protocol works for this demo).

## Architecture

### Authentication System
- **Client-side only** (demo-only implementation)
- Password: `mercyhouse2025!` (hardcoded in `assets/app.js:3` as `DEMO_PASSWORD`)
- Auth state stored in `localStorage` with key `mh_authed`
- `MH.requireAuth()` function creates modal overlay if not authenticated
- For production: Replace with SSO or server-side authentication

### Agent Assistant
- **Dual-mode support**: Client-side keyword search OR live Azure AI agent
- Toggle mode via `USE_LIVE_AGENT` flag in `assets/app.js:35`
  - `false` (default): Client-side keyword retrieval over `docs/index.json`
  - `true`: Live queries to Azure AI agent via Flask API

#### Client-Side Mode (Default)
- Document index: `docs/index.json` (JSON array with title, file, summary, keywords)
- Search algorithm in `assets/app.js:73-101`:
  - Naive keyword scoring: counts term matches in title/summary/keywords
  - Returns top 3 results sorted by score
  - Includes templated responses for specific topics (AI implementation, HR policy, pricing)

#### Live Agent Mode
- **Backend**: Flask API in `mercy-ai-agent.py` (runs on port 5000)
- **Azure Endpoint**: `https://devopsaifoundry.services.ai.azure.com/api/projects/devopsaifoundry-project`
- **Agent ID**: `asst_BWQLf9pcF6RX83wc2vVNXImu`
- **API Route**: `POST /api/ask` with JSON body `{ "prompt": "user question" }`
- Returns: `{ "answer": "agent response", "sources": [...] }`

**To enable live agent:**
1. Set `USE_LIVE_AGENT = true` in `assets/app.js:35`
2. Start Flask backend: `python mercy-ai-agent.py` (requires Azure credentials)
3. Ensure CORS is configured for your frontend domain

### Document Management
- PDFs/DOCX stored in `docs/` directory
- Indexed by `docs/index.json` with structure:
  ```json
  {
    "title": "Document Title",
    "file": "filename.pdf",
    "summary": "Brief description",
    "keywords": ["keyword1", "keyword2"]
  }
  ```
- When adding new documents: Update `docs/index.json` to make them searchable by the Agent Assistant

### Video Streaming
- Current: Static MP4s in `/videos` directory embedded directly
- Videos: `sora-demo.mp4`, `rehab-demo.mp4`
- For secured streaming:
  - Deploy key-auth services (`rehab-video-key-auth.py`, `sacred-grove-video-key-auth.py` mentioned in README but not in repo)
  - Update `<source src="...">` to hit `/api/video/rehab` or similar endpoints

### Styling
- Uses Tailwind CSS via CDN: `https://cdn.tailwindcss.com`
- Custom styles in `assets/styles.css` (minimal):
  - `.video-card`: Rounded cards with shadows for video containers
  - `.glass`: Glassmorphism effect for auth modal

### JavaScript Architecture
Global namespace: `window.MH` object exposes:
- `MH.requireAuth()`: Triggers authentication modal if not logged in
- `MH.askAssistant(prompt)`: Executes document search and displays results

## File Structure
```
├── index.html          # Home page with video demos
├── portal.html         # Internal portal with assistant + doc links
├── assets/
│   ├── app.js         # Authentication + Agent Assistant logic
│   └── styles.css     # Minimal custom CSS
├── docs/
│   ├── index.json     # Document index for search
│   └── *.pdf/*.docx   # Company/HR documents
├── images/
│   └── mercy-house-logo.png
└── videos/
    ├── sora-demo.mp4
    └── rehab-demo.mp4
```

## Key Implementation Details

### Adding New Documents
1. Place PDF/DOCX in `docs/` directory
2. Add entry to `docs/index.json`:
   ```json
   {
     "title": "New Document Title",
     "file": "new-document.pdf",
     "summary": "Description for search results",
     "keywords": ["relevant", "search", "terms"]
   }
   ```
3. Update portal.html links if document should appear in sidebar

### Customizing Agent Responses
Templated responses are in `assets/app.js:69-76`. To add new topic-specific answers:
```javascript
if (q.includes("your-keyword")) {
  answer = "Your custom response for this topic";
}
```

### Changing Password
Update `DEMO_PASSWORD` constant in `assets/app.js:3`

### Assistant UI Flow
1. User enters query in `portal.html` input (`#assistant-input`)
2. Click triggers `MH.askAssistant(query)` in `assets/app.js:36`
3. Function displays "Thinking..." message
4. Fetches `docs/index.json` and scores documents
5. Renders result card with answer + top 3 sources in `#assistant-results`
6. Results prepended (newest first) - no automatic clearing
