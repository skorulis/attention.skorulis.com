# Bluesky setup

Attention reads public Bluesky profile and post metrics. No app, password, or access token is required.

## What you need

| Field | Required | Example |
| --- | --- | --- |
| `id` | yes | `personal-bsky` |
| `platform` | yes | `bluesky` |
| `handle` | yes | `you.bsky.social` |

`id` is a local key used in SQLite. Keep it stable if the handle later changes.

## Find your handle

1. Open [Bluesky](https://bsky.app) and sign in.
2. Open your profile.
3. The handle is the `@` name under your display name, without the `@`.

Examples:

- Default: `you.bsky.social`
- Custom domain: `you.com`

You can also copy it from the profile URL:

```text
https://bsky.app/profile/you.bsky.social
```

The last path segment is the handle.

## Check that the account is readable

Public profiles can be fetched with no login:

```bash
curl -sS "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=you.bsky.social"
```

A successful response includes `handle`, `did`, and `followersCount`. If this fails, Attention will fail too.

The profile must be publicly visible. Accounts that hide from logged-out users (`!no-unauthenticated`) cannot be synced this way.

## Add it to `accounts.json`

```json
{
  "id": "personal-bsky",
  "platform": "bluesky",
  "handle": "you.bsky.social"
}
```

Add one object per Bluesky account. Then run `npm run sync`.

## What gets stored

| Attention field | Bluesky source |
| --- | --- |
| followers | `followersCount` on the profile |
| likes | `likeCount` |
| comments | `replyCount` |
| reposts | `repostCount` |
| quotes | `quoteCount` |
| views | always empty (Bluesky has no view API) |

Only original posts from the last `recentDays` days are updated. Replies to other people and reposts of other people's posts are skipped.

## Official docs

- [Viewing profiles](https://docs.bsky.app/docs/tutorials/viewing-profiles)
- [Author feeds](https://docs.bsky.app/docs/tutorials/viewing-feeds)
