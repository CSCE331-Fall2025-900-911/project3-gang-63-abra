import os
from contextlib import contextmanager
from urllib.parse import urlencode
from datetime import datetime, timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session, url_for
from flask import Flask, jsonify, redirect, request, session, url_for
import psycopg2
from psycopg2.extras import RealDictCursor
from authlib.integrations.flask_client import OAuth

from flask_cors import CORS

import requests

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "a-super-secret-key")

# Proper CORS configuration for authentication
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:5173", "http://localhost:5174", os.getenv("FRONTEND_URL", "http://localhost:5173"), "https://project3-gang-63-abra.vercel.app"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

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
          is_topping,
          category
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
            "is_topping": row.get("is_topping"),
            "category": row.get("category")  # New field for category
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


@app.route('/auth/google')
def google_auth():
    redirect_uri = url_for('google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
        
        # Get user info
        resp = google.get('https://www.googleapis.com/oauth2/v2/userinfo')
        user_info = resp.json()

        user_email = user_info.get('email', '').lower()
        allowed = [email.lower() for email in ALLOWED_EMAILS]

        # Assign roles
        if user_email in allowed:
            role = "manager"
        else:
            role = "customer"

        # Store in session
        session['user'] = {
            **user_info,
            "role": role
        }

        app.logger.info(f"User logged in: {user_email} | role = {role}")

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


# ==================== MANAGER API ENDPOINTS ====================

# ----- ORDER HISTORY & TRENDS -----

@app.get("/api/orders")
def get_orders():
    """Get all orders with optional date filtering."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        with _db_cursor() as cur:
            if start_date and end_date:
                cur.execute("""
                    SELECT oh.order_id, oh.employee_id, e.name as employee_name, 
                           oh.price, oh.date, oh.time
                    FROM order_history oh
                    LEFT JOIN employee e ON oh.employee_id = e.employee_id
                    WHERE oh.date BETWEEN %s AND %s
                    ORDER BY oh.date DESC, oh.time DESC;
                """, (start_date, end_date))
            else:
                cur.execute("""
                    SELECT oh.order_id, oh.employee_id, e.name as employee_name, 
                           oh.price, oh.date, oh.time
                    FROM order_history oh
                    LEFT JOIN employee e ON oh.employee_id = e.employee_id
                    ORDER BY oh.date DESC, oh.time DESC
                    LIMIT 100;
                """)
            rows = cur.fetchall()
        
        orders = []
        for row in rows:
            orders.append({
                "order_id": row["order_id"],
                "employee_id": row["employee_id"],
                "employee_name": row["employee_name"],
                "price": float(row["price"]) if row["price"] else 0,
                "date": str(row["date"]) if row["date"] else None,
                "time": str(row["time"]) if row["time"] else None
            })
        return jsonify(orders)
    except Exception as exc:
        app.logger.exception("Unable to fetch orders: %s", exc)
        return jsonify({"error": "Unable to load orders"}), 500


@app.get("/api/orders/<int:order_id>/items")
def get_order_items(order_id):
    """Get items for a specific order."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT oj.item_id, i.name, i.price, oj.quantity
                FROM order_junction oj
                JOIN item i ON oj.item_id = i.item_id
                WHERE oj.order_id = %s;
            """, (order_id,))
            rows = cur.fetchall()
        
        items = []
        for row in rows:
            items.append({
                "item_id": row["item_id"],
                "name": row["name"],
                "price": float(row["price"]) if row["price"] else 0,
                "quantity": row["quantity"]
            })
        return jsonify(items)
    except Exception as exc:
        app.logger.exception("Unable to fetch order items: %s", exc)
        return jsonify({"error": "Unable to load order items"}), 500


@app.get("/api/orders/trends")
def get_order_trends():
    """Get order trends/analytics for a time period."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required"}), 400
    
    try:
        with _db_cursor() as cur:
            # Total sales and order count
            cur.execute("""
                SELECT COUNT(*) as total_orders, COALESCE(SUM(price), 0) as total_sales
                FROM order_history
                WHERE date BETWEEN %s AND %s;
            """, (start_date, end_date))
            summary = cur.fetchone()
            
            # Daily sales breakdown
            cur.execute("""
                SELECT date, COUNT(*) as order_count, COALESCE(SUM(price), 0) as daily_sales
                FROM order_history
                WHERE date BETWEEN %s AND %s
                GROUP BY date
                ORDER BY date;
            """, (start_date, end_date))
            daily_sales = cur.fetchall()
            
            # Top selling items
            cur.execute("""
                SELECT i.item_id, i.name, SUM(oj.quantity) as total_sold, 
                       SUM(oj.quantity * i.price) as revenue
                FROM order_junction oj
                JOIN item i ON oj.item_id = i.item_id
                JOIN order_history oh ON oj.order_id = oh.order_id
                WHERE oh.date BETWEEN %s AND %s
                GROUP BY i.item_id, i.name
                ORDER BY total_sold DESC
                LIMIT 10;
            """, (start_date, end_date))
            top_items = cur.fetchall()
            
            # Sales by employee
            cur.execute("""
                SELECT e.employee_id, e.name, COUNT(*) as order_count, 
                       COALESCE(SUM(oh.price), 0) as total_sales
                FROM order_history oh
                JOIN employee e ON oh.employee_id = e.employee_id
                WHERE oh.date BETWEEN %s AND %s
                GROUP BY e.employee_id, e.name
                ORDER BY total_sales DESC;
            """, (start_date, end_date))
            sales_by_employee = cur.fetchall()
            
            # Hourly distribution
            cur.execute("""
                SELECT EXTRACT(HOUR FROM time) as hour, COUNT(*) as order_count
                FROM order_history
                WHERE date BETWEEN %s AND %s
                GROUP BY EXTRACT(HOUR FROM time)
                ORDER BY hour;
            """, (start_date, end_date))
            hourly_distribution = cur.fetchall()
        
        return jsonify({
            "summary": {
                "total_orders": summary["total_orders"],
                "total_sales": float(summary["total_sales"])
            },
            "daily_sales": [{
                "date": str(row["date"]),
                "order_count": row["order_count"],
                "daily_sales": float(row["daily_sales"])
            } for row in daily_sales],
            "top_items": [{
                "item_id": row["item_id"],
                "name": row["name"],
                "total_sold": int(row["total_sold"]),
                "revenue": float(row["revenue"])
            } for row in top_items],
            "sales_by_employee": [{
                "employee_id": row["employee_id"],
                "name": row["name"],
                "order_count": row["order_count"],
                "total_sales": float(row["total_sales"])
            } for row in sales_by_employee],
            "hourly_distribution": [{
                "hour": int(row["hour"]) if row["hour"] else 0,
                "order_count": row["order_count"]
            } for row in hourly_distribution]
        })
    except Exception as exc:
        app.logger.exception("Unable to fetch order trends: %s", exc)
        return jsonify({"error": "Unable to load order trends"}), 500


