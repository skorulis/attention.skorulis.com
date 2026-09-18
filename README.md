# Attention

Track likes, views, comments, and reposts for social media posts, plus follower counts per account. A CLI job pulls recent data and stores it in SQLite.

Supported platforms: Bluesky and Instagram. Bluesky views are stored as `null` because that API does not expose view counts.

## Setup

```bash
npm install
cp accounts.example.json accounts.json
```

Edit `accounts.json` with your accounts. That file is gitignored.

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
npm run site:dev  # local Vite server at http://localhost:5173
npm run site      # production build + preview
```

Routes (hash):

- `#/` — accounts with follower sparklines
- `#/account/:id` — follower chart and post list
- `#/post/:id` — engagement series (likes, views, comments, reposts, quotes when present)

### Deploy (GitHub Pages)

Sync stays local. After sync/export, commit `web/public/data/` and push `main`. The [Pages workflow](.github/workflows/pages.yml) builds the Vite site and publishes it to [attention.skorulis.com](https://attention.skorulis.com).

One-time setup:

1. DNS: `CNAME` record `attention` → `skorulis.github.io`
2. Repo **Settings → Pages**: Source = **GitHub Actions**; custom domain = `attention.skorulis.com`; enable HTTPS when available

`accounts.json` and SQLite stay gitignored. Only the exported JSON is public.
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
