// ==========================
// VARIABLES GLOBALES
// ==========================
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

  fetch("http://localhost:8080/api/admin/login", {
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
// ==========================
// TABLERO PRINCIPAL (Pista aleatoria)
// ==========================
async function cargarPista() {
  try {
    // 🔹 Obtener todas las pistas
    const res = await fetch("http://localhost:8080/api/pistas/list");
    const pistas = await res.json();

    if (!pistas || pistas.length === 0) {
      console.warn("No hay pistas disponibles, se cargará una vacía.");
      tablero = Array.from({ length: 5 }, () => Array(5).fill(0));
      tablero[0][0] = 1;
      tablero[4][4] = 1;
    } else {
      // 🔹 Elegir una pista aleatoria
      const pistaAleatoria = pistas[Math.floor(Math.random() * pistas.length)];

      console.log("🎲 Pista aleatoria seleccionada:", pistaAleatoria.nombre);

      tablero = pistaAleatoria.tableroJson
        ? JSON.parse(pistaAleatoria.tableroJson)
        : pistaAleatoria.tablero ||
          Array.from({ length: 5 }, () => Array(5).fill(0));

      // Registrar en bitácora
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
    mostrarResultado("⚠️ Agrega movimientos primero", "warning");
    return;
  }

  let i = 0;
  const intervalo = setInterval(() => {
    if (i >= movimientos.length) {
      clearInterval(intervalo);

      if (JSON.stringify(posRobot) !== JSON.stringify(fin)) {
        mostrarResultado("❌ No llegaste al final", "error");
        return;
      }
      if (!recorrioTodaLaPista()) {
        mostrarResultado("⚠️ No recorriste toda la pista", "warning");
        return;
      }
      mostrarResultado("✅ Misión completada con éxito", "success");
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
    mostrarResultado("❌ Robot fuera del tablero", "error");
    return;
  }

  posRobot = { fila: nuevaFila, col: nuevaCol };
  posicionesVisitadas.push(JSON.stringify(posRobot));

  if (tablero[nuevaFila][nuevaCol] !== 1) {
    mostrarResultado("❌ Robot salió del camino", "error");
  }
}

function recorrioTodaLaPista() {
  const celdas = [];
  for (let i = 0; i < tablero.length; i++)
    for (let j = 0; j < tablero[i].length; j++)
      if (tablero[i][j] === 1) celdas.push(JSON.stringify({ fila: i, col: j }));
  return celdas.every((celda) => posicionesVisitadas.includes(celda));
}

function mostrarResultado(mensaje, tipo) {
  const resultado = document.getElementById("resultado");
  resultado.textContent = mensaje;

  switch (tipo) {
    case "success":
      resultado.style.color = "#00ff88";
      registrarAccion("admin", "Misión completada con éxito");
      break;
    case "error":
      resultado.style.color = "#ff4d4d";
      registrarAccion("admin", "Error: " + mensaje);
      break;
    case "warning":
      resultado.style.color = "#ffcc00";
      registrarAccion("admin", "Advertencia: " + mensaje);
      break;
  }

  cargarEstadisticas();
}

// ==========================
// REGISTRO EN BITÁCORA
// ==========================
async function registrarAccion(usuario, accion) {
  try {
    await fetch("http://localhost:8080/api/bitacora", {
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
    const res = await fetch("http://localhost:8080/api/pistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        tablero: tableroConfig, // ✅ se envía correctamente al backend
      }),
    });
    const msg = await res.text();
    alert(msg);
    await cargarPistasGuardadas(); // ✅ refresca la lista lateral
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
    const res = await fetch("http://localhost:8080/api/admin/list");
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
// BITÁCORA
// ==========================
async function cargarBitacora() {
  try {
    const res = await fetch("http://localhost:8080/api/bitacora");
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

// ==========================
// ESTADÍSTICAS
// ==========================
async function cargarEstadisticas() {
  try {
    const res = await fetch("http://localhost:8080/api/estadisticas");
    const stats = await res.json();

    const total = stats.total || 0;
    const exitos = stats.exitos || 0;
    const fallos = stats.fallos || 0;

    document.getElementById("visitas").textContent = total;
    document.getElementById("exitos").textContent = exitos;
    document.getElementById("fallos").textContent = fallos;

    const ctx = document
      .getElementById("grafico-estadisticas")
      .getContext("2d");
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Visitas", "Éxitos", "Fallos"],
        datasets: [
          {
            data: [total, exitos, fallos],
            backgroundColor: ["#007bff", "#00cc66", "#ff4444"],
            borderColor: "#111",
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Estadísticas del Sistema",
            color: "#fff",
            font: { size: 18 },
          },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: {
            beginAtZero: true,
            ticks: { color: "#ccc" },
            grid: { color: "#333" },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error al cargar estadísticas:", err);
  }
}

// ==========================
// PISTAS GUARDADAS (ADMIN)
// ==========================
async function cargarPistasGuardadas() {
  try {
    const res = await fetch("http://localhost:8080/api/pistas/list");
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
    const res = await fetch(`http://localhost:8080/api/pistas/${id}`);
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

function exportarPista() {
  const data = JSON.stringify(tableroConfig, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pista.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function cargarDesdeArchivo() {
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
}

// ==========================
// INICIO Y MODO OSCURO
// ==========================
window.addEventListener("load", () => {
  document.body.classList.add("dark-mode");
  cargarPista();
  cargarEstadisticas();
});

// ==========================
// ABRIR CONFIGURACIÓN (ADMIN)
// ==========================
function abrirConfiguracionReal() {
  document.getElementById("panel-configuracion").style.display = "block";
  tableroConfig = tablero.map((fila) => [...fila]);
  renderTableroConfig();
  cargarPistasGuardadas(); // ✅ muestra lista lateral
}