# ----- INVENTORY MANAGEMENT -----

@app.get("/api/inventory")
def get_inventory():
    """Get all inventory items."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT ingredient_id, name, stock
                FROM ingredients
                ORDER BY name;
            """)
            rows = cur.fetchall()
        
        inventory = []
        for row in rows:
            inventory.append({
                "ingredient_id": row["ingredient_id"],
                "name": row["name"],
                "stock": row["stock"]
            })
        return jsonify(inventory)
    except Exception as exc:
        app.logger.exception("Unable to fetch inventory: %s", exc)
        return jsonify({"error": "Unable to load inventory"}), 500


@app.get("/api/inventory/low-stock")
def get_low_stock():
    """Get inventory items with low stock (below threshold)."""
    threshold = request.args.get('threshold', 10, type=int)
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT ingredient_id, name, stock
                FROM ingredients
                WHERE stock < %s
                ORDER BY stock ASC;
            """, (threshold,))
            rows = cur.fetchall()
        
        low_stock = []
        for row in rows:
            low_stock.append({
                "ingredient_id": row["ingredient_id"],
                "name": row["name"],
                "stock": row["stock"]
            })
        return jsonify(low_stock)
    except Exception as exc:
        app.logger.exception("Unable to fetch low stock items: %s", exc)
        return jsonify({"error": "Unable to load low stock items"}), 500


@app.post("/api/inventory/restock")
def restock_inventory():
    """Update inventory stock levels (restock)."""
    data = request.get_json()
    
    if not data or 'items' not in data:
        return jsonify({"error": "Items array is required"}), 400
    
    try:
        with _db_cursor() as cur:
            for item in data['items']:
                ingredient_id = item.get('ingredient_id')
                quantity = item.get('quantity', 0)
                
                if ingredient_id and quantity > 0:
                    cur.execute("""
                        UPDATE ingredients
                        SET stock = stock + %s
                        WHERE ingredient_id = %s
                        RETURNING ingredient_id, name, stock;
                    """, (quantity, ingredient_id))
        
        return jsonify({"message": "Inventory restocked successfully"})
    except Exception as exc:
        app.logger.exception("Unable to restock inventory: %s", exc)
        return jsonify({"error": "Unable to restock inventory"}), 500


@app.put("/api/inventory/<int:ingredient_id>")
def update_inventory_item(ingredient_id):
    """Update a specific inventory item's stock."""
    data = request.get_json()
    
    if not data or 'stock' not in data:
        return jsonify({"error": "Stock value is required"}), 400
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                UPDATE ingredients
                SET stock = %s
                WHERE ingredient_id = %s
                RETURNING ingredient_id, name, stock;
            """, (data['stock'], ingredient_id))
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Ingredient not found"}), 404
        
        return jsonify({
            "ingredient_id": row["ingredient_id"],
            "name": row["name"],
            "stock": row["stock"]
        })
    except Exception as exc:
        app.logger.exception("Unable to update inventory: %s", exc)
        return jsonify({"error": "Unable to update inventory"}), 500


@app.post("/api/inventory")
def add_inventory_item():
    """Add a new inventory item."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                INSERT INTO ingredients (name, stock)
                VALUES (%s, %s)
                RETURNING ingredient_id, name, stock;
            """, (data['name'], data.get('stock', 0)))
            row = cur.fetchone()
        
        return jsonify({
            "ingredient_id": row["ingredient_id"],
            "name": row["name"],
            "stock": row["stock"]
        }), 201
    except Exception as exc:
        app.logger.exception("Unable to add inventory item: %s", exc)
        return jsonify({"error": "Unable to add inventory item"}), 500


@app.delete("/api/inventory/<int:ingredient_id>")
def delete_inventory_item(ingredient_id):
    """Delete an inventory item."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                DELETE FROM ingredients
                WHERE ingredient_id = %s
                RETURNING ingredient_id;
            """, (ingredient_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Ingredient not found"}), 404
        
        return jsonify({"message": "Ingredient deleted successfully"})
    except Exception as exc:
        app.logger.exception("Unable to delete inventory item: %s", exc)
        return jsonify({"error": "Unable to delete inventory item"}), 500


# ----- EMPLOYEE MANAGEMENT -----

@app.get("/api/employees")
def get_employees():
    """Get all employees and managers from both tables."""
    try:
        with _db_cursor() as cur:
            # Get all managers from manager table
            cur.execute("""
                SELECT 
                    manager_id as employee_id, 
                    name, 
                    salary::numeric(7,2) as salary, 
                    'Manager' as role
                FROM manager
            """)
            managers = cur.fetchall()
            
            # Get all employees from employee table
            cur.execute("""
                SELECT 
                    employee_id, 
                    name, 
                    salary, 
                    manager_id
                FROM employee
                ORDER BY name;
            """)
            employees = cur.fetchall()
        
        # Create a set of manager IDs from the manager table
        manager_ids_set = {m["employee_id"] for m in managers}
        
        # Combine results
        all_staff = []
        
        # Add all employees from employee table
        # If their ID matches a manager ID, they're a manager, otherwise they're an employee
        for emp in employees:
            is_manager = emp["employee_id"] in manager_ids_set
            all_staff.append({
                "employee_id": emp["employee_id"],
                "name": emp["name"],
                "salary": float(emp["salary"]) if emp["salary"] else None,
                "role": "Manager" if is_manager else "Employee",
                "manager_id": emp["manager_id"]
            })
        
        # Add managers from manager table that aren't already in employee table
        employee_ids_set = {e["employee_id"] for e in employees}
        for mgr in managers:
            if mgr["employee_id"] not in employee_ids_set:
                all_staff.append({
                    "employee_id": mgr["employee_id"],
                    "name": mgr["name"],
                    "salary": float(mgr["salary"]) if mgr["salary"] else None,
                    "role": "Manager",
                    "manager_id": 0
                })
        
        # Sort by name
        all_staff.sort(key=lambda x: x["name"])
        
        return jsonify(all_staff)
    except Exception as exc:
        app.logger.exception("Unable to fetch employees: %s", exc)
        return jsonify({"error": "Unable to load employees"}), 500


@app.get("/api/employees/<int:employee_id>")
def get_employee(employee_id):
    """Get a specific employee."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT employee_id, name, salary, manager_id
                FROM employee
                WHERE employee_id = %s;
            """, (employee_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Employee not found"}), 404
        
        return jsonify({
            "employee_id": row["employee_id"],
            "name": row["name"],
            "salary": float(row["salary"]) if row["salary"] else None,
            "manager_id": row["manager_id"]
        })
    except Exception as exc:
        app.logger.exception("Unable to fetch employee: %s", exc)
        return jsonify({"error": "Unable to load employee"}), 500


@app.post("/api/employees")
def add_employee():
    """Add a new employee."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                INSERT INTO employee (name, salary, manager_id)
                VALUES (%s, %s, %s)
                RETURNING employee_id, name, salary, manager_id;
            """, (data['name'], data.get('salary'), data.get('manager_id', 0)))
            row = cur.fetchone()
        
        return jsonify({
            "employee_id": row["employee_id"],
            "name": row["name"],
            "salary": float(row["salary"]) if row["salary"] else None,
            "manager_id": row["manager_id"]
        }), 201
    except Exception as exc:
        app.logger.exception("Unable to add employee: %s", exc)
        return jsonify({"error": "Unable to add employee"}), 500


@app.put("/api/employees/<int:employee_id>")
def update_employee(employee_id):
    """Update an employee."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        with _db_cursor() as cur:
            # Build dynamic update query
            updates = []
            values = []
            
            if 'name' in data:
                updates.append("name = %s")
                values.append(data['name'])
            if 'salary' in data:
                updates.append("salary = %s")
                values.append(data['salary'])
            if 'manager_id' in data:
                updates.append("manager_id = %s")
                values.append(data['manager_id'])
            
            if not updates:
                return jsonify({"error": "No valid fields to update"}), 400
            
            values.append(employee_id)
            
            cur.execute(f"""
                UPDATE employee
                SET {', '.join(updates)}
                WHERE employee_id = %s
                RETURNING employee_id, name, salary, manager_id;
            """, values)
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Employee not found"}), 404
        
        return jsonify({
            "employee_id": row["employee_id"],
            "name": row["name"],
            "salary": float(row["salary"]) if row["salary"] else None,
            "manager_id": row["manager_id"]
        })
    except Exception as exc:
        app.logger.exception("Unable to update employee: %s", exc)
        return jsonify({"error": "Unable to update employee"}), 500


