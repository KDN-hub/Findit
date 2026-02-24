# Google OAuth – Redirect URIs for Google Cloud Console

This app uses **@react-oauth/google** (Google Identity Services / One Tap), **not** next-auth. There is no app callback route; Google returns the credential to the frontend via a popup, then the frontend sends the token to your backend at `POST /auth/google`.

## What to add in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → open your **OAuth 2.0 Client ID** (Web application).
2. Set the following.

### Authorized JavaScript origins

Add these **exactly** (no trailing slash):

```
http://localhost:3000
https://finditapp-v1.vercel.app
```

### Authorized redirect URIs

For the popup/One Tap flow, use the same origins as redirect URIs:

```
http://localhost:3000
https://finditapp-v1.vercel.app
```

3. Save.

---

## Summary

- **Frontend:** Uses `API_BASE_URL` (from `NEXT_PUBLIC_API_URL`) for `POST /auth/google` — no hardcoded backend URL.
- **Backend:** No redirect/callback route; it only verifies the token. Uses `GOOGLE_CLIENT_ID` from env.
- **You do not need** `https://finditapp-v1.vercel.app/api/auth/callback/google` (that is for next-auth only).
