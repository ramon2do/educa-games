# EduCA VZLA — Plataforma Web de Juegos Educativos & Gestión VIP

Plataforma web educativa moderna, elegante y 100% responsiva desarrollada a medida para Venezuela. Cuenta con un servidor backend nativo en Python (`http.server` y SQLite) adaptado para despliegue en entornos WSGI, un sistema completo de autenticación de usuarios, un Panel de Administración con tres pestañas interactivas (Resumen, Usuarios y Pagos), control de suscripciones VIP manuales (con referencia de pago móvil/transferencia a la tasa del BCV) y un catálogo de juegos educativos interactivos protegidos por membresía.

---

## 🌐 Enlaces Oficiales y Despliegue

* **Sitio Web en Vivo (PythonAnywhere):** [https://ramon2do.pythonanywhere.com](https://ramon2do.pythonanywhere.com)
* **Repositorio Público en GitHub:** [https://github.com/ramon2do/educa-games](https://github.com/ramon2do/educa-games)

---

## 🚀 Características Principales

* **Diseño UI/UX Oscuro y Moderno:** Interfaz basada en Tailwind CSS con paleta de tonos oscuros (`#0f172a`, `#1e293b`), acentos en índigo/violeta (`#6366f1`, `#8b5cf6`) y notificaciones flotantes dinámicas.
* **Backend Nativo en Python con Adaptador WSGI:**
  * Servidor web asíncrono y liviano construido con `http.server` y `socketserver` para ejecución local.
  * Conector WSGI interno en `main.py` para compatibilidad nativa con servidores de producción en la nube como **PythonAnywhere**.
  * Base de datos relacional robusta gestionada con `sqlite3` y contraseñas protegidas con hashes seguros SHA-256.
* **Autenticación y Roles:**
  * Registro de usuarios nuevos y sistema de inicio de sesión con persistencia de sesión en memoria.
  * Cuenta de Administrador Principal precargada por defecto: **`admin@educa.ve` / `admin123`**.
* **Panel de Administración con Pestañas (Tabs):**
  * **Resumen:** Métricas en tiempo real de usuarios totales, suscripciones activas, pagos pendientes e ingresos estimados ($5 USD por suscriptor).
  * **Usuarios:** Listado completo con opción de activación/desactivación instantánea del estado VIP mediante un botón funcional conectado al backend.
  * **Pagos:** Gestión de comprobantes de pago enviados por los usuarios. Los pagos aprobados o rechazados **permanecen en la lista** mostrando claramente su estado de resultado sin eliminarse.
* **Membresía y Suscripción VIP ($5 USD):**
  * Módulo de envío de número de referencia de pago para validación administrativa.
  * Bloqueo estricto del catálogo de juegos para usuarios sin suscripción activa (tanto visualmente mediante el atributo `disabled` como en la lógica interna de apertura de juegos).
* **Catálogo de Juegos Educativos:**
  * *Matemática Básica:* Desafíos aritméticos aleatorios de agilidad mental.
  * *Ortografía:* Ejercicios interactivos de gramática en español.
  * *Geografía de Venezuela:* Trivias sobre estados, capitales y regiones del país.
* **Tablas Responsivas:**
  * Las tablas del panel administrativo están envueltas en contenedores con scroll horizontal (`overflow-x-auto` y `whitespace-nowrap`) para garantizar una perfecta visualización en dispositivos móviles.
* **Favicon Personalizado:** Incorporación de icono mediante SVG integrado o archivo multimedia directo.

---

## 📁 Estructura de Archivos

El proyecto mantiene una arquitectura modular limpia y separada por responsabilidades:

```text
📦 educa-vzla/
 ┣ 📜 database.py             # Capa de conexión SQLite, esquema de tablas (users, subscriptions) y semilla Admin
 ┣ 📜 main.py                 # Servidor HTTP local + Adaptador WSGI para PythonAnywhere
 ┣ 📜 index.html              # Estructura HTML5 semántica y maquetación principal con Tailwind CSS
 ┣ 📁 css/
 ┃  ┗ 📜 styles.css           # Estilos CSS personalizados complementarios
 ┣ 📁 js/
 ┃  ┗ 📜 app.js               # Lógica de interfaz de usuario, gestión de sesión, tabs, modales y juegos
 ┣ 📜 educa.db                # Archivo de base de datos SQLite (generado automáticamente)
 ┗ 📜 README.md               # Documentación completa del proyecto
```

---

## 🗄️ Modelo Entidad-Relación (DER)

La base de datos `educa.db` está compuesta por dos tablas principales con una relación **Uno a Uno (1:1)** garantizada por la restricción `UNIQUE` en la clave foránea:

1. **`users` (Usuarios):**
   * `id` (INTEGER, PK, Autoincremental)
   * `name` (TEXT, Nombre del usuario)
   * `email` (TEXT, Único, Correo electrónico)
   * `password` (TEXT, Hash SHA-256)
   * `role` (TEXT, `'user'` o `'admin'`)
   * `created_at` (TIMESTAMP)
2. **`subscriptions` (Suscripciones):**
   * `id` (INTEGER, PK, Autoincremental)
   * `user_id` (INTEGER, FK a `users.id`, con restricción **`UNIQUE`** para consultas `ON CONFLICT`)
   * `payment_reference` (TEXT, Número de referencia bancaria)
   * `status` (TEXT, `'inactive'`, `'pending'`, `'active'`, o `'cancelled'`)
   * `updated_at` (TIMESTAMP)

---

## ⚙️ Instrucciones de Uso y Ejecución Local

1. Asegúrate de tener instalado **Python 3** en tu equipo.
2. Organiza los archivos respetando la estructura de carpetas (`css/styles.css` y `js/app.js`).
3. Inicia el servidor web local ejecutando en tu terminal:
   ```bash
   python main.py
   ```
   *(Al ejecutar `main.py`, la función `database.init_db()` se invoca automáticamente, por lo que creará el archivo `educa.db` y precargará el usuario administrador sin necesidad de ejecutar scripts adicionales).*
4. Abre tu navegador web e ingresa a la dirección: **`http://localhost:8000`**.
5. Inicia sesión como administrador con `admin@educa.ve` y contraseña `admin123`.

---

## ☁️ Despliegue en PythonAnywhere

1. Sube los archivos respetando la estructura de directorios en tu panel de archivos de PythonAnywhere (`/home/tu_usuario/educa-games`).
2. En la pestaña **Web**, abre el archivo de configuración WSGI (`/var/www/tu_usuario_pythonanywhere_com_wsgi.py`) y configura la ruta del proyecto:
   ```python
   import sys
   import os

   project_home = '/home/tu_usuario/educa-games'
   if project_home not in sys.path:
       sys.path.insert(0, project_home)

   from main import application
   ```
3. Presiona **Reload** en la pestaña Web.

---

## 🔄 Mecanismo de Replicación (Prompt Maestro 100%)

Si deseas replicar en su totalidad esta misma aplicación web utilizando una Inteligencia Artificial, utiliza íntegramente el siguiente prompt detallado:

```text
Actúa como un Desarrollador Web Full Stack Senior experto en Python (librería estándar) y JavaScript vainilla con Tailwind CSS. Necesito que crees desde cero una plataforma web educativa interactiva llamada "EduCA" de juegos y suscripciones VIP para Venezuela.

La aplicación debe estructurarse en archivos independientes exactamente así: database.py, main.py, index.html, css/styles.css y js/app.js.

### Requerimientos Técnicos y Funcionales detallados:

1. Base de Datos (database.py):
   - Utilizar SQLite3 con un archivo "educa.db".
   - Crear la tabla "users" (id, name, email UNIQUE, password con hash SHA-256, role por defecto 'user', created_at).
   - Crear la tabla "subscriptions" (id, user_id INTEGER UNIQUE, payment_reference, status por defecto 'inactive', updated_at, FOREIGN KEY a users.id). El campo user_id DEBE ser UNIQUE para permitir actualizaciones limpias con ON CONFLICT.
   - Inicializar por defecto una cuenta de Administrador con email "admin@educa.ve", contraseña "admin123" (hasheada) y suscripción activa en la tabla subscriptions.

2. Servidor Web (main.py):
   - Utilizar un servidor HTTP nativo en Python con http.server y socketserver (puerto 8000) para pruebas locales, e incluir una función callable `application(environ, start_response)` como adaptador WSGI para despliegue en la nube (PythonAnywhere).
   - Servir adecuadamente los archivos estáticos respetando las rutas (/css/styles.css y /js/app.js).
   - Al arrancar, debe invocar automáticamente database.init_db() para preparar la base de datos.
   - Implementar endpoints REST JSON para autenticación (/api/login, /api/register, /api/session, /api/logout), gestión de pagos (/api/subscription/pay, /api/subscription/cancel) y el panel de administración (/api/admin/metrics, /api/admin/users, /api/admin/payments, /api/admin/user/toggle-vip, /api/admin/payment/process).

3. Interfaz de Usuario y Estilos (index.html, css/styles.css, js/app.js):
   - Estética oscura moderna basada en Tailwind CSS (clase dark, colores slate y acentos índigo).
   - Sistema de navegación dinámico según la sesión activa (Invitado, Usuario Regular, Administrador).
   - Panel de Administración con 3 pestañas funcionales (Resumen con métricas, Usuarios con botón interactivo de activación/desactivación VIP en tiempo real, y Pagos que muestren todos los registros con su estado -Pendiente, Aprobado, Rechazado- sin eliminarse de la vista tras ser procesados). Las tablas deben ser responsivas utilizando contenedores con scroll horizontal (overflow-x-auto).
   - Catálogo de 3 juegos interactivos (Matemática Básica, Ortografía y Geografía de Venezuela). Los botones de juego deben estar estrictamente deshabilitados (atributo disabled y validación de seguridad en JavaScript openGame()) si el usuario no posee una suscripción activa ("active").
   - Favicon integrado.
```

---

## 📞 Datos de Contacto y Soporte

* **Plataforma:** EduCA — Juegos Educativos VZLA
* **Administración Principal:** `admin@educa.ve`
* **Despliegue Web:** [https://ramon2do.pythonanywhere.com](https://ramon2do.pythonanywhere.com)
* **Código Fuente:** [https://github.com/ramon2do/educa-games](https://github.com/ramon2do/educa-games)