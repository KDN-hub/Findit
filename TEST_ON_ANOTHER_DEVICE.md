# Testing Findit on Another Person’s Device

Use this when you want someone else (or your phone) to try the app while it’s running on your computer — e.g. same Wi‑Fi at home or on campus.

---

## 1. Same network

- Your PC (where the app runs) and the other device (phone/laptop) must be on the **same Wi‑Fi** (or same LAN).
- If the other person is in a different place, use [Deploy](#optional-deploy-online) instead.

---

## 2. On your computer (host)

### 2.1 Get your IP address

- **Windows:** Open Command Prompt or PowerShell, run:
  ```bash
  ipconfig
  ```
  Find **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.1.5` or `10.0.0.4`). That’s **YOUR_IP**.
- **Mac/Linux:** In Terminal run:
  ```bash
  ifconfig
  ```
  or `ip addr` and look for your LAN IP (often `192.168.x.x` or `10.x.x.x`).

### 2.2 Start the app for network access

From the project folder run:

```bash
npm run dev:mobile:all
```

This starts:

- Frontend at `http://localhost:3000` and **http://YOUR_IP:3000**
- Backend at `http://localhost:8000` and **http://YOUR_IP:8000**

Leave this terminal open.

### 2.3 Allow through Windows Firewall (if needed)

If the other device can’t open the link:

1. Open **Windows Defender Firewall** → **Advanced settings**.
2. **Inbound Rules** → **New Rule** → **Port** → **TCP**.
3. Ports: **3000** and **8000**.
4. Allow the connection, apply to your current network (Private).
5. Try again from the other device.

---

## 3. On the other person’s device

1. Connect to the **same Wi‑Fi** as your computer.
2. Open a browser (Chrome, Safari, etc.).
3. Go to: **http://YOUR_IP:3000**  
   Example: `http://192.168.1.5:3000`.
4. Use the app as normal (sign up, login, report item, etc.).

The app is already set up so that when they use `http://YOUR_IP:3000`, it will call the API at `http://YOUR_IP:8000` automatically — no extra config on their side.

---

## 4. Quick checklist

| Step | Who | Action |
|------|-----|--------|
| 1 | You | Note your PC’s IP (e.g. `ipconfig` → IPv4). |
| 2 | You | Run `npm run dev:mobile:all` in the project folder. |
| 3 | You | If needed, allow ports 3000 and 8000 in Windows Firewall. |
| 4 | Other person | Same Wi‑Fi, open **http://YOUR_IP:3000** in the browser. |

---

## 5. Troubleshooting

- **“Can’t reach this page” / connection refused**  
  - Check same Wi‑Fi.  
  - Confirm YOUR_IP is correct.  
  - Try pinging YOUR_IP from the other device.  
  - Add Firewall rules for 3000 and 8000 (see 2.3).

- **API errors / login doesn’t work**  
  - The frontend uses the same hostname as the page and port 8000, so if they opened `http://YOUR_IP:3000`, the API should be `http://YOUR_IP:8000`.  
  - Ensure the backend is running (you should see “Uvicorn running” in the terminal).

- **Google Sign-In on another device**  
  - If you use Google OAuth, your **Authorized redirect URIs** in Google Cloud Console may need to include `http://YOUR_IP:3000` (or you test with email login only when using IP).

---

## Optional: Deploy online

If the other person is not on the same network:

- Deploy the **frontend** (e.g. Vercel) and **backend** (e.g. Railway, Render, or a VPS).
- Set the production API URL in the frontend (e.g. `NEXT_PUBLIC_API_URL`).
- Share the deployed app URL (e.g. `https://findit.vercel.app`) so they can open it from anywhere.

For same‑network testing, the steps above are enough.
