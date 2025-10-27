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

      tablero = pistaAleatoria.tableroJson
        ? JSON.parse(pistaAleatoria.tableroJson)
        : pistaAleatoria.tablero ||
          Array.from({ length: 5 }, () => Array(5).fill(0));

      registrarAccion(
        "sistema",
        "Se cargó aleatoriamente la pista: " + pistaAleatoria.nombre
      );
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
      const valor = tablero[i][j];
      celda.classList.add(valor === 1 ? "camino" : "vacio");
      if (posRobot && posRobot.fila === i && posRobot.col === j) {
        celda.classList.add("robot", `orientacion-${orientacion}`);
      }
      contenedor.appendChild(celda);
    }
  }
}

// ==========================
// MOVIMIENTOS
// ==========================
function agregarMovimiento(mov) {
  movimientos.push(mov);
  const lista = document.getElementById("lista-movimientos");
  lista.innerHTML = movimientos
    .map((m) => {
      if (m === "Adelante") return "<li>⬆️</li>";
      if (m === "Izquierda") return "<li>⬅️</li>";
      if (m === "Derecha") return "<li>➡️</li>";
      if (m === "Bucle") return "<li>🔁</li>";
    })
    .join("");
}

function ejecutar() {
  if (movimientos.length === 0) {
    document.getElementById("resultado").textContent =
      "⚠️ Agrega movimientos primero";
    return;
  }

  let i = 0;
  const intervalo = setInterval(() => {
    if (i >= movimientos.length) {
      clearInterval(intervalo);
      document.getElementById("resultado").textContent =
        "✅ Misión completada";
      return;
    }

    const mov = movimientos[i];
    switch (mov) {
      case "Adelante":
        moverAdelante();
        break;
      case "Izquierda":
        orientacion = (orientacion + 3) % 4;
        break;
      case "Derecha":
        orientacion = (orientacion + 1) % 4;
        break;
      case "Bucle":
        moverAdelante();
        moverAdelante();
        break;
    }

    renderTablero(tablero, posRobot, orientacion);
    i++;
  }, 700);
}

function moverAdelante() {
  let nuevaFila = posRobot.fila;
  let nuevaCol = posRobot.col;
  if (orientacion === 0) nuevaFila--;
  if (orientacion === 1) nuevaCol++;
  if (orientacion === 2) nuevaFila++;
  if (orientacion === 3) nuevaCol--;

  if (
    nuevaFila < 0 ||
    nuevaFila >= tablero.length ||
    nuevaCol < 0 ||
    nuevaCol >= tablero[0].length
  ) {
    document.getElementById("resultado").textContent =
      "❌ Robot fuera del tablero";
    return;
  }

  posRobot = { fila: nuevaFila, col: nuevaCol };
  renderTablero(tablero, posRobot, orientacion);
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
// REINICIAR
// ==========================
function reiniciar() {
  cargarPista();
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
      body: JSON.stringify({
        nombre,
        tablero: tableroConfig,
      }),
    });
    const msg = await res.text();
    alert(msg);
    await cargarPistasGuardadas();
    tablero = tableroConfig.map((fila) => [...fila]);
    posRobot = { ...encontrarInicio(tablero) };
    renderTablero(tablero, posRobot, orientacion);
  } catch (err) {
    console.error(err);
    alert("Error al guardar la pista");
  }
}

// ==========================
// CRUD ADMINISTRADORES
// ==========================
async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/list`);
    const usuarios = await res.json();
    const tbody = document.querySelector("#tabla-usuarios tbody");
    tbody.innerHTML = "";
    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>
          <button class="btn-editar" onclick="editarUsuario(${u.id})">✏️</button>
          <button class="btn-eliminar" onclick="eliminarUsuario(${u.id})">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// BITÁCORA Y ESTADÍSTICAS
// ==========================
async function cargarBitacora() {
  try {
    const res = await fetch(`${API_BASE_URL}/bitacora`);
    const bitacora = await res.json();
    const tbody = document.querySelector("#tabla-bitacora tbody");
    tbody.innerHTML = "";

    if (!bitacora || bitacora.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='3'>Sin registros en la bitácora</td></tr>";
      return;
    }

    bitacora.forEach((reg) => {
      const tr = document.createElement("tr");
      const fecha = new Date(reg.fechaHora).toLocaleString();
      let icono = "🟢";
      if (reg.accion.toLowerCase().includes("error")) icono = "🔴";
      else if (reg.accion.toLowerCase().includes("advertencia")) icono = "🟡";
      tr.innerHTML = `<td>${fecha}</td><td>${reg.usuario}</td><td>${icono} ${reg.accion}</td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar bitácora:", err);
  }
}

async function cargarEstadisticas() {
  try {
    const res = await fetch(`${API_BASE_URL}/estadisticas`);
    const stats = await res.json();

    document.getElementById("visitas").textContent = stats.total || 0;
    document.getElementById("exitos").textContent = stats.exitos || 0;
    document.getElementById("fallos").textContent = stats.fallos || 0;
  } catch (err) {
    console.error("Error al cargar estadísticas:", err);
  }
}

// ==========================
// PISTAS GUARDADAS
// ==========================
async function cargarPistasGuardadas() {
  try {
    const res = await fetch(`${API_BASE_URL}/pistas/list`);
    const pistas = await res.json();
    const lista = document.getElementById("lista-pistas-guardadas");
    lista.innerHTML = "";

    if (!pistas || pistas.length === 0) {
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

// ==========================
// EXPONER FUNCIONES AL HTML
// ==========================
window.agregarMovimiento = agregarMovimiento;
window.ejecutar = ejecutar;
window.reiniciar = reiniciar;
window.abrirLogin = abrirLogin;
window.login = login;
window.cerrarLogin = cerrarLogin;
window.abrirAdminPanel = abrirAdminPanel;
window.guardarPista = guardarPista;
window.borrarPista = () => {
  tableroConfig = Array.from({ length: 5 }, () => Array(5).fill(0));
  renderTableroConfig();
};
window.exportarPista = () => {
  const data = JSON.stringify(tableroConfig, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pista.json";
  a.click();
  URL.revokeObjectURL(url);
};
window.cargarDesdeArchivo = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    tableroConfig = JSON.parse(text);
    renderTableroConfig();
  };
  input.click();
};

// ==========================
// INICIO
// ==========================
window.addEventListener("load", () => {
  document.body.classList.add("dark-mode");
  cargarPista();
  cargarEstadisticas();
});
