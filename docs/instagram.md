# Instagram setup

Put an Instagram access token in `accounts.json`. Dashboard tokens last about 60 days; generate a new one and update the file when it expires.

## 1. Use a professional account

Switch the Instagram account to **Business** or **Creator**. Personal accounts cannot be queried.

## 2. Create a Meta app

1. Open [Meta for Developers](https://developers.facebook.com/apps/) and create an app.
2. Add the **Instagram** product and choose **API setup with Instagram login** (sometimes labeled **API setup with Instagram business login**).
3. Add this Instagram account as a tester or admin while the app is in development.

## 3. Generate an access token

In the [App Dashboard](https://developers.facebook.com/apps/):

1. Open your app.
2. Left menu: **Instagram** → **API setup with Instagram business login**.
3. Add your Instagram account if it is not listed.
4. Click **Generate token** next to the account, log in to Instagram, and copy the token.

Meta documents this under [Get an access token](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started/).

## 4. Add it to `accounts.json`

```json
{
  "id": "personal-ig",
  "platform": "instagram",
  "handle": "yourhandle",
  "accessToken": "PASTE_TOKEN_HERE"
}
```

`handle` is the username without `@`. `id` is a local key; keep it stable if the username changes. Do not commit `accounts.json`.

## 5. Sync

```bash
npm run sync
```

Stories are skipped. Feed posts and Reels from the last `recentDays` days are stored.

When the token expires (about 60 days), generate a new one and replace `accessToken`.

## Optional fields

| Field | When to set it |
| --- | --- |
| `userId` | Required with `graph: "facebook"`. Optional otherwise; `/me` can resolve it. |
| `graph: "facebook"` | Only for a Facebook Login / Page-backed token (`graph.facebook.com`). |

## What gets stored

| Attention field | Instagram source |
| --- | --- |
| followers | `followers_count` |
| likes | `like_count` |
| comments | `comments_count` |
| views | media `view_count` / `total_views_count`, else insights `views` |
| reposts | `reposts_count`, else `shares_count` / insights shares |
| quotes | always empty |

## Official docs

- [Get started (Instagram login)](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started/)
- [Instagram media](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/)
