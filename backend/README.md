# Findit Backend (FastAPI)

This is the Python/FastAPI backend for the Findit project.

## Prerequisites

- Python 3.8+
- MySQL Server

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Configuration:**
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env  # On Windows: copy .env.example .env
        ```
    - Update `.env` with your MySQL credentials, JWT secret, and Google Client ID.

5.  **Database Setup:**
    - Ensure your MySQL server is running.
    - Create the database named `findit` (or whatever you set in `.env`).
    - Run the schema script to create the table:
        ```bash
        # You can use a tool like MySQL Workbench or command line
        mysql -u root -p findit < schema.sql
        ```

## Running the Server

Run the server with hot reload enabled:

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`.

## Endpoints (summary)

-   **Auth:** `POST /auth/login`, `POST /auth/signup`, `POST /auth/google`, `POST /auth/forgot-password`, `POST /auth/reset-password`
-   **User:** `GET /users/me`, `GET /users/me/stats`, `DELETE /users/me`, `GET /users/me/items`, `GET /users/me/claims`
-   **Items:** `GET /items`, `GET /items/{id}`, `POST /items`, etc.
-   **Claims / conversations:** `POST /claims`, `GET /conversations`, `GET /conversations/{id}/messages`, `POST /messages`, handover and verification endpoints
-   **Health:** `GET /`

## Deployment

1. **Environment:** Copy `.env.example` to `.env` and set all variables. Use a strong `SECRET_KEY` and never commit `.env`.
2. **Database:** Run migrations in order: `schema.sql`, then `create_conversations_table.sql`, then `add_handover_codes.sql` (and any other migration scripts in this folder). Ensure `reset_code` columns exist (main.py runs a startup migration for them).
3. **CORS:** Set `ALLOWED_ORIGINS` to your frontend URL(s), e.g. `https://your-app.vercel.app`.
4. **Run:** For production, run without `--reload`: `uvicorn main:app --host 0.0.0.0 --port 8000`.
5. **Frontend:** Set `NEXT_PUBLIC_API_URL` to your backend URL in production (or rely on same-host detection if frontend and API share a domain).