@app.delete("/api/employees/<int:employee_id>")
def delete_employee(employee_id):
    """Delete an employee."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                DELETE FROM employee
                WHERE employee_id = %s
                RETURNING employee_id;
            """, (employee_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Employee not found"}), 404
        
        return jsonify({"message": "Employee deleted successfully"})
    except Exception as exc:
        app.logger.exception("Unable to delete employee: %s", exc)
        return jsonify({"error": "Unable to delete employee"}), 500


@app.get("/api/employees/<int:employee_id>/performance")
def get_employee_performance(employee_id):
    """Get employee performance metrics."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        with _db_cursor() as cur:
            if start_date and end_date:
                cur.execute("""
                    SELECT COUNT(*) as total_orders, COALESCE(SUM(price), 0) as total_sales
                    FROM order_history
                    WHERE employee_id = %s AND date BETWEEN %s AND %s;
                """, (employee_id, start_date, end_date))
            else:
                cur.execute("""
                    SELECT COUNT(*) as total_orders, COALESCE(SUM(price), 0) as total_sales
                    FROM order_history
                    WHERE employee_id = %s;
                """, (employee_id,))
            
            row = cur.fetchone()
        
        return jsonify({
            "employee_id": employee_id,
            "total_orders": row["total_orders"],
            "total_sales": float(row["total_sales"])
        })
    except Exception as exc:
        app.logger.exception("Unable to fetch employee performance: %s", exc)
        return jsonify({"error": "Unable to load employee performance"}), 500


# ----- MENU ITEM MANAGEMENT -----

@app.post("/api/menu")
def add_menu_item():
    """Add a new menu item."""
    data = request.get_json()
    
    if not data or 'name' not in data or 'price' not in data:
        return jsonify({"error": "Name and price are required"}), 400
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                INSERT INTO item (name, price, is_topping)
                VALUES (%s, %s, %s)
                RETURNING item_id, name, price, is_topping;
            """, (data['name'], data['price'], data.get('is_topping', False)))
            row = cur.fetchone()
        
        return jsonify({
            "id": row["item_id"],
            "name": row["name"],
            "price": float(row["price"]),
            "is_topping": row["is_topping"]
        }), 201
    except Exception as exc:
        app.logger.exception("Unable to add menu item: %s", exc)
        return jsonify({"error": "Unable to add menu item"}), 500


