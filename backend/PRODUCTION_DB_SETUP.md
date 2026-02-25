# Fix: "Table 'defaultdb.users' doesn't exist" (Google sign-in / 500 error)

This error means your **production** backend (e.g. on Render) is connected to a database (often named `defaultdb`) where the tables were never created. The backend uses the same config as the app, so it connects to whatever `DB_NAME` is set in your production environment.

## Fix in 3 steps

### 1. Confirm production database name

In your hosting dashboard (e.g. Render):

- Open the **MySQL (or PostgreSQL) instance** that your backend uses.
- Note the **database name** (often `defaultdb` on Render).
- Note **host**, **user**, **password**, **port**.

Ensure your backend’s **environment variables** on Render match that database:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (e.g. `defaultdb`), `DB_PORT`.

### 2. Run the init script against the production database

You need to run `init_db.py` **once** with those same credentials so it creates the `users` table (and the rest) in that database.

**Option A – From your machine (easiest)**

1. In the `backend` folder, set env vars to your **production** DB (don’t use local MySQL).
2. Run:

   ```bash
   cd backend
   set DB_HOST=your-render-db-host
   set DB_USER=your-render-db-user
   set DB_PASSWORD=your-render-db-password
   set DB_NAME=defaultdb
   set DB_PORT=3306
   python init_db.py
   ```

   On macOS/Linux use `export` instead of `set`. Use the exact `DB_NAME` your host gives (e.g. `defaultdb`).

**Option B – From Render Shell**

If your backend is on Render and you can open a shell:

1. Open your **Backend Service** → **Shell**.
2. Run:

   ```bash
   python init_db.py
   ```

   Render injects your env vars, so this will use the same DB as the running app (e.g. `defaultdb`) and create the tables there.

### 3. Try Google sign-in again

After `init_db.py` finishes without errors, try signing in with Google again. The 500 error and “Table 'defaultdb.users' doesn't exist” should be gone.

---

**Note:** `init_db.py` now uses the same `config` as the app, so it reads `DB_NAME` (and the rest) from the environment. No hardcoded database name.
