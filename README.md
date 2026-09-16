# Attention

Track likes, views, comments, and reposts for social media posts, plus follower counts per account. A CLI job pulls recent data and stores it in SQLite.

Supported platforms: Bluesky and Instagram. Bluesky views are stored as `null` because that API does not expose view counts. Instagram maps shares/reposts onto the `reposts` field; quotes are `null`.

## Setup

```bash
npm install
cp accounts.example.json accounts.json
```

Edit `accounts.json` with your accounts. That file is gitignored.

How to fill in each platform:

- [Bluesky](docs/bluesky.md) — public handle only
- [Instagram](docs/instagram.md) — professional account and long-lived access token

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
      "accessToken": "LONG_LIVED_ACCESS_TOKEN"
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