@app.put("/api/menu/<int:item_id>")
def update_menu_item(item_id):
    """Update a menu item."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        with _db_cursor() as cur:
            updates = []
            values = []
            
            if 'name' in data:
                updates.append("name = %s")
                values.append(data['name'])
            if 'price' in data:
                updates.append("price = %s")
                values.append(data['price'])
            if 'is_topping' in data:
                updates.append("is_topping = %s")
                values.append(data['is_topping'])
            
            if not updates:
                return jsonify({"error": "No valid fields to update"}), 400
            
            values.append(item_id)
            
            cur.execute(f"""
                UPDATE item
                SET {', '.join(updates)}
                WHERE item_id = %s
                RETURNING item_id, name, price, is_topping;
            """, values)
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Menu item not found"}), 404
        
        return jsonify({
            "id": row["item_id"],
            "name": row["name"],
            "price": float(row["price"]),
            "is_topping": row["is_topping"]
        })
    except Exception as exc:
        app.logger.exception("Unable to update menu item: %s", exc)
        return jsonify({"error": "Unable to update menu item"}), 500


@app.delete("/api/menu/<int:item_id>")
def delete_menu_item(item_id):
    """Delete a menu item."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                DELETE FROM item
                WHERE item_id = %s
                RETURNING item_id;
            """, (item_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({"error": "Menu item not found"}), 404
        
        return jsonify({"message": "Menu item deleted successfully"})
    except Exception as exc:
        app.logger.exception("Unable to delete menu item: %s", exc)
        return jsonify({"error": "Unable to delete menu item"}), 500


# ==================== REPORT ENDPOINTS ====================

@app.get("/api/reports/x-report")
def get_x_report():
    """X-Report: Today's hourly sales breakdown."""
    try:
        today = datetime.now().date()
        with _db_cursor() as cur:
            # Hourly breakdown for today
            cur.execute("""
                SELECT 
                    EXTRACT(HOUR FROM time) as hour,
                    COUNT(*) as order_count,
                    COALESCE(SUM(price), 0) as total_sales
                FROM order_history
                WHERE date = %s
                GROUP BY EXTRACT(HOUR FROM time)
                ORDER BY hour;
            """, (today,))
            rows = cur.fetchall()
        
        report = []
        for row in rows:
            report.append({
                "hour": int(row["hour"]) if row["hour"] else 0,
                "order_count": row["order_count"],
                "total_sales": float(row["total_sales"])
            })
        return jsonify(report)
    except Exception as exc:
        app.logger.exception("Unable to generate X-Report: %s", exc)
        return jsonify({"error": "Unable to generate X-Report"}), 500


@app.get("/api/reports/z-report")
def get_z_report():
    """Z-Report: End of day summary for a specific date."""
    date = request.args.get('date')
    if not date:
        date = datetime.now().date()
    
    try:
        with _db_cursor() as cur:
            # Total sales and orders for the day
            cur.execute("""
                SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(price), 0) as total_sales,
                    COALESCE(AVG(price), 0) as avg_order_value,
                    COALESCE(MIN(price), 0) as min_order,
                    COALESCE(MAX(price), 0) as max_order
                FROM order_history
                WHERE date = %s;
            """, (date,))
            summary = cur.fetchone()
            
            # Top items sold today
            cur.execute("""
                SELECT i.name, SUM(oj.quantity) as quantity_sold, 
                       SUM(oj.quantity * i.price) as revenue
                FROM order_junction oj
                JOIN item i ON oj.item_id = i.item_id
                JOIN order_history oh ON oj.order_id = oh.order_id
                WHERE oh.date = %s
                GROUP BY i.name
                ORDER BY quantity_sold DESC
                LIMIT 5;
            """, (date,))
            top_items = cur.fetchall()
        
        return jsonify({
            "date": str(date),
            "total_orders": summary["total_orders"],
            "total_sales": float(summary["total_sales"]),
            "avg_order_value": float(summary["avg_order_value"]),
            "min_order": float(summary["min_order"]),
            "max_order": float(summary["max_order"]),
            "top_items": [{
                "name": item["name"],
                "quantity_sold": int(item["quantity_sold"]),
                "revenue": float(item["revenue"])
            } for item in top_items]
        })
    except Exception as exc:
        app.logger.exception("Unable to generate Z-Report: %s", exc)
        return jsonify({"error": "Unable to generate Z-Report"}), 500


