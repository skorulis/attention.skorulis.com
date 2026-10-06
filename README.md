# Attention

Track likes, views, comments, and reposts for social media posts, plus follower counts per account. A CLI job pulls recent data and stores it in SQLite.

Supported platforms: Bluesky and Instagram. Bluesky views are stored as `null` because that API does not expose view counts.

## Setup

```bash
npm install
cp accounts.example.json accounts.json
```

Edit `accounts.json` with your accounts. That file is gitignored, as is `.env` (API keys for `cards/`).

How to fill in each platform:

- [Bluesky](docs/bluesky.md) — public handle only
- [Instagram](docs/instagram.md) — dashboard access token

```json
{
  "recentDays": 14,
  "accounts": [
    {
      "id": "personal-bsky",
      "platform": "bluesky",
      "handle": "you.bsky.social"
    },
    {
      "id": "personal-ig",
      "platform": "instagram",
      "handle": "yourhandle",
      "accessToken": "INSTAGRAM_ACCESS_TOKEN"
    }
  ]
}
```

`id` is a stable local key. Keep it the same if a handle changes so history stays attached to the account.

## Sync

```bash
npm run sync
```

The job:

1. Reads `accounts.json`
2. Opens `data/attention.sqlite` (created on first run)
3. Fetches follower counts and recent posts for each account
4. Upserts current metrics and writes one snapshot per UTC day (later syncs the same day overwrite)

Only posts from the last `recentDays` days are updated. Older posts keep their last stored values.

After a successful sync, the job also exports chart-ready JSON into `web/public/data/` for the static site.

## Site

A static dashboard charts follower growth per account and engagement over time per post. It reads exported JSON only (no live SQLite).

```bash
npm run export    # refresh JSON from SQLite without syncing
npm run dev       # local Vite server at http://localhost:5173
npm run site      # production build + preview
```

Routes (hash):

- `#/` — accounts with follower sparklines
- `#/account/:id` — follower chart and post list
- `#/post/:id` — engagement series (likes, views, comments, reposts, quotes when present)
- `#/experiments` — list of documented experiments
- `#/experiment/:slug` — comparison page for one experiment
- `#/principles` — the posting rules every post is measured against

### Experiments

Hand-authored JSON under `web/public/data/experiments/` (not written by sync/export). Each experiment compares post arms and shows introduction + results copy.

`web/public/data/experiments/index.json` lists experiments for the index page:

```json
{
  "experiments": [
    { "slug": "instagram-hashtags", "name": "Instagram Hashtags" }
  ]
}
```

Per experiment, `web/public/data/experiments/{slug}.json`:

```json
{
  "name": "Instagram Hashtags",
  "introduction": "…",
  "results": "…",
  "arms": [
    { "label": "With hashtags", "postIds": [9, 10, 15] },
    { "label": "Without hashtags", "postIds": [14] }
  ]
}
```

`postIds` are local post IDs (same as `web/public/data/posts/{id}.json`). The page loads those posts and shows per-arm averages for likes and views.

### Principles

The `#/principles` page lists the hand-authored posting rules in `web/public/data/principles.json` (not written by sync/export). Each rule has a title, one-line summary, a "why" paragraph, tactics, an `imagePrompt` used by the rule-card generator, and an `images` list of published card images shown as thumbnails.

Publishing a card (`npm run cards -- publish <slug> <style>`) copies the PNG to `web/public/principles/<slug>/` and appends `/principles/<slug>/<style>.png` to that rule's `images`.

### Deploy (GitHub Pages)

Sync stays local. After sync/export, commit `web/public/data/` and push `main`. The [Pages workflow](.github/workflows/pages.yml) builds the Vite site and publishes it to [attention.skorulis.com](https://attention.skorulis.com).

One-time setup:

1. DNS: `CNAME` record `attention` → `skorulis.github.io`
2. Repo **Settings → Pages**: Source = **GitHub Actions**; custom domain = `attention.skorulis.com`; enable HTTPS when available

`accounts.json` and SQLite stay gitignored. Only the exported JSON is public.
## Monthly reel

`reel/` turns a month of beers from [bigalbumofbeers.com](https://bigalbumofbeers.com/beers/) into a 1080x1920 Instagram reel (about 30s): a hook montage, stats, a top-5 countdown, the worst beer, the #1 reveal, and a "which would you try?" prompt. It renders silent so you can add trending audio in the Instagram app.

```bash
npm --prefix reel install   # once
npm run reel -- 2026-10     # month defaults to last month
```

This scrapes the month, picks highlights, and writes `reel/out/<month>/`:

- `reel.mp4` — the reel
- `cover.png` — the #1 reveal frame, for the reel cover
- `caption.txt` — a caption with hashtags

The picks go to `reel/months/<month>/story.json` (committed). Edit it to swap beers or reword the hook or quotes, then run `npm --prefix reel run render -- <month>`. Re-running `npm run reel` keeps your edits. Add `--fresh` to re-scrape and regenerate the story.

Other commands (all take an optional month):

- `npm --prefix reel run fetch` — re-scrape beers and photos
- `npm --prefix reel run pick` — build `story.json` (add `--fresh` to overwrite)
- `npm run reel:studio` — live preview in Remotion Studio (defaults to the latest month with a `story.json`). Use the Studio Render button after this; it needs that month loaded.

## Schedule

Run on a timer with cron or launchd. Example crontab (every hour):

```cron
0 * * * * cd /path/to/attention && npm run sync >> /tmp/attention-sync.log 2>&1
```

## Data

SQLite file: `data/attention.sqlite`

- `accounts` — latest follower count per configured account
- `posts` — latest metrics per post
- `post_snapshots` — metric history for charting growth
- `follower_snapshots` — follower history

Static export (written by `npm run export` / end of `npm run sync`):

- `web/public/data/index.json`
- `web/public/data/accounts/{id}.json`
- `web/public/data/posts/{postId}.json`

Hand-authored (not overwritten by export):

- `web/public/data/experiments/index.json`
- `web/public/data/experiments/{slug}.json`
- `web/public/data/principles.json`

## Rule cards

`cards/` turns each principle into a post-ready 1080x1350 image: gpt-image-1 generates a text-free background from the rule's `imagePrompt`, and Remotion overlays the exact rule number, title and summary so the words are always verbatim.

```bash
npm --prefix cards install   # once
cp .env.example .env         # required for `generate` unless --dry
```

Put `OPENAI_API_KEY` in `.env` (gitignored, read by `npm run cards`); a variable exported in your shell takes precedence.

Commands:

- `npm run cards -- generate [slug] [--style <name>|--all-styles] [--fresh] [--dry]` — generate the background (cached at `cards/out/<slug>/<style>.bg.png`; `--fresh` regenerates) and render the card to `cards/out/<slug>/<style>.png`. With no `--style`, each rule gets a different style picked by its position. `--dry` skips OpenAI and renders over a dark placeholder background.
- `npm run cards -- render [slug] [--style <name>|--all-styles]` — re-overlay from cached backgrounds; no API calls.
- `npm run cards -- publish <slug> <style>` — copy a rendered card to `web/public/principles/<slug>/<style>.png` and add it to the rule's `images` in `principles.json`.
- `npm --prefix cards run studio` — Remotion Studio preview.

Styles are named presets in `cards/src/styles.ts` (risograph, flat-vector, bold-collage, editorial-photo, neon-grid, paper-cut, brutalist, watercolor); each sets the background prompt, overlay font and accent colour. Cost: gpt-image-1 at medium quality is a few cents per background; `--all-styles` over 3 rules is 24 calls. `cards/out/` and `cards/public/` are gitignored.
