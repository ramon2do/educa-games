let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});

function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const notif = document.createElement("div");
  notif.className = `p-4 rounded-xl shadow-xl text-white text-sm font-medium transition transform translate-y-2 opacity-0 flex items-center space-x-2 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`;
  notif.innerHTML = `<span>${message}</span>`;
  container.appendChild(notif);
  setTimeout(() => notif.classList.remove("translate-y-2", "opacity-0"), 50);
  setTimeout(() => {
    notif.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => notif.remove(), 300);
  }, 3500);
}

async function checkSession() {
  try {
    const res = await fetch("/api/session", { credentials: "same-origin" });
    const data = await res.json();
    currentUser = data.user || null;
    renderHeader();
    navigateHome();
  } catch (e) {
    renderHeader();
    navigateHome();
  }
}

function renderHeader() {
  const nav = document.getElementById("nav-auth-section");
  if (!nav) return;

  if (!currentUser) {
    nav.innerHTML = `
            <button onclick="showLoginModal()" class="text-sm font-semibold hover:text-indigo-400 transition">Iniciar Sesión</button>
            <button onclick="showRegisterModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition">Registrarse</button>
        `;
  } else {
    nav.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-right hidden sm:block">
                    <div class="text-sm font-bold">${currentUser.name}</div>
                    <div class="text-xs text-indigo-400 uppercase font-semibold">${currentUser.role}</div>
                </div>
                ${currentUser.role === "admin" ? '<button onclick="renderAdminDashboard()" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition">Admin</button>' : ""}
                <button onclick="logout()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition">Salir</button>
            </div>
        `;
  }
}

function navigateHome() {
  const main = document.getElementById("main-content");
  if (!currentUser) {
    main.innerHTML = `
            <div class="max-w-4xl mx-auto text-center py-12 space-y-6">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20">Plataforma Educativa Oficial</span>
                <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">Aprende, Juega y Suscríbete</h1>
                <p class="text-slate-400 text-lg max-w-2xl mx-auto">Disfruta de desafíos interactivos de Matemática, Ortografía y Geografía de Venezuela por solo $5 USD mensuales.</p>
                <div class="flex justify-center gap-4 pt-4">
                    <button onclick="showLoginModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition">Iniciar Sesión</button>
                    <button onclick="showRegisterModal()" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold px-6 py-3 rounded-xl transition">Crear Cuenta</button>
                </div>
            </div>
        `;
    return;
  }

  const isActive = currentUser.sub_status === "active";
  main.innerHTML = `
        <div class="space-y-6">
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                <div>
                    <h2 class="text-2xl font-bold">¡Bienvenido, ${currentUser.name}!</h2>
                    <p class="text-sm text-slate-400 mt-1">Estado de suscripción: <span class="font-bold uppercase ${isActive ? "text-emerald-400" : "text-amber-400"}">${currentUser.sub_status || "Inactiva"}</span></p>
                </div>
                ${!isActive ? `<button onclick="renderSubscriptionView()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition">Activar Suscripción VIP ($5)</button>` : `<button onclick="cancelSubscription()" class="bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 px-4 py-2 rounded-xl text-sm font-semibold transition">Cancelar Suscripción</button>`}
            </div>

            <h3 class="text-xl font-bold pt-4">Catálogo de Juegos Educativos</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <div>
                        <div class="text-3xl mb-3">🧮</div>
                        <h4 class="text-lg font-bold">Matemática Básica</h4>
                        <p class="text-xs text-slate-400 mt-1">Operaciones aritméticas y agilidad mental.</p>
                    </div>
                    <button onclick="openGame('math')" ${!isActive ? "disabled" : ""} class="mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition ${isActive ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"}">Jugar Ahora</button>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <div>
                        <div class="text-3xl mb-3">📚</div>
                        <h4 class="text-lg font-bold">Ortografía</h4>
                        <p class="text-xs text-slate-400 mt-1">Ejercicios gramaticales y vocabulario.</p>
                    </div>
                    <button onclick="openGame('spelling')" ${!isActive ? "disabled" : ""} class="mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition ${isActive ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"}">Jugar Ahora</button>
                </div>
                <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <div>
                        <div class="text-3xl mb-3">🇻🇪</div>
                        <h4 class="text-lg font-bold">Geografía de Venezuela</h4>
                        <p class="text-xs text-slate-400 mt-1">Trivias sobre estados, capitales y regiones.</p>
                    </div>
                    <button onclick="openGame('geo')" ${!isActive ? "disabled" : ""} class="mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition ${isActive ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"}">Jugar Ahora</button>
                </div>
            </div>
        </div>
    `;
}

function showLoginModal() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
        <div class="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl mt-10">
            <h2 class="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
            <form onsubmit="handleLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                    <input type="email" id="login-email" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
                    <input type="password" id="login-password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition">Ingresar</button>
            </form>
            <p class="text-center text-xs text-slate-400 mt-6">¿No tienes cuenta? <button onclick="showRegisterModal()" class="text-indigo-400 font-bold hover:underline">Regístrate aquí</button></p>
        </div>
    `;
}

