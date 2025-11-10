# Share Tea Ordering Kiosk

A React kiosk interface backed by a lightweight Flask API that serves menu data from the CSCE 315 Postgres instance.

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

## Notes

- The kiosk intentionally omits search and image-heavy tiles for a simpler ordering flow.
- If the backend query fails, the UI falls back to a small in-memory sample menu so you can still demo the interface.
