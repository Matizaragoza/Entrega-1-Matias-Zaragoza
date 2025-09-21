"use strict";

/* ============================================================
   Simulador de Ventas & Stock — DOM Interactivo Golden Crowz
   ============================================================ */

// ====== Datos y constantes ======
const IVA = 0.21;

const CATALOGO = [
  { codigo: 101, nombre: "Zapatillas Nike Air Force", precio: 55000, stock: 10 },
  { codigo: 102, nombre: "Zapatillas Adidas yeezy",     precio: 48000, stock: 10 },
  { codigo: 201, nombre: "Remera Levis D2 Dry-Fit",        precio: 22000, stock: 10 },
  { codigo: 301, nombre: "Perfume Bross London GOLD",         precio: 35000, stock: 10 },
];

let carrito = []; // items: { codigo, nombre, precio, cantidad }

// ====== Utilidades ======
function monedaARS(n) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function inputToInteger(str) {
  if (typeof str !== "string" && typeof str !== "number") return NaN;
  const limpio = String(str).trim();
  if (!/^\d+$/.test(limpio)) return NaN;
  return Number(limpio);
}

// ====== Lógica del carrito ======
function buscarProductoPorCodigo(codigo) {
  return CATALOGO.find(p => p.codigo === codigo) || null;
}

function agregarAlCarritoDOM(codigo) {
  const producto = buscarProductoPorCodigo(codigo);
  const inputValor = document.getElementById(`cant-${codigo}`).value;
  const cantidad = inputToInteger(inputValor);

  if (!producto || Number.isNaN(cantidad) || cantidad < 1 || cantidad > producto.stock) {
    alert("Cantidad inválida o stock insuficiente");
    return;
  }

  // Restar del stock
  producto.stock -= cantidad;

  // Agregar o actualizar en carrito
  const existente = carrito.find(i => i.codigo === codigo);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ ...producto, cantidad });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));

  // Actualizar DOM
  mostrarResumenDOM();
  mostrarCatalogoDOM();
}
 

// ====== Cálculos ======
function calcularSubtotal(items) {
  return items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
}

function calcularIVA(base, tasa) {
  return base * tasa;
}

function calcularTotales(subtotal, descuento, envioCosto) {
  const baseImponible = subtotal - descuento;
  const iva = calcularIVA(baseImponible, IVA);
  const total = baseImponible + iva + envioCosto;
  return { baseImponible, iva, total };
}

// ====== Cupones ======
function evaluarCupon(cup, subtotal) {
  if (!cup) return { aplicable: false, descuento: 0, etiqueta: "Sin cupón" };
  if (cup === "ZAPA10") {
    if (subtotal >= 50000) return { aplicable: true, descuento: subtotal * 0.10, etiqueta: "ZAPA10 (-10%)" };
    return { aplicable: false, descuento: 0, etiqueta: "ZAPA10 (no aplica: mínimo $50.000)" };
  }
  if (cup === "MB5") return { aplicable: true, descuento: subtotal * 0.05, etiqueta: "MB5 (-5%)" };
  return { aplicable: false, descuento: 0, etiqueta: `Cupón inválido: ${cup}` };
}

function calcularDescuentoMultiple(subtotal, cupones) {
  const DESCUENTO_MAXIMO_RATIO = 0.5; // 50% tope
  let totalDescuento = 0;
  const etiquetas = [];

  for (const c of cupones) {
    const res = evaluarCupon(c, subtotal);
    etiquetas.push(res.etiqueta);
    if (res.aplicable) totalDescuento += res.descuento;
  }

  const maxPermitido = subtotal * DESCUENTO_MAXIMO_RATIO;
  if (totalDescuento > maxPermitido) {
    totalDescuento = maxPermitido;
    etiquetas.push("Descuento limitado al 50% (seguridad)");
  }

  return { descuento: totalDescuento, etiquetas };
}

