# Instagram setup

Instagram is not public. Attention needs a professional account (Business or Creator) and a long-lived access token from a Meta app that you own.

The default setup is **Instagram API with Instagram Login** (`graph.instagram.com`). That is what `"graph": "instagram"` uses, and you can omit `graph` and `userId`.

## What you need

| Field | Required | Example |
| --- | --- | --- |
| `id` | yes | `personal-ig` |
| `platform` | yes | `instagram` |
| `handle` | yes | `yourhandle` |
| `accessToken` | yes | long-lived token |
| `graph` | no | `instagram` (default) or `facebook` |
| `userId` | only if `graph` is `facebook` | IG professional account id |

`handle` is your username without `@`. `id` is a local SQLite key; keep it stable if the username later changes.

Do not commit `accounts.json`. Tokens belong only in that gitignored file.

## 1. Convert the Instagram account

1. Open Instagram (app or [instagram.com](https://www.instagram.com)).
2. Switch the account to **Professional**: Business or Creator.
3. Confirm you can open professional dashboard / insights for the account.

Personal accounts cannot be queried by this API.

## 2. Create a Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/apps/).
2. Create an app. A **Business** type app is the usual choice.
3. Add the **Instagram** product.
4. Choose **Instagram API with Instagram Login** (Business Login for Instagram).
5. In Business Login settings, set:
   - Valid OAuth redirect URI (for local testing, `https://localhost/` is enough to complete the browser redirect)
   - Deauthorize callback URL
   - Data deletion request URL
6. Copy the app **Instagram App ID** and **App Secret** from the app dashboard. Keep the secret off disk that is checked in.

Add your Instagram account as a tester / admin of the app while it is in development, so you can generate tokens for accounts you manage.

## 3. Request the right permissions

Attention needs:

- `instagram_business_basic` — profile, media, likes, comments
- `instagram_business_manage_insights` — views and other insights

Without insights permission, likes and comments may still work; views often come back empty.

## 4. Get a short-lived token

Open this URL in a browser (replace the placeholders). After you approve, Instagram redirects to your redirect URI with `?code=...`.

```text
https://www.instagram.com/oauth/authorize
  ?client_id=YOUR_INSTAGRAM_APP_ID
  &redirect_uri=https://localhost/
  &response_type=code
  &scope=instagram_business_basic,instagram_business_manage_insights
```

Copy the `code` query parameter. It expires quickly. Strip any `#_` suffix if Instagram appends one.

Exchange the code for a short-lived token (about 1 hour):

```bash
curl -sS -X POST "https://api.instagram.com/oauth/access_token" \
  -F "client_id=YOUR_INSTAGRAM_APP_ID" \
  -F "client_secret=YOUR_APP_SECRET" \
  -F "grant_type=authorization_code" \
  -F "redirect_uri=https://localhost/" \
  -F "code=CODE_FROM_REDIRECT"
```

The JSON includes `access_token` and a user id.

Some app dashboards can also generate a token under Instagram → API setup → **Generate access tokens**. That still must be exchanged for a long-lived token if it is short-lived.

## 5. Exchange it for a long-lived token

Short-lived tokens expire in about an hour. Exchange immediately:

```bash
curl -sS "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=SHORT_LIVED_TOKEN"
```

The response `access_token` lasts about **60 days**. Put that value in `accounts.json`.

Refresh it before it expires (token must be at least 24 hours old and not yet expired):

```bash
curl -sS "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=LONG_LIVED_TOKEN"
```

Replace `accessToken` in `accounts.json` with the new value. If it expires, go through the authorize flow again.

## 6. Confirm the token works

```bash
curl -sS "https://graph.instagram.com/v23.0/me?fields=id,user_id,username,followers_count&access_token=LONG_LIVED_TOKEN"
```

You should see your username and follower count. Attention uses this same `/me` call when `userId` is omitted.

Optional: list recent media:

```bash
curl -sS "https://graph.instagram.com/v23.0/me/media?fields=id,caption,timestamp,permalink,like_count,comments_count&access_token=LONG_LIVED_TOKEN"
```

## 7. Add it to `accounts.json`

```json
{
  "id": "personal-ig",
  "platform": "instagram",
  "handle": "yourhandle",
  "accessToken": "LONG_LIVED_ACCESS_TOKEN"
}
```

Then run `npm run sync`.

Stories are skipped. Feed posts and Reels from the last `recentDays` days are stored.

## Facebook Login (optional)

Use this only if the token comes from **Facebook Login for Business** / a Page-backed Instagram account. That token talks to `graph.facebook.com`, not `graph.instagram.com`.

1. Link the Instagram professional account to a Facebook Page.
2. In [Graph API Explorer](https://developers.facebook.com/tools/explorer/), select your app and generate a user token with:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_read_engagement`
   - `pages_show_list`
3. Find the IG professional account id:

```bash
curl -sS "https://graph.facebook.com/v23.0/me/accounts?fields=id,name,instagram_business_account&access_token=FACEBOOK_USER_TOKEN"
```

The `instagram_business_account.id` value is `userId`. Exchange the short-lived Facebook user token for a long-lived one with your app id and secret ([Facebook long-lived tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)).

```json
{
  "id": "personal-ig",
  "platform": "instagram",
  "handle": "yourhandle",
  "graph": "facebook",
  "userId": "17841400000000000",
  "accessToken": "LONG_LIVED_FACEBOOK_USER_TOKEN"
}
```

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

- [Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [Long-lived access tokens](https://developers.facebook.com/docs/instagram-platform/reference/access_token/)
- [Refresh access tokens](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/)
- [Instagram media](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/)