function showRegisterModal() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
        <div class="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl mt-10">
            <h2 class="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
            <form onsubmit="handleRegister(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                    <input type="text" id="reg-name" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                    <input type="email" id="reg-email" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
                    <input type="password" id="reg-password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition">Registrarse</button>
            </form>
            <p class="text-center text-xs text-slate-400 mt-6">¿Ya tienes cuenta? <button onclick="showLoginModal()" class="text-indigo-400 font-bold hover:underline">Inicia sesión</button></p>
        </div>
    `;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) {
    currentUser = data.user;
    renderHeader();
    navigateHome();
    showNotification("¡Bienvenido de nuevo!");
  } else {
    showNotification(data.error || "Credenciales inválidas", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (data.success) {
    currentUser = data.user;
    renderHeader();
    navigateHome();
    showNotification("¡Cuenta registrada con éxito!");
  } else {
    showNotification(data.error || "Error al registrar", "error");
  }
}

async function logout() {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  currentUser = null;
  renderHeader();
  navigateHome();
  showNotification("Sesión cerrada");
}

function renderSubscriptionView() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
        <div class="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
            <h2 class="text-2xl font-bold">Activar Suscripción VIP</h2>
            <div class="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm space-y-2">
                <p class="font-bold text-indigo-300">Costo: $5 USD mensuales</p>
                <p class="text-slate-300">Pagaderos a la tasa oficial del BCV del día (aprox. 4,423.75 VES).</p>
            </div>
            <form onsubmit="submitPaymentReference(event)" class="space-y-4 pt-4 border-t border-slate-700">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Número de Referencia del Pago</label>
                    <input type="text" id="pay-ref" required placeholder="Ej. 12345678" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition">Enviar Comprobante</button>
            </form>
            <button onclick="navigateHome()" class="w-full text-slate-400 text-sm hover:text-white transition">Regresar</button>
        </div>
    `;
}

async function submitPaymentReference(e) {
  e.preventDefault();
  const reference = document.getElementById("pay-ref").value;
  const res = await fetch("/api/subscription/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ payment_reference: reference }),
  });
  const data = await res.json();
  if (data.success) {
    currentUser.sub_status = "pending";
    showNotification("Comprobante enviado. En espera de verificación.");
    navigateHome();
  } else {
    showNotification(data.error || "Error al enviar comprobante", "error");
  }
}

async function cancelSubscription() {
  if (!confirm("¿Estás seguro de cancelar tu suscripción?")) return;
  const res = await fetch("/api/subscription/cancel", {
    method: "POST",
    credentials: "same-origin",
  });
  const data = await res.json();
  if (data.success) {
    currentUser.sub_status = "cancelled";
    showNotification("Suscripción cancelada");
    navigateHome();
  }
}

function renderAdminDashboard() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2">🛡️ Panel de Administración General</h2>
                    <p class="text-xs text-slate-400 mt-1">Gestión integral de usuarios, accesos y validación de pagos.</p>
                </div>
                <div class="flex bg-slate-900 p-1.5 rounded-xl border border-slate-700 gap-1">
                    <button id="tab-btn-summary" onclick="switchAdminTab('summary')" class="px-4 py-2 rounded-lg text-xs font-bold transition bg-indigo-600 text-white">Resumen</button>
                    <button id="tab-btn-users" onclick="switchAdminTab('users')" class="px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white">Usuarios</button>
                    <button id="tab-btn-payments" onclick="switchAdminTab('payments')" class="px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white">Pagos</button>
                </div>
            </div>

            <div id="admin-summary-view" class="admin-view space-y-6"></div>
            <div id="admin-users-view" class="admin-view hidden space-y-6"></div>
            <div id="admin-payments-view" class="admin-view hidden space-y-6"></div>
        </div>
    `;
  loadAdminSummary();
}

function switchAdminTab(tabName) {
  document
    .querySelectorAll(".admin-view")
    .forEach((el) => el.classList.add("hidden"));

  ["summary", "users", "payments"].forEach((name) => {
    const btn = document.getElementById(`tab-btn-${name}`);
    if (btn) {
      btn.className =
        "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white";
    }
  });

  const targetView = document.getElementById(`admin-${tabName}-view`);
  const targetBtn = document.getElementById(`tab-btn-${tabName}`);

  if (targetView) targetView.classList.remove("hidden");
  if (targetBtn) {
    targetBtn.className =
      "px-4 py-2 rounded-lg text-xs font-bold transition bg-indigo-600 text-white";
  }

  if (tabName === "summary") loadAdminSummary();
  if (tabName === "users") loadAdminUsers();
  if (tabName === "payments") loadAdminPayments();
}

async function loadAdminSummary() {
  const res = await fetch("/api/admin/metrics", { credentials: "same-origin" });
  const data = await res.json();
  const container = document.getElementById("admin-summary-view");
  if (!container) return;

  container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
                <div class="text-xs text-slate-400 uppercase font-bold">Total Usuarios</div>
                <div class="text-3xl font-extrabold mt-2">${data.total_users || 0}</div>
            </div>
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
                <div class="text-xs text-slate-400 uppercase font-bold">Suscripciones Activas</div>
                <div class="text-3xl font-extrabold mt-2 text-emerald-400">${data.active_subscriptions || 0}</div>
            </div>
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
                <div class="text-xs text-slate-400 uppercase font-bold">Pagos Pendientes</div>
                <div class="text-3xl font-extrabold mt-2 text-amber-400">${data.pending_payments || 0}</div>
            </div>
            <div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg">
                <div class="text-xs text-slate-400 uppercase font-bold">Ingresos Estimados</div>
                <div class="text-3xl font-extrabold mt-2 text-indigo-400">$${(data.active_subscriptions || 0) * 5} USD</div>
            </div>
        </div>
    `;
}

async function loadAdminUsers() {
  const res = await fetch("/api/admin/users", { credentials: "same-origin" });
  const users = await res.json();
  const container = document.getElementById("admin-users-view");
  if (!container) return;

  container.innerHTML = `
        <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                        <tr class="border-b border-slate-700 text-xs font-bold text-slate-400 uppercase bg-slate-900/50">
                            <th class="p-4">Nombre</th>
                            <th class="p-4">Correo</th>
                            <th class="p-4">Rol</th>
                            <th class="p-4">Suscripción</th>
                            <th class="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700 text-sm">
                        ${users
                          .map(
                            (u) => `
                            <tr>
                                <td class="p-4 font-bold whitespace-nowrap">${u.name}</td>
                                <td class="p-4 text-slate-400 text-xs whitespace-nowrap">${u.email}</td>
                                <td class="p-4 whitespace-nowrap"><span class="px-2.5 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-purple-500/20 text-purple-300" : "bg-slate-700 text-slate-300"}">${u.role.toUpperCase()}</span></td>
                                <td class="p-4 whitespace-nowrap"><span class="px-2.5 py-1 rounded-full text-xs font-bold ${u.sub_status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}">${u.sub_status || "inactive"}</span></td>
                                <td class="p-4 text-right whitespace-nowrap">
                                    ${
                                      u.email === "admin@educa.ve"
                                        ? '<span class="text-xs text-slate-500 italic">Protegido</span>'
                                        : `
                                        <button onclick="toggleVipAdmin(${u.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition">Activar/Desactivar VIP</button>
                                    `
                                    }
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function toggleVipAdmin(userId) {
  const res = await fetch("/api/admin/user/toggle-vip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  if (data.success) {
    showNotification("Estado VIP actualizado");
    loadAdminUsers();
  } else {
    showNotification(data.error || "Error al actualizar", "error");
  }
}

async function loadAdminPayments() {
  const res = await fetch("/api/admin/payments", {
    credentials: "same-origin",
  });
  const payments = await res.json();
  const container = document.getElementById("admin-payments-view");
  if (!container) return;

  container.innerHTML = `
        <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr class="border-b border-slate-700 text-xs font-bold text-slate-400 uppercase bg-slate-900/50">
                            <th class="p-4">Usuario</th>
                            <th class="p-4">Referencia</th>
                            <th class="p-4">Monto Estimado</th>
                            <th class="p-4">Estado</th>
                            <th class="p-4 text-right">Acción / Resultado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700 text-sm">
                        ${
                          payments.length === 0
                            ? `<tr><td colspan="5" class="p-6 text-center text-slate-500">No hay pagos registrados.</td></tr>`
                            : payments
                                .map(
                                  (p) => `
                            <tr>
                                <td class="p-4 font-bold whitespace-nowrap">${p.user_name}<div class="text-xs text-slate-400 font-normal">${p.user_email}</div></td>
                                <td class="p-4 font-mono text-indigo-400 whitespace-nowrap">${p.payment_reference}</td>
                                <td class="p-4 whitespace-nowrap">4,423.75 VES</td>
                                <td class="p-4 whitespace-nowrap">
                                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${p.status === "active" ? "bg-emerald-500/20 text-emerald-300" : p.status === "cancelled" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}">
                                        ${p.status === "active" ? "Aprobado" : p.status === "cancelled" ? "Rechazado" : "Pendiente"}
                                    </span>
                                </td>
                                <td class="p-4 text-right whitespace-nowrap space-x-2">
                                    ${
                                      p.status === "pending"
                                        ? `
                                        <button onclick="processPayment(${p.id}, 'active')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition">Aprobar</button>
                                        <button onclick="processPayment(${p.id}, 'cancelled')" class="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition">Rechazar</button>
                                    `
                                        : `
                                        <span class="text-xs font-semibold text-slate-400">Procesado (${p.status === "active" ? "Aprobado" : "Rechazado"})</span>
                                    `
                                    }
                                </td>
                            </tr>
                        `,
                                )
                                .join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function processPayment(subId, status) {
  const res = await fetch("/api/admin/payment/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ subscription_id: subId, status }),
  });
  const data = await res.json();
  if (data.success) {
    showNotification("Pago procesado correctamente");
    loadAdminPayments();
  } else {
    showNotification(data.error || "Error al procesar", "error");
  }
}

function openGame(gameType) {
  if (!currentUser || currentUser.sub_status !== "active") {
    showNotification(
      "Acceso denegado. Debes activar tu suscripción VIP para jugar.",
      "error",
    );
    return;
  }

  const main = document.getElementById("main-content");
  if (gameType === "math") {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const answer = eval(`${num1} ${op} ${num2}`);

    main.innerHTML = `
            <div class="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20">Matemática Básica</span>
                <h3 class="text-3xl font-black py-4">¿Cuánto es ${num1} ${op} ${num2}?</h3>
                <input type="number" id="math-ans" autofocus class="w-48 text-center bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold mx-auto block focus:outline-none focus:border-indigo-500">
                <button onclick="checkMathAnswer(${answer})" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition">Comprobar Respuesta</button>
                <div><button onclick="navigateHome()" class="text-slate-400 text-sm hover:text-white transition">Regresar al Inicio</button></div>
            </div>
        `;
  } else if (gameType === "spelling") {
    main.innerHTML = `
            <div class="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20">Ortografía</span>
                <h3 class="text-xl font-bold">Completa la palabra correcta:</h3>
                <p class="text-lg text-slate-300">Elige la opción correcta: "A__er"</p>
                <div class="flex justify-center gap-4 pt-2">
                    <button onclick="checkSpelling(false)" class="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-xl transition">Haber</button>
                    <button onclick="checkSpelling(true)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition">Hacer</button>
                </div>
                <div><button onclick="navigateHome()" class="text-slate-400 text-sm hover:text-white transition">Regresar al Inicio</button></div>
            </div>
        `;
  } else if (gameType === "geo") {
    main.innerHTML = `
            <div class="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20">Geografía de Venezuela</span>
                <h3 class="text-xl font-bold">¿Cuál es la capital del Estado Lara?</h3>
                <div class="grid grid-cols-2 gap-4 pt-2">
                    <button onclick="checkGeo(false)" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">Maracaibo</button>
                    <button onclick="checkGeo(true)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">Barquisimeto</button>
                    <button onclick="checkGeo(false)" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">Valencia</button>
                    <button onclick="checkGeo(false)" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">Coro</button>
                </div>
                <div><button onclick="navigateHome()" class="text-slate-400 text-sm hover:text-white transition">Regresar al Inicio</button></div>
            </div>
        `;
  }
}

function checkMathAnswer(correct) {
  const val = parseInt(document.getElementById("math-ans").value);
  if (val === correct) {
    showNotification("¡Respuesta Correcta!");
  } else {
    showNotification(`Incorrecto. Era ${correct}`, "error");
  }
  setTimeout(navigateHome, 1800);
}

function checkSpelling(isCorrect) {
  if (isCorrect) {
    showNotification("¡Correcto!");
  } else {
    showNotification("Incorrecto.", "error");
  }
  setTimeout(navigateHome, 1800);
}

function checkGeo(isCorrect) {
  if (isCorrect) {
    showNotification("¡Correcto! Barquisimeto es la capital.");
  } else {
    showNotification("Incorrecto.", "error");
  }
  setTimeout(navigateHome, 1800);
}
