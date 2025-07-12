// ==============================
// Catálogo de productos/servicios
// ==============================
const catalogo = [
  { id: 1, tipo: "producto", nombre: "Tiras Reactivas", precio: 300 },
  { id: 2, tipo: "producto", nombre: "Glucometro'", precio: 1500 },
  { id: 3, tipo: "servicio", nombre: "Consulta a domicilio", precio: 800 },
  { id: 4, tipo: "servicio", nombre: "Consulta Telemedicina", precio: 400 }
];

// ==============================
// Referencias a elementos del DOM
// ==============================
const itemSelect = document.getElementById("item-select");
const detalleItems = document.getElementById("detalle-items");
const subtotalElem = document.getElementById("subtotal");
const ivaElem = document.getElementById("iva");
const totalElem = document.getElementById("total");

let itemsCotizados = [];

// ==============================
// Poblar el selector de ítems
// ==============================
catalogo.forEach(item => {
  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = item.nombre;
  itemSelect.appendChild(option);
});

// ==============================
// Agregar ítem seleccionado al arreglo
// ==============================
document.getElementById("agregar-item").addEventListener("click", () => {
  const itemId = parseInt(itemSelect.value);
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const item = catalogo.find(i => i.id === itemId);

  if (!item || cantidad < 1) return;

  itemsCotizados.push({
    descripcion: item.nombre,
    cantidad,
    precio: item.precio,
    total: item.precio * cantidad
  });

  renderTabla();
});

// ==============================
// Mostrar los ítems en la tabla y calcular totales
// ==============================
function renderTabla() {
  detalleItems.innerHTML = "";
  let subtotal = 0;

  itemsCotizados.forEach(({ descripcion, cantidad, precio, total }) => {
    subtotal += total;
    detalleItems.innerHTML += `
      <tr>
        <td>${descripcion}</td>
        <td>${cantidad}</td>
        <td>$${precio.toFixed(2)}</td>
        <td>$${total.toFixed(2)}</td>
      </tr>
    `;
  });

  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  subtotalElem.textContent = "Subtotal: $" + subtotal.toFixed(2);
  ivaElem.textContent = "IVA (16%): $" + iva.toFixed(2);
  totalElem.textContent = "Total: $" + total.toFixed(2);
}

// ==============================
// Generación de PDF con jsPDF y diseño corporativo
// ==============================
document.getElementById("generar-pdf").addEventListener("click", () => {
  const cliente = document.getElementById("cliente").value;
  const vigencia = document.getElementById("vigencia").value;

  if (!cliente || !vigencia || itemsCotizados.length === 0) {
    alert("Por favor completa todos los campos y agrega al menos un producto.");
    return;
  }

  const doc = new jspdf.jsPDF();

  // Encabezado corporativo azul
  doc.setFillColor(10, 61, 98);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Previta - COTIZACIÓN", 105, 13, null, null, "center");

  // Información del cliente
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(`Cliente: ${cliente}`, 10, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 37);
  doc.text(`Vigencia: ${vigencia} días`, 10, 44);

  // Tabla de productos
  const tabla = itemsCotizados.map(item => [
    item.descripcion,
    item.cantidad.toString(),
    `$${item.precio.toFixed(2)}`,
    `$${item.total.toFixed(2)}`
  ]);

  doc.autoTable({
    head: [["Descripción", "Cantidad", "Precio Unitario", "Total"]],
    body: tabla,
    startY: 55,
    styles: { halign: "center" },
    headStyles: { fillColor: [10, 61, 98] }
  });

  // Totales
  const subtotal = itemsCotizados.reduce((acc, item) => acc + item.total, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
  doc.text(`IVA (16%): $${iva.toFixed(2)}`, 140, finalY + 7);
  doc.setFont(undefined, "bold");
  doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 14);

  // Pie de página
  doc.setDrawColor(0);
  doc.line(10, 280, 200, 280);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Previta · Administración de salud poblacional · www.previta.com.mx", 105, 287, null, null, "center");

  // Descargar PDF
  doc.save(`Cotizacion_${cliente}.pdf`);
});
