# Share Tea Ordering Kiosk

A React kiosk interface backed by a lightweight Flask API that serves menu data from the CSCE 315 Postgres instance.

# IF CANNOT RUN LOCALLY

delete package-lock.json in my-app and node_modules in my-app
then run npm install in my-app (and pray)

DO NOT REMOVE ANYTHING FROM PACKAGE.JSON OR UPGRADE ANYTHING

## Prerequisites

- Node.js 18+ for the Vite frontend
- Python 3.10+ for the Flask backend
- Access to the `gang_63_db` database on `csce-315-db.engr.tamu.edu`

## Environment

1. Update the `.env` file in the project root before running anything:
   ```ini
   DATABASE_NAME=gang_63_db
   DATABASE_USER=gang_63
   DATABASE_HOST=csce-315-db.engr.tamu.edu
   DATABASE_PORT=5432
   DATABASE_SSLMODE=require
   PASSWORD=your_db_password
   PORT=5000
   ```
2. Optional overrides:
   - `MENU_QUERY` — custom SQL if your menu table differs from `menu_items`.
   - `FLASK_DEBUG=1` — enables Flask debug mode locally.

## Backend (Flask)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/app.py
```
The API listens on `http://localhost:5000/api/menu` by default.

## Frontend (React + Vite)

```bash
cd my-app
npm install
npm run dev
```
The Vite dev server automatically proxies `/api/*` calls to the Flask backend.

### Pointing the frontend at the hosted backend

The frontend now targets the live Vercel backend by default (`https://backend-hjud5voor-zaheer-sufis-projects.vercel.app/api`). If you’d like to point the UI elsewhere (for example, to a local Flask server), create `my-app/.env` with:

```
VITE_API_URL=http://localhost:5000
```

Restart `npm run dev` after changing the value.

## Notes

- The kiosk intentionally omits search and image-heavy tiles for a simpler ordering flow.
- If the backend query fails, the UI falls back to a small in-memory sample menu so you can still demo the interface.

## Deploying the backend on Vercel

1. Install the Vercel CLI and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. From the project root, run `vercel link` to bind the local folder to your Vercel project (or `vercel` to create a new one).
3. In the Vercel dashboard, add the required environment variables (`DATABASE_NAME`, `DATABASE_USER`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_SSLMODE`, `PASSWORD`, `PORT`). Keep the same names you use locally so `backend/app.py` can read them via `python-dotenv`.
4. Deploy with `vercel --prod`. Vercel will detect `vercel.json`, install the dependencies listed in `api/requirements.txt`, and expose the Flask app from `backend/app.py` at `/api/*`.

### Local debugging workflow

- Backend only:
  ```bash
  cd backend
  python -m venv .venv
  source .venv/bin/activate  # Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  flask --app app run --port 5000
  ```
- Frontend + backend:
  1. Start the Flask server as above.
  2. In another terminal run:
     ```bash
     cd my-app
     npm install
     npm run dev
     ```
     Vite proxies `/api/*` to `http://localhost:5000`, so you can test the full flow against your local database.

When you need to debug serverless behaviour locally, Vercel CLI can emulate the deployment by running `vercel dev`, which launches the Python function from `api/index.py` alongside the Vite frontend.
