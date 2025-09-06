"use strict";

/* ============================================================
   Simulador de Ventas & Stock — Entregable 1 (Zaragoza)
   - Entrada de datos: prompt/confirm (nombre, productos, cantidades, cupón, envío)
   - Procesamiento: búsqueda en catálogo, control de stock, cálculos (subtotal, descuento, IVA, total)
   - Salida: console.log/console.table y alert con resumen final
   - Algoritmos: condicionales (if/else), ciclos (while, do..while), arrays y métodos (find, push, reduce)
   ============================================================ */

// ====== Datos y constantes (variables, constantes y arrays) ======
const IVA = 0.21; // 21% Argentina
const COSTO_ENVIO = 5000;

const CATALOGO = [
  { codigo: 101, nombre: "Zapatillas Runner Pro", precio: 55000, stock: 6 },
  { codigo: 102, nombre: "Zapatillas Street",     precio: 48000, stock: 3 },
  { codigo: 201, nombre: "Remera Dry-Fit",        precio: 22000, stock: 10 },
  { codigo: 301, nombre: "Perfume Urban",         precio: 35000, stock: 4 },
];

let carrito = []; // items: { codigo, nombre, precio, cantidad }

// ====== Utilidades (formateo y validaciones) ======
function monedaARS(n) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function esEnteroPositivo(n) {
  return Number.isInteger(n) && n > 0;
}

// ====== Funciones de ENTRADA ======
function pedirDatosCliente() {
  const nombre = (prompt("¡Bienvenido! ¿Cómo te llamás?") || "Cliente").trim();
  return { nombre: nombre || "Cliente" };
}

function pedirCodigoProducto() {
  const entrada = prompt(
    "Ingresá el CÓDIGO del producto.\n" +
    "Escribí LISTA para ver el catálogo\n" +
    "o Cancelar para salir."
  );
  if (entrada === null) return null;

  const limpio = entrada.trim().toUpperCase();

  if (limpio === "LISTA") {
    console.log("[DEBUG] Usuario pidió LISTA");
    mostrarCatalogo();               // imprime y además muestra alert
    return pedirCodigoProducto();    // vuelve a pedir el código
  }

  const codigo = Number(limpio);
  if (Number.isNaN(codigo)) {
    alert("Ingresá un número de código válido.");
    return pedirCodigoProducto();
  }
  return codigo;
}

function pedirCantidad(stockDisponible) {
  const entrada = prompt(
    `¿Qué cantidad querés? (stock disponible: ${stockDisponible})`
  );
  if (entrada === null) return null;
  const cant = Number(entrada);
  if (!esEnteroPositivo(cant)) {
    alert("Cantidad inválida. Ingresá un entero mayor a 0.");
    return pedirCantidad(stockDisponible);
  }
  if (cant > stockDisponible) {
    alert("No hay tanto stock disponible. Elegí una cantidad menor.");
    return pedirCantidad(stockDisponible);
  }
  return cant;
}

function pedirCupon() {
  const cup = prompt(
    '¿Tenés cupón de descuento?\nIngresá "ZAPA10" para 10% (aplica desde $50.000 de subtotal)\nO dejá vacío para continuar.'
  );
  if (cup === null) return "";
  return cup.trim().toUpperCase();
}

function deseaSeguirComprando() {
  return confirm("¿Querés agregar otro producto?");
}

// ====== Funciones de PROCESAMIENTO ======
function buscarProductoPorCodigo(codigo) {
  return CATALOGO.find(p => p.codigo === codigo) || null;
}

function agregarAlCarrito(producto, cantidad) {
  // Control de stock
  if (cantidad > producto.stock) {
    alert("Stock insuficiente.");
    return false;
  }

  // Restar del stock del catálogo
  producto.stock -= cantidad;

  
  const existente = carrito.find(i => i.codigo === producto.codigo);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad
    });
  }

  console.log(
    `✔️ Agregado: ${producto.nombre} x${cantidad} — Subtotal ítem: ${monedaARS(producto.precio * cantidad)}`
  );
  return true;
}

function calcularSubtotal(items) {
  let subtotal = 0;
  for (const it of items) {
    subtotal += it.precio * it.cantidad; 
  }
  return subtotal;
}

function calcularDescuento(subtotal, cupon) {
  let descuento = 0;
  let etiqueta = "Sin cupón";

  if (cupon === "ZAPA10") {
    if (subtotal >= 50000) {
      descuento = subtotal * 0.10;
      etiqueta = "ZAPA10 (-10%)";
    } else {
      etiqueta = "ZAPA10 (no aplica: mínimo $50.000)";
    }
  } else if (cupon && cupon !== "") {
    etiqueta = "Cupón inválido";
  }

  return { descuento, etiqueta };
}

function calcularIVA(base, tasa) {
  return base * tasa;
}

