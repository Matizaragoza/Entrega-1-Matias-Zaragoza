"use strict";

const IVA = 0.21;
const CATALOGO = [
  { codigo: 101, nombre: "Zapatillas Nike Air Force", precio: 55000, stock: 10 },
  { codigo: 102, nombre: "Zapatillas Adidas Yeezy", precio: 48000, stock: 10 },
  { codigo: 201, nombre: "Remera Levis D2 Dry-Fit", precio: 22000, stock: 10 },
  { codigo: 301, nombre: "Perfume Bross London GOLD", precio: 35000, stock: 10 },
];

let carrito = [];

const monedaARS = n => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const inputToInteger = str => /^\d+$/.test(String(str).trim()) ? Number(str) : NaN;
const buscarProductoPorCodigo = codigo => CATALOGO.find(p => p.codigo === codigo) || null;

// ====== Carrito ======
function agregarAlCarrito(codigo) {
  const producto = buscarProductoPorCodigo(codigo);
  const cantidad = inputToInteger(document.getElementById(`cant-${codigo}`).value);

  if (!producto || Number.isNaN(cantidad) || cantidad < 1 || cantidad > producto.stock) {
    Swal.fire("Cantidad inválida o stock insuficiente");
    return;
  }

  producto.stock -= cantidad;
  const existente = carrito.find(i => i.codigo === codigo);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ ...producto, cantidad });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarResumen();
  mostrarCatalogo();
}

// ====== Cálculos ======
const calcularSubtotal = items => items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
const calcularIVA = base => base * IVA;
const calcularTotales = (subtotal, descuento, envioCosto) => {
  const baseImponible = subtotal - descuento;
  const iva = calcularIVA(baseImponible);
  const total = baseImponible + iva + envioCosto;
  return { baseImponible, iva, total };
};

function evaluarCupon(cup, subtotal) {
  if (!cup) return { aplicable: false, descuento: 0, etiqueta: "Sin cupón" };
  if (cup === "ZAPA10" && subtotal >= 50000) return { aplicable: true, descuento: subtotal * 0.1, etiqueta: "ZAPA10 (-10%)" };
  if (cup === "MB5") return { aplicable: true, descuento: subtotal * 0.05, etiqueta: "MB5 (-5%)" };
  return { aplicable: false, descuento: 0, etiqueta: `Cupón inválido: ${cup}` };
}

function calcularDescuentoMultiple(subtotal, cupones) {
  const DESCUENTO_MAXIMO = subtotal * 0.5;
  let totalDescuento = 0;
  const etiquetas = [];

  for (const c of cupones) {
    const res = evaluarCupon(c, subtotal);
    etiquetas.push(res.etiqueta);
    if (res.aplicable) totalDescuento += res.descuento;
  }

  if (totalDescuento > DESCUENTO_MAXIMO) {
    totalDescuento = DESCUENTO_MAXIMO;
    etiquetas.push("Descuento limitado al 50%");
  }

  return { descuento: totalDescuento, etiquetas };
}

// ====== DOM ======
function mostrarCatalogo() {
  const cont = document.getElementById("catalogo");
  cont.innerHTML = "";

  CATALOGO.forEach(prod => {
    const div = document.createElement("div");
    div.className = "producto";
    div.innerHTML = `
      <h3>${prod.nombre}</h3>
      <p>Precio: ${monedaARS(prod.precio)}</p>
      <p>Stock: ${prod.stock}</p>
      <input type="number" min="1" max="${prod.stock}" id="cant-${prod.codigo}" placeholder="Cantidad">
      <button data-codigo="${prod.codigo}">Agregar</button>
    `;
    cont.appendChild(div);
  });

  cont.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => agregarAlCarrito(Number(e.target.dataset.codigo)));
  });
}

function mostrarResumen() {
  const cont = document.getElementById("resumen");
  cont.innerHTML = "";
  if (!carrito.length) {
    cont.innerHTML = "<p>El carrito está vacío.</p>";
    return;
  }
  const subtotal = calcularSubtotal(carrito);
  carrito.forEach(item => {
    cont.innerHTML += `<p>${item.nombre} x${item.cantidad} = ${monedaARS(item.precio * item.cantidad)}</p>`;
  });
  cont.innerHTML += `<hr><p><strong>Subtotal: ${monedaARS(subtotal)}</strong></p>`;
}

// ====== Inicialización ======
document.addEventListener("DOMContentLoaded", () => {
  const nombreGuardado = localStorage.getItem("nombreCliente");
  if (nombreGuardado) document.getElementById("nombreCliente").value = nombreGuardado;

  Swal.fire({
    title: "Bienvenido 👟",
    text: "Golden Crowz Snakers — Simulador de Ventas",
    icon: "info",
    confirmButtonText: "Comenzar"
  });

  mostrarCatalogo();

  document.getElementById("nombreCliente").addEventListener("input", e => {
    localStorage.setItem("nombreCliente", e.target.value);
  });

  document.getElementById("iniciarCompra").addEventListener("click", () => {
    const nombre = document.getElementById("nombreCliente").value.trim();
    if (!nombre) {
      Swal.fire("Por favor ingresá tu nombre para continuar.");
      return;
    }
    Swal.fire(`¡Hola ${nombre}! Empezá tu compra 😄`);
  });

  document.getElementById("finalizarCompra").addEventListener("click", () => {
    if (!carrito.length) {
      Swal.fire("Tu carrito está vacío.");
      return;
    }

    const rawCupones = document.getElementById("inputCupones").value;
    let cupones = rawCupones.split(",").map(c => c.trim().toUpperCase()).filter(Boolean);
    if (cupones.length > 2) cupones = cupones.slice(0, 2);

    const subtotal = calcularSubtotal(carrito);
    const { descuento, etiquetas } = calcularDescuentoMultiple(subtotal, cupones);
    const envioCosto = Number(document.getElementById("selectEnvio").value);
    const { baseImponible, iva, total } = calcularTotales(subtotal, descuento, envioCosto);

    Swal.fire({
      title: "¿Confirmar compra?",
      html: `
        <b>Subtotal:</b> ${monedaARS(subtotal)}<br>
        <b>Descuento:</b> ${monedaARS(descuento)} (${etiquetas.join(", ")})<br>
        <b>Envío:</b> ${monedaARS(envioCosto)}<br>
        <b>Total final:</b> ${monedaARS(total)}
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire("Compra confirmada 🎉", "Gracias por elegir Golden Crowz", "success");
        carrito = [];
        localStorage.removeItem("carrito");
        mostrarResumen();
        mostrarCatalogo();
      }
    });
  });
});