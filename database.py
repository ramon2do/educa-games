import sqlite3
import hashlib

DB_NAME = "educa.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Se agrega UNIQUE a user_id para que ON CONFLICT(user_id) funcione correctamente al cambiar VIP
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            payment_reference TEXT,
            status TEXT NOT NULL DEFAULT 'inactive',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    admin_pass = hash_password("admin123")
    cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@educa.ve",))
    admin = cursor.fetchone()

    if not admin:
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ("Administrador Principal", "admin@educa.ve", admin_pass, "admin")
        )
        admin_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO subscriptions (user_id, status) VALUES (?, ?)",
            (admin_id, "active")
        )
    else:
        cursor.execute(
            "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
            (admin_pass, "admin@educa.ve")
        )
        cursor.execute(
            "UPDATE subscriptions SET status = 'active' WHERE user_id = ?",
            (admin[0],)
        )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()