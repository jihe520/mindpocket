# X Tweet Capture Design

## Goal

Reduce noise in X/Twitter extension ingest by saving the clicked tweet instead of the entire page DOM.

## Approach

The browser extension will treat the clicked native X bookmark button as the anchor for extraction. On click, the content script will:

- locate the nearest tweet container with `article[data-testid="tweet"]`
- extract a canonical tweet permalink from the tweet header time link
- clone the tweet node and serialize only that tweet HTML
- remove the injected MindPocket host from the cloned node before upload

If the tweet node or permalink cannot be found, the extension will fall back to the previous whole-page capture flow.

## Data Flow

1. The content script injects a MindPocket button next to each native bookmark button.
2. Clicking the MindPocket button builds a save payload from the related tweet node.
3. The content script sends `{ url, html, title }` to the background script.
4. The background script forwards the payload to `/api/ingest`.
5. If the payload is missing, the background script falls back to requesting full page content from the content script.

## Error Handling

- Missing tweet node: use current page URL and full page HTML.
- Missing canonical tweet URL: use `window.location.href`.
- Missing payload in the background script: request page content with the old message path.

## Validation

- Run the extension TypeScript compile check.
- Manually verify that timeline tweet saves now send a `/status/...` URL rather than `https://x.com/home`.