@app.get("/api/reports/weekly-sales")
def get_weekly_sales():
    """Weekly sales history for the last 8 weeks."""
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT 
                    DATE_TRUNC('week', date) as week_start,
                    COUNT(*) as order_count,
                    COALESCE(SUM(price), 0) as total_sales
                FROM order_history
                WHERE date >= CURRENT_DATE - INTERVAL '8 weeks'
                GROUP BY DATE_TRUNC('week', date)
                ORDER BY week_start DESC;
            """)
            rows = cur.fetchall()
        
        report = []
        for row in rows:
            report.append({
                "week_start": str(row["week_start"].date()) if row["week_start"] else None,
                "order_count": row["order_count"],
                "total_sales": float(row["total_sales"])
            })
        return jsonify(report)
    except Exception as exc:
        app.logger.exception("Unable to generate weekly sales report: %s", exc)
        return jsonify({"error": "Unable to generate weekly sales report"}), 500


@app.get("/api/reports/hourly-sales")
def get_hourly_sales():
    """Hourly sales history for a specific date."""
    date = request.args.get('date')
    if not date:
        date = datetime.now().date()
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT 
                    EXTRACT(HOUR FROM time) as hour,
                    COUNT(*) as order_count,
                    COALESCE(SUM(price), 0) as total_sales,
                    COALESCE(AVG(price), 0) as avg_order_value
                FROM order_history
                WHERE date = %s
                GROUP BY EXTRACT(HOUR FROM time)
                ORDER BY hour;
            """, (date,))
            rows = cur.fetchall()
        
        report = []
        for row in rows:
            report.append({
                "hour": int(row["hour"]) if row["hour"] else 0,
                "order_count": row["order_count"],
                "total_sales": float(row["total_sales"]),
                "avg_order_value": float(row["avg_order_value"])
            })
        return jsonify(report)
    except Exception as exc:
        app.logger.exception("Unable to generate hourly sales report: %s", exc)
        return jsonify({"error": "Unable to generate hourly sales report"}), 500


@app.get("/api/reports/peak-sales")
def get_peak_sales_days():
    """Top N peak sales days."""
    limit = request.args.get('limit', 10, type=int)
    
    try:
        with _db_cursor() as cur:
            cur.execute("""
                SELECT 
                    date,
                    COUNT(*) as order_count,
                    COALESCE(SUM(price), 0) as total_sales
                FROM order_history
                GROUP BY date
                ORDER BY total_sales DESC
                LIMIT %s;
            """, (limit,))
            rows = cur.fetchall()
        
        report = []
        for row in rows:
            report.append({
                "date": str(row["date"]) if row["date"] else None,
                "order_count": row["order_count"],
                "total_sales": float(row["total_sales"])
            })
        return jsonify(report)
    except Exception as exc:
        app.logger.exception("Unable to generate peak sales report: %s", exc)
        return jsonify({"error": "Unable to generate peak sales report"}), 500


@app.get("/api/reports/product-usage")
def get_product_usage_report():
    """Product usage report showing what sells together."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required"}), 400
    
    try:
        with _db_cursor() as cur:
            # Most popular items
            cur.execute("""
                SELECT 
                    i.name,
                    i.is_topping,
                    SUM(oj.quantity) as times_ordered,
                    COUNT(DISTINCT oj.order_id) as unique_orders,
                    SUM(oj.quantity * i.price) as revenue
                FROM order_junction oj
                JOIN item i ON oj.item_id = i.item_id
                JOIN order_history oh ON oj.order_id = oh.order_id
                WHERE oh.date BETWEEN %s AND %s
                GROUP BY i.item_id, i.name, i.is_topping
                ORDER BY times_ordered DESC;
            """, (start_date, end_date))
            rows = cur.fetchall()
        
        report = []
        for row in rows:
            report.append({
                "name": row["name"],
                "is_topping": row["is_topping"],
                "times_ordered": int(row["times_ordered"]),
                "unique_orders": row["unique_orders"],
                "revenue": float(row["revenue"])
            })
        return jsonify(report)
    except Exception as exc:
        app.logger.exception("Unable to generate product usage report: %s", exc)
        return jsonify({"error": "Unable to generate product usage report"}), 500


@app.post("/api/reports/custom")
def execute_custom_report():
    """Execute a custom SQL query (READ-ONLY for safety)."""
    data = request.get_json()
    
    if not data or 'query' not in data:
        return jsonify({"error": "Query is required"}), 400
    
    query = data['query'].strip().upper()
    
    # Basic security: only allow SELECT statements
    if not query.startswith('SELECT'):
        return jsonify({"error": "Only SELECT queries are allowed"}), 400
    
    # Prevent dangerous operations
    dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
    if any(keyword in query for keyword in dangerous_keywords):
        return jsonify({"error": "Query contains forbidden keywords"}), 400
    
    try:
        with _db_cursor() as cur:
            cur.execute(data['query'])
            rows = cur.fetchall()
        
        # Convert to list of dicts
        result = [dict(row) for row in rows]
        return jsonify(result)
    except Exception as exc:
        app.logger.exception("Unable to execute custom report: %s", exc)
        return jsonify({"error": f"Query execution failed: {str(exc)}"}), 500


@app.get("/api/weather")
def get_weather():
    city = request.args.get("city", "College Station")
    api_key = os.getenv("WEATHER_API_KEY")

    if not api_key:
        return jsonify({"error": "Weather API key is not configured"}), 500

    url = (
        "https://api.openweathermap.org/data/2.5/weather?"
        f"q={city}&appid={api_key}&units=metric"
    )

    try:
        resp = requests.get(url)
        data = resp.json()
        return jsonify(data)
    except Exception as e:
        app.logger.exception("Weather fetch error: %s", e)
        return jsonify({"error": "Failed to fetch weather"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")

