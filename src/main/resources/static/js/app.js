// ==========================
// VARIABLES GLOBALES
// ==========================
const API_BASE_URL = "https://guali-production.up.railway.app/api";

let movimientos = [];
let tablero = [];
let tableroConfig = [];
let posRobot = { fila: 0, col: 0 };
let posicionesVisitadas = [];
let inicio = null;
let fin = null;
let grafico = null;
let orientacion = 1; // 0=arriba, 1=derecha, 2=abajo, 3=izquierda

// ==========================
// LOGIN
// ==========================
function abrirLogin() {
  document.getElementById("login-modal").style.display = "flex";
}

function cerrarLogin() {
  document.getElementById("login-modal").style.display = "none";
}

function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(async (res) => {
      const text = await res.text();
      if (res.ok) {
        alert(text);
        cerrarLogin();
        document.getElementById("btn-admin").style.display = "inline-block";
        abrirConfiguracionReal();
      } else {
        alert(text);
      }
    })
    .catch(() => alert("Error al conectar con el servidor"));
}

// ==========================
// PANEL DE ADMINISTRACIÓN
// ==========================
function abrirAdminPanel() {
  document.getElementById("admin-panel").style.display = "block";
  mostrarTab("usuarios");
  cargarUsuarios();
  cargarBitacora();
  setTimeout(cargarEstadisticas, 500);
}

function mostrarTab(tabName) {
  ["usuarios", "bitacora", "estadisticas"].forEach((name) => {
    const el = document.getElementById(name + "-tab");
    if (el) el.style.display = name === tabName ? "block" : "none";
  });
}

// ==========================
// TABLERO PRINCIPAL
// ==========================
async function cargarPista() {
  try {
    const res = await fetch(`${API_BASE_URL}/pistas/list`);
    const pistas = await res.json();

    if (!pistas || pistas.length === 0) {
      console.warn("No hay pistas disponibles, se cargará una vacía.");
      tablero = Array.from({ length: 5 }, () => Array(5).fill(0));
      tablero[0][0] = 1;
      tablero[4][4] = 1;
    } else {
      const pistaAleatoria = pistas[Math.floor(Math.random() * pistas.length)];
      console.log("🎲 Pista aleatoria seleccionada:", pistaAleatoria.nombre);

      const jsonData = pistaAleatoria.tableroJson?.replace(/^'|'$/g, "");
      tablero = JSON.parse(jsonData || pistaAleatoria.tablero || "[]");

      registrarAccion("sistema", "Se cargó la pista: " + pistaAleatoria.nombre);
    }

    inicio = encontrarInicio(tablero);
    fin = encontrarFin(tablero);
    posRobot = { ...inicio };
    orientacion = 2;
    movimientos = [];
    posicionesVisitadas = [JSON.stringify(posRobot)];
    document.getElementById("lista-movimientos").innerHTML = "";
    document.getElementById("resultado").textContent = "";
    renderTablero(tablero, posRobot, orientacion);
  } catch (err) {
    console.error("Error al cargar la pista:", err);
    document.getElementById("resultado").textContent =
      "⚠️ Error al cargar la pista desde el servidor.";
  }
}

function encontrarInicio(tab) {
  for (let i = 0; i < tab.length; i++)
    for (let j = 0; j < tab[i].length; j++)
      if (tab[i][j] === 1) return { fila: i, col: j };
  return { fila: 0, col: 0 };
}

function encontrarFin(tab) {
  for (let i = tab.length - 1; i >= 0; i--)
    for (let j = tab[i].length - 1; j >= 0; j--)
      if (tab[i][j] === 1) return { fila: i, col: j };
  return { fila: tab.length - 1, col: tab[0].length - 1 };
}

function renderTablero(tablero, posRobot, orientacion) {
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";

  for (let i = 0; i < tablero.length; i++) {
    for (let j = 0; j < tablero[i].length; j++) {
      const celda = document.createElement("span");
      celda.classList.add(tablero[i][j] === 1 ? "camino" : "vacio");
      if (posRobot.fila === i && posRobot.col === j) {
        celda.classList.add("robot", `orientacion-${orientacion}`);
      }
      contenedor.appendChild(celda);
    }
  }
}

