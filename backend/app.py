import os
from contextlib import contextmanager

from dotenv import load_dotenv
from flask import Flask, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor

from flask_cors import CORS

CORS(app)

load_dotenv()

app = Flask(__name__)


def _get_db_settings():
    """Read database settings from the environment with safe defaults."""
    return {
        "name": os.getenv("DATABASE_NAME", "gang_63_db"),
        "user": os.getenv("DATABASE_USER", "gang_63"),
        "password": os.getenv("PASSWORD"),
        "host": os.getenv("DATABASE_HOST", "csce-315-db.engr.tamu.edu"),
        "port": int(os.getenv("DATABASE_PORT", "5432")),
        "sslmode": os.getenv("DATABASE_SSLMODE", "require"),
    }


@contextmanager
def _db_cursor():
    """Yield a psycopg cursor that cleans up after itself."""
    settings = _get_db_settings()
    if not settings["password"]:
        raise RuntimeError("PASSWORD is not configured. Update the .env file before starting the backend.")

    conn = psycopg2.connect(
        dbname=settings["name"],
        user=settings["user"],
        password=settings["password"],
        host=settings["host"],
        port=settings["port"],
        sslmode=settings["sslmode"],
        cursor_factory=RealDictCursor,
    )
    try:
        with conn:
            with conn.cursor() as cur:
                yield cur
    finally:
        conn.close()


def fetch_menu_items():
    """
    Retrieve menu items from Postgres.
    Update MENU_QUERY in the environment if your schema differs.
    """
    default_query = """
        SELECT
          item_id AS id,
          name,
          price,
          is_topping
        FROM item
        ORDER BY name;
    """
    sql = os.getenv("MENU_QUERY", default_query)
    with _db_cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    mapped = []
    for row in rows:
        mapped.append({
            "id": row.get("id"),
            "name": row.get("name"),
            "price": float(row["price"]) if row.get("price") is not None else None,
            "is_topping": row.get("is_topping")
        })
    return mapped


@app.get("/api/menu")
def get_menu():
    try:
        menu = fetch_menu_items()
    except Exception as exc:  # pragma: no cover - logged for visibility
        app.logger.exception("Unable to fetch menu: %s", exc)
        return jsonify({"error": "Unable to load menu"}), 500
    return jsonify(menu)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