// ====== DOM: Mostrar catálogo ======
function mostrarCatalogoDOM() {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  CATALOGO.forEach(producto => {
    const div = document.createElement("div");
    div.className = "producto";
    div.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Precio: ${monedaARS(producto.precio)}</p>
      <p>Stock: ${producto.stock}</p>
      <input type="number" min="1" max="${producto.stock}" id="cant-${producto.codigo}" placeholder="Cantidad">
      <button data-codigo="${producto.codigo}">Agregar al carrito</button>
    `;
    contenedor.appendChild(div);
  });

  contenedor.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      const codigo = Number(e.target.dataset.codigo);
      agregarAlCarritoDOM(codigo);
    });
  });
}

// ====== DOM: Mostrar resumen parcial ======
function mostrarResumenDOM() {
  const contenedor = document.getElementById("resumen");
  contenedor.innerHTML = "";
  if (!carrito.length) return;

  const subtotal = calcularSubtotal(carrito);
  carrito.forEach(item => {
    contenedor.innerHTML += `<p>${item.nombre} x${item.cantidad} = ${monedaARS(item.precio * item.cantidad)}</p>`;
  });
  contenedor.innerHTML += `<hr><p>Subtotal: ${monedaARS(subtotal)}</p>`;
}

// ====== DOM: Mostrar resumen final ======
function mostrarResumenDOMFinal(info) {
  const contenedor = document.getElementById("resumen");
  contenedor.innerHTML = "";
  if (!carrito.length) {
    contenedor.innerHTML = "<p>Carrito vacío.</p>";
    return;
  }
  carrito.forEach(item => {
    const sub = item.precio * item.cantidad;
    contenedor.innerHTML += `<p>${item.nombre} x${item.cantidad} = ${monedaARS(sub)}</p>`;
  });
  contenedor.innerHTML += `
    <hr>
    <p>Subtotal: ${monedaARS(info.subtotal)}</p>
    <p>Descuento: ${monedaARS(info.descuento)} (${info.etiquetas.join(" | ")})</p>
    <p>Envío: ${info.envio.etiqueta} → ${monedaARS(info.envio.costo)}</p>
    <p>Base imponible: ${monedaARS(info.baseImponible)}</p>
    <p>IVA: ${monedaARS(info.iva)}</p>
    <p><strong>Total: ${monedaARS(info.total)}</strong></p>
  `;
}

// ====== Inicialización ======
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar catálogo al iniciar
  mostrarCatalogoDOM();

  // Botón de finalizar compra
  document.getElementById("finalizarCompra").addEventListener("click", () => {
    if (!carrito.length) {
      alert("No agregaste productos al carrito.");
      return;
    }

    // Cupones
    const rawCupones = document.getElementById("inputCupones").value;
    let cupones = rawCupones.split(",").map(c => c.trim().toUpperCase()).filter(Boolean);
    if (cupones.length > 2) cupones = cupones.slice(0, 2);

    // Subtotal y descuentos
    const subtotal = calcularSubtotal(carrito);
    const { descuento, etiquetas } = calcularDescuentoMultiple(subtotal, cupones);

    // Envío
    const envioCosto = Number(document.getElementById("selectEnvio").value);
    const envioEtiqueta = envioCosto === 0 ? "Retiro en local (gratis)" : "Envío estándar";

    // Totales
    const { baseImponible, iva, total } = calcularTotales(subtotal, descuento, envioCosto);

    // Construir resumen para alert
    const lineasItems = carrito.map(i => `• ${i.nombre} x${i.cantidad} = ${monedaARS(i.precio * i.cantidad)}`).join("\n");

    const resumenTexto = 
      `¡Gracias por tu compra!\n\n` +
      `Resumen de compra:\n${lineasItems}\n\n` +
      `Subtotal: ${monedaARS(subtotal)}\n` +
      `Descuento: -${monedaARS(descuento)} (${etiquetas.join(" | ") || "Sin cupones"})\n` +
      `Envío: ${envioEtiqueta} → ${monedaARS(envioCosto)}\n` +
      `Base imponible: ${monedaARS(baseImponible)}\n` +
      `IVA (21%): ${monedaARS(iva)}\n` +
      `TOTAL A PAGAR: ${monedaARS(total)}`;

    alert(resumenTexto);

    // Confirmar compra
    const confirmar = confirm("¿Deseas confirmar la compra?");
    if (confirmar) {
      alert("¡Compra confirmada! Gracias por tu compra.");
      carrito = [];
      localStorage.removeItem("carrito");
      mostrarResumenDOMFinal({
        subtotal: 0,
        descuento: 0,
        etiquetas,
        envio: { costo: 0, etiqueta: "N/A" },
        baseImponible: 0,
        iva: 0,
        total: 0
      });
      mostrarCatalogoDOM();
    } else {
      alert("Compra cancelada. Podés seguir agregando productos.");
    }
  });
});