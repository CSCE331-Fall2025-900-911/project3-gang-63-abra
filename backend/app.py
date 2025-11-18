import os
from contextlib import contextmanager
from urllib.parse import urlencode

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session, url_for
import psycopg2
from psycopg2.extras import RealDictCursor
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
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
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
    client_kwargs={
        'scope': 'openid email profile'
    }
)


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


@app.route('/auth/google')
def google_auth():
    redirect_uri = url_for('google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
        
        # Use the token to get user info
        resp = google.get('https://www.googleapis.com/oauth2/v2/userinfo')
        user_info = resp.json()
        
        # Check if the email is in the allowed list
        user_email = user_info.get('email', '').lower()
        if user_email not in [email.lower() for email in ALLOWED_EMAILS]:
            app.logger.warning(f"Unauthorized login attempt from: {user_email}")
            return f"<h1>Access Denied</h1><p>Your email ({user_email}) is not authorized to access this system.</p>", 403
        
        session['user'] = user_info
        app.logger.info(f"User logged in successfully: {user_email}")
        
        # Redirect to the frontend, which can then decide where to take the user.
        return redirect(os.getenv("FRONTEND_URL", "http://localhost:5173/"))
    except Exception as e:
        app.logger.error(f"Error during Google callback: {str(e)}")
        return f"<h1>Authentication Error</h1><p>An error occurred during login: {str(e)}</p>", 500

@app.route('/api/user')
def get_user():
    user = session.get('user')
    if user:
        return jsonify(user)
    return jsonify({'error': 'Not logged in'}), 401

@app.route('/api/logout')
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out successfully'})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