// ==========================
// BITÁCORA
// ==========================
async function registrarAccion(usuario, accion) {
  try {
    await fetch(`${API_BASE_URL}/bitacora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, accion }),
    });
  } catch (err) {
    console.error("Error al registrar en bitácora:", err);
  }
}

// ==========================
// CONFIGURACIÓN DE PISTA
// ==========================
function renderTableroConfig() {
  const div = document.getElementById("tablero-config");
  div.innerHTML = "";
  tableroConfig.forEach((fila, i) => {
    fila.forEach((celda, j) => {
      const cell = document.createElement("span");
      cell.className = celda === 1 ? "camino" : "vacio";
      cell.onclick = () => {
        tableroConfig[i][j] = tableroConfig[i][j] === 1 ? 0 : 1;
        renderTableroConfig();
      };
      div.appendChild(cell);
    });
  });
}

async function guardarPista() {
  const nombre = prompt("Nombre de la pista:");
  if (!nombre) return alert("Debes dar un nombre a la pista.");

  try {
    const res = await fetch(`${API_BASE_URL}/pistas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, tablero: tableroConfig }),
    });
    alert(await res.text());
    await cargarPistasGuardadas();
  } catch (err) {
    console.error(err);
    alert("Error al guardar la pista");
  }
}

async function cargarPistasGuardadas() {
  try {
    const res = await fetch(`${API_BASE_URL}/pistas/list`);
    const pistas = await res.json();
    const lista = document.getElementById("lista-pistas-guardadas");
    lista.innerHTML = "";

    if (!pistas.length) {
      lista.innerHTML = "<li style='opacity:0.7;'>Sin pistas guardadas</li>";
      return;
    }

    pistas.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.nombre;
      li.onclick = () => cargarPistaGuardada(p.id);
      lista.appendChild(li);
    });
  } catch (err) {
    console.error("Error al cargar pistas guardadas:", err);
  }
}

async function cargarPistaGuardada(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/pistas/${id}`);
    const pista = await res.json();
    tableroConfig = pista.tablero || JSON.parse(pista.tableroJson);
    renderTableroConfig();
    alert(`✅ Pista "${pista.nombre}" cargada con éxito`);
  } catch (err) {
    console.error("Error al cargar pista seleccionada:", err);
  }
}

function borrarPista() {
  tableroConfig = Array.from({ length: 5 }, () => Array(5).fill(0));
  renderTableroConfig();
}

function abrirConfiguracionReal() {
  document.getElementById("panel-configuracion").style.display = "block";
  tableroConfig = tablero.length
    ? tablero.map((fila) => [...fila])
    : Array.from({ length: 5 }, () => Array(5).fill(0));
  renderTableroConfig();
  cargarPistasGuardadas();
}

// ==========================
// CRUD ADMINISTRADORES
// ==========================
async function guardarUsuario() {
  const id = document.getElementById("user-id").value;
  const username = document.getElementById("username-admin").value;
  const email = document.getElementById("email-admin").value;
  const password = document.getElementById("password-admin").value;

  if (!username || !email || !password)
    return alert("Completa todos los campos");

  const method = id ? "PUT" : "POST";
  const url = id
    ? `${API_BASE_URL}/admin/update/${id}`
    : `${API_BASE_URL}/admin/register`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) throw new Error("Error al guardar usuario");

    alert(id ? "Usuario actualizado correctamente" : "Usuario registrado");
    await cargarUsuarios();
    cancelarEdicion();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar usuario");
  }
}

async function editarUsuario(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/${id}`);
    const user = await res.json();

    document.getElementById("user-id").value = user.id;
    document.getElementById("username-admin").value = user.username;
    document.getElementById("email-admin").value = user.email;
    document.getElementById("password-admin").value = "";
    document.getElementById("cancel-btn").style.display = "inline-block";
  } catch (err) {
    console.error(err);
    alert("Error al cargar datos del usuario");
  }
}

async function eliminarUsuario(id) {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/admin/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar usuario");
    alert("Usuario eliminado correctamente");
    await cargarUsuarios();
  } catch (err) {
    console.error(err);
    alert("❌ Error al eliminar usuario");
  }
}

function cancelarEdicion() {
  document.getElementById("user-id").value = "";
  document.getElementById("username-admin").value = "";
  document.getElementById("email-admin").value = "";
  document.getElementById("password-admin").value = "";
  document.getElementById("cancel-btn").style.display = "none";
}

// ==========================
// INICIO
// ==========================
window.addEventListener("load", () => {
  document.body.classList.add("dark-mode");
  cargarPista();
  cargarEstadisticas();
});
