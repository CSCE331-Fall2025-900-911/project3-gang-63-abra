import os
from contextlib import contextmanager
from urllib.parse import urlencode

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session, url_for
from flask import Flask, jsonify, redirect, request, session, url_for
import psycopg2
from psycopg2.extras import RealDictCursor
from authlib.integrations.flask_client import OAuth

from flask_cors import CORS
from authlib.integrations.flask_client import OAuth

from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "a-super-secret-key")

# Proper CORS configuration for authentication
CORS(app, 
     supports_credentials=True,
     origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

# Session configuration for cross-origin
app.config['SESSION_COOKIE_SAMESITE'] = 'None'   # changed for Vercel
app.config['SESSION_COOKIE_SECURE'] = True       # changed for Vercel HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Allowed test users
ALLOWED_EMAILS = [
    'athul.mohanram05@tamu.edu',
    'masonnguyen1223@tamu.edu',
    'prisha08@tamu.edu',
    'reveille.bubbletea@gmail.com',
    'zaheersufi@tamu.edu'
]

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

def _get_db_settings():
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
    except Exception as exc:
        app.logger.exception("Unable to fetch menu: %s", exc)
        return jsonify({"error": "Unable to load menu"}), 500
    return jsonify(menu)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