function elegirEnvio() {
  
  let opcion;
  do {
    const entrada = prompt(
      "Elegí método de entrega:\n" +
      "1) Retiro en local (sin cargo)\n" +
      `2) Envío estándar (${monedaARS(COSTO_ENVIO)})`
    );
    if (entrada === null) {
     
      return { costo: 0, etiqueta: "Retiro en local (sin cargo)" };
    }
    opcion = Number(entrada);
    if (opcion === 1) return { costo: 0, etiqueta: "Retiro en local (sin cargo)" };
    if (opcion === 2) return { costo: COSTO_ENVIO, etiqueta: "Envío estándar" };
    alert("Opción inválida. Elegí 1 o 2.");
  } while (true);
}

// ====== Funciones de SALIDA ======
function mostrarCatalogo() {
  try {
    const tabla = CATALOGO.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      precio: monedaARS(p.precio),
      stock: p.stock
    }));

    // IMPORTANTE: nada de console.clear() acá
    console.log("=== Catálogo (" + new Date().toLocaleTimeString() + ") ===");
    console.table(tabla);

    // Además del console.table, muestro un resumen en ALERT
    const resumen = tabla
      .map(t => `${t.codigo} — ${t.nombre} — ${t.precio} — stock: ${t.stock}`)
      .join('\n');

    alert(
      "Catálogo (resumen):\n" +
      resumen +
      "\n\nTabla completa en consola: F12 → Console."
    );
  } catch (e) {
    console.error("Error al mostrar catálogo:", e);
    alert("Error al mostrar catálogo: " + e.message);
  }
}

function mostrarResumen(cliente, items, info) {
  const detalleTabla = items.map(i => ({
    codigo: i.codigo,
    nombre: i.nombre,
    cantidad: i.cantidad,
    "precio unitario": monedaARS(i.precio),
    subtotal: monedaARS(i.precio * i.cantidad)
  }));

  console.log("=== Carrito final ===");
  console.table(detalleTabla);

  console.log(`Subtotal: ${monedaARS(info.subtotal)}`);
  console.log(`Descuento (${info.etiquetaDescuento}): -${monedaARS(info.descuento)}`);
  console.log(`Envío (${info.envio.etiqueta}): ${monedaARS(info.envio.costo)}`);
  console.log(`IVA (21% sobre base neta): ${monedaARS(info.iva)}`);
  console.log(`TOTAL: ${monedaARS(info.total)}`);

  alert(
    `¡Gracias, ${cliente.nombre}!\n\n` +
    `Resumen de compra:\n` +
    `• Ítems: ${items.length}\n` +
    `• Subtotal: ${monedaARS(info.subtotal)}\n` +
    `• Descuento (${info.etiquetaDescuento}): -${monedaARS(info.descuento)}\n` +
    `• Envío: ${info.envio.etiqueta} → ${monedaARS(info.envio.costo)}\n` +
    `• IVA (21%): ${monedaARS(info.iva)}\n` +
    `——————————————\n` +
    `TOTAL A PAGAR: ${monedaARS(info.total)}`
  );
}

// ====== Punto de entrada ======
function main() {
  alert(
    "Bienvenido al Simulador de Ventas & Stock de Golden Crowz Snakers.\n"
  );

  if (!confirm("¿Querés iniciar una compra?")) {
    alert("¡Gracias por visitar! Podés recargar la página cuando quieras.");
    return;
  }

  const cliente = pedirDatosCliente();

  // Bucle principal de compra
  let seguir = true;
  while (seguir) {
    const codigo = pedirCodigoProducto();
    if (codigo === null) break; // usuario canceló

    const producto = buscarProductoPorCodigo(codigo);
    if (!producto) {
      alert("Código inexistente. Usá LISTA para ver el catálogo.");
      continue;
    }

    if (producto.stock === 0) {
      alert("Ese producto no tiene stock disponible en este momento.");
      continue;
    }

    const cantidad = pedirCantidad(producto.stock);
    if (cantidad === null) {
      // Si canceló al pedir cantidad, volvemos a preguntar otro producto
      seguir = deseaSeguirComprando();
      continue;
    }

    const ok = agregarAlCarrito(producto, cantidad);
    if (!ok) continue;

    seguir = deseaSeguirComprando();
  }

  if (carrito.length === 0) {
    alert("No agregaste productos al carrito. ¡Hasta la próxima!");
    return;
  }
 

  const subtotal = calcularSubtotal(carrito);
  const cupon = pedirCupon();
  const { descuento, etiqueta } = calcularDescuento(subtotal, cupon);
  const envio = elegirEnvio();

  // Por simplicidad, el IVA se calcula sobre la base neta de productos (subtotal - descuento).
  const baseImponible = subtotal - descuento;
  const iva = calcularIVA(baseImponible, IVA);

  const total = baseImponible + iva + envio.costo;

  mostrarResumen(cliente, carrito, {
    subtotal,
    descuento,
    etiquetaDescuento: etiqueta,
    envio,
    iva,
    total
  });
}

// Ejecutar al cargar el documento
main();