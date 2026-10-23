import http.server
import socketserver
import json
import sqlite3
import hashlib
import os
import io
import uuid
from urllib.parse import urlparse
import database

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Diccionario de sesiones independientes por navegador { "token_uuid": {user_data} }
SESSIONS = {}

class EducaRequestHandler(http.server.BaseHTTPRequestHandler):

    def get_session_token(self):
        cookie_header = self.headers.get('Cookie', '')
        for cookie in cookie_header.split(';'):
            cookie = cookie.strip()
            if cookie.startswith('session_token='):
                return cookie.split('=')[1]
        return None

    def get_current_user(self):
        token = self.get_session_token()
        if token and token in SESSIONS:
            return SESSIONS[token]
        return None

    def send_json_response(self, data, status=200, set_cookie_token=None, clear_cookie=False):
        try:
            body = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')

            if set_cookie_token:
                self.send_header('Set-Cookie', f'session_token={set_cookie_token}; Path=/; HttpOnly; SameSite=Lax')
            elif clear_cookie:
                self.send_header('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')

            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def serve_file(self, filename, content_type):
        file_path = os.path.join(BASE_DIR, filename)
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, "Archivo no encontrado")
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ['/', '/index.html']:
            self.serve_file('index.html', 'text/html')
        elif path in ['/styles.css', '/css/styles.css']:
            self.serve_file(os.path.join('css', 'styles.css') if os.path.exists(os.path.join(BASE_DIR, 'css', 'styles.css')) else 'styles.css', 'text/css')
        elif path in ['/app.js', '/js/app.js']:
            self.serve_file(os.path.join('js', 'app.js') if os.path.exists(os.path.join(BASE_DIR, 'js', 'app.js')) else 'app.js', 'application/javascript')
        elif path == '/api/session':
            user = self.get_current_user()
            self.send_json_response({'user': user})
        elif path == '/api/admin/metrics':
            self.handle_admin_metrics()
        elif path == '/api/admin/users':
            self.handle_admin_users()
        elif path == '/api/admin/payments':
            self.handle_admin_payments()
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            data = {}

        if path == '/api/login':
            self.handle_login(data)
        elif path == '/api/register':
            self.handle_register(data)
        elif path == '/api/logout':
            token = self.get_session_token()
            if token in SESSIONS:
                del SESSIONS[token]
            self.send_json_response({'success': True}, clear_cookie=True)
        elif path == '/api/subscription/pay':
            self.handle_subscription_pay(data)
        elif path == '/api/subscription/cancel':
            self.handle_subscription_cancel()
        elif path == '/api/admin/user/toggle-vip':
            self.handle_toggle_vip(data)
        elif path == '/api/admin/payment/process':
            self.handle_payment_process(data)
        else:
            self.send_error(404)

    def handle_login(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        hashed = database.hash_password(password)

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.role, COALESCE(s.status, 'inactive')
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE LOWER(u.email) = ? AND u.password = ?
        ''', (email, hashed))
        user = cursor.fetchone()
        conn.close()

        if user:
            session_token = str(uuid.uuid4())
            user_data = {
                'id': user[0], 'name': user[1], 'email': user[2], 'role': user[3], 'sub_status': user[4]
            }
            SESSIONS[session_token] = user_data
            self.send_json_response({'success': True, 'user': user_data}, set_cookie_token=session_token)
        else:
            self.send_json_response({'success': False, 'error': 'Credenciales inválidas'}, 401)

    def handle_register(self, data):
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not name or not email or not password:
            self.send_json_response({'success': False, 'error': 'Campos incompletos'}, 400)
            return

        hashed = database.hash_password(password)
        try:
            conn = database.get_connection()
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                           (name, email, hashed, 'user'))
            user_id = cursor.lastrowid
            cursor.execute('INSERT INTO subscriptions (user_id, status) VALUES (?, ?)', (user_id, 'inactive'))
            conn.commit()
            conn.close()

            session_token = str(uuid.uuid4())
            user_data = {
                'id': user_id, 'name': name, 'email': email, 'role': 'user', 'sub_status': 'inactive'
            }
            SESSIONS[session_token] = user_data
            self.send_json_response({'success': True, 'user': user_data}, set_cookie_token=session_token)
        except sqlite3.IntegrityError:
            self.send_json_response({'success': False, 'error': 'El correo ya está registrado'}, 400)

    def handle_subscription_pay(self, data):
        current_user = self.get_current_user()
        if not current_user:
            self.send_json_response({'success': False, 'error': 'No autorizado'}, 401)
            return
        ref = data.get('payment_reference', '').strip()
        if not ref:
            self.send_json_response({'success': False, 'error': 'Referencia requerida'}, 400)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE subscriptions 
            SET payment_reference = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        ''', (ref, current_user['id']))
        conn.commit()
        conn.close()

        current_user['sub_status'] = 'pending'
        self.send_json_response({'success': True})

    def handle_subscription_cancel(self):
        current_user = self.get_current_user()
        if not current_user:
            self.send_json_response({'success': False, 'error': 'No autorizado'}, 401)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ?", (current_user['id'],))
        conn.commit()
        conn.close()

        current_user['sub_status'] = 'cancelled'
        self.send_json_response({'success': True})

    def handle_admin_metrics(self):
        current_user = self.get_current_user()
        if not current_user or current_user['role'] != 'admin':
            self.send_json_response({'error': 'No autorizado'}, 403)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'")
        active_subs = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM subscriptions WHERE status = 'pending'")
        pending_payments = cursor.fetchone()[0]
        conn.close()

        self.send_json_response({
            'total_users': total_users,
            'active_subscriptions': active_subs,
            'pending_payments': pending_payments
        })

    def handle_admin_users(self):
        current_user = self.get_current_user()
        if not current_user or current_user['role'] != 'admin':
            self.send_json_response({'error': 'No autorizado'}, 403)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.role, COALESCE(s.status, 'inactive')
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            ORDER BY u.id ASC
        ''')
        rows = cursor.fetchall()
        conn.close()
        users = [{'id': r[0], 'name': r[1], 'email': r[2], 'role': r[3], 'sub_status': r[4]} for r in rows]
        self.send_json_response(users)

    def handle_admin_payments(self):
        current_user = self.get_current_user()
        if not current_user or current_user['role'] != 'admin':
            self.send_json_response({'error': 'No autorizado'}, 403)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT s.id, u.name, u.email, s.payment_reference, s.status
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            WHERE s.payment_reference IS NOT NULL AND s.payment_reference != ''
            ORDER BY s.updated_at DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        payments = [{'id': r[0], 'user_name': r[1], 'user_email': r[2], 'payment_reference': r[3], 'status': r[4]} for r in rows]
        self.send_json_response(payments)

    def handle_toggle_vip(self, data):
        current_user = self.get_current_user()
        if not current_user or current_user['role'] != 'admin':
            self.send_json_response({'error': 'No autorizado'}, 403)
            return

        user_id = data.get('user_id')
        if not user_id:
            self.send_json_response({'success': False, 'error': 'ID inválido'}, 400)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM subscriptions WHERE user_id = ?", (user_id,))
        sub = cursor.fetchone()
        
        new_status = 'inactive'
        if not sub or sub[0] != 'active':
            new_status = 'active'

        cursor.execute('''
            INSERT INTO subscriptions (user_id, status) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET status = ?, updated_at = CURRENT_TIMESTAMP
        ''', (user_id, new_status, new_status))
        conn.commit()
        conn.close()

        for s_token, s_user in SESSIONS.items():
            if s_user['id'] == user_id:
                s_user['sub_status'] = new_status

        self.send_json_response({'success': True, 'new_status': new_status})

    def handle_payment_process(self, data):
        current_user = self.get_current_user()
        if not current_user or current_user['role'] != 'admin':
            self.send_json_response({'error': 'No autorizado'}, 403)
            return

        sub_id = data.get('subscription_id')
        status = data.get('status')
        if not sub_id or status not in ['active', 'cancelled']:
            self.send_json_response({'success': False, 'error': 'Parámetros inválidos'}, 400)
            return

        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, sub_id))
        
        cursor.execute("SELECT user_id FROM subscriptions WHERE id = ?", (sub_id,))
        row = cursor.fetchone()
        conn.commit()
        conn.close()

        if row:
            u_id = row[0]
            for s_token, s_user in SESSIONS.items():
                if s_user['id'] == u_id:
                    s_user['sub_status'] = status

        self.send_json_response({'success': True})

def run_server():
    database.init_db()
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, EducaRequestHandler)
    print(f"[INFO] Servidor web corriendo en http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Servidor detenido.")

# --- Adaptador WSGI para PythonAnywhere ---
database.init_db()

def application(environ, start_response):
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    try:
        request_body_size = int(environ.get('CONTENT_LENGTH', 0))
    except (ValueError, TypeError):
        request_body_size = 0
        
    request_body = environ['wsgi.input'].read(request_body_size) if request_body_size > 0 else b''

    handler = EducaRequestHandler.__new__(EducaRequestHandler)
    handler.path = path + ('?' + environ['QUERY_STRING'] if environ.get('QUERY_STRING') else '')
    handler.command = method
    handler.headers = {
        'Content-Type': environ.get('CONTENT_TYPE', ''),
        'Content-Length': str(request_body_size),
        'Cookie': environ.get('HTTP_COOKIE', '')
    }
    handler.rfile = io.BytesIO(request_body)
    handler.wfile = io.BytesIO()

    response_headers = []
    response_status = ["200 OK"]

    def custom_send_response(code, message=None):
        status_messages = {
            200: "200 OK", 
            400: "400 Bad Request", 
            401: "401 Unauthorized", 
            403: "403 Forbidden",
            404: "404 Not Found", 
            500: "500 Internal Server Error"
        }
        response_status[0] = status_messages.get(code, f"{code} OK")

    def custom_send_header(keyword, value):
        response_headers.append((keyword, value))

    def custom_end_headers():
        pass

    handler.send_response = custom_send_response
    handler.send_header = custom_send_header
    handler.end_headers = custom_end_headers

    if method == 'GET':
        handler.do_GET()
    elif method == 'POST':
        handler.do_POST()

    start_response(response_status[0], response_headers)
    return [handler.wfile.getvalue()]

if __name__ == "__main__":
    run_server()