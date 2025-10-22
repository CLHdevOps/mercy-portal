
# Mercy House – Internal Demo Site

This is a 2‑page, password-gated internal demo that includes:
- **Home** (`index.html`) with two embedded videos.
- **Portal** (`portal.html`) with a lightweight **Agent Assistant** and links to HR/company docs.

## Password (demo-only)
`mercyhouse2025!` – set in `assets/app.js` (`DEMO_PASSWORD`). Replace with SSO or server-side auth for production.

## Agent Assistant
Client-only keyword retrieval over `docs/index.json`. For a live backend:
- Point the UI to your `mercy-ai-agent.py` service (provide `/api/ask`).
- Replace the client search in `assets/app.js` with a `fetch("/api/ask", { method: "POST", body: JSON.stringify({ prompt }) })`.

## Secured Video Streaming
This demo embeds static MP4s under `/videos`. To enforce key-based access:
- Deploy `rehab-video-key-auth.py` or `sacred-grove-video-key-auth.py` to serve routes like `/api/video/rehab`.
- Update `<source src="...">` URLs to hit those endpoints.

## Included Documents
PDFs/DOCX are in `docs/` and indexed by `docs/index.json`. Replace with actual HR and company files for your pitch.

## Run
Open `index.html` in a browser, or serve locally:
```
python3 -m http.server 8080 -d /path/to/mercyhouse-internal-site
```
