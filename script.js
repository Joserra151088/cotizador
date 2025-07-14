const catalogo = [
  { id: 1, nombre: "Laptop Lenovo ThinkPad", precio: 13500 },
  { id: 2, nombre: "Monitor Samsung 24''", precio: 2890 },
  { id: 3, nombre: "Instalación de red", precio: 1200 },
  { id: 4, nombre: "Mantenimiento preventivo", precio: 850 }
];

const itemSelect = document.getElementById("item-select");
let itemsCotizados = [];

// Cargar catálogo en el dropdown
catalogo.forEach(item => {
  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = item.nombre;
  itemSelect.appendChild(option);
});

// Agregar producto a la cotización
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

// Renderizar tabla de productos agregados
function renderTabla() {
  const detalleItems = document.getElementById("detalle-items");
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

  document.getElementById("subtotal").textContent = "Subtotal: $" + subtotal.toFixed(2);
  document.getElementById("iva").textContent = "IVA (16%): $" + iva.toFixed(2);
  document.getElementById("total").textContent = "Total: $" + total.toFixed(2);
}

// Generar el PDF con formato profesional
document.getElementById("generar-pdf").addEventListener("click", async () => {
  const cliente = document.getElementById("cliente").value;
  const vigencia = document.getElementById("vigencia").value;
  const plantillaPath = document.getElementById("plantilla-select").value;

  if (!cliente || !vigencia || itemsCotizados.length === 0) {
    alert("Completa todos los campos antes de generar la cotización.");
    return;
  }

  const existingPdfBytes = await fetch(plantillaPath).then(res => res.arrayBuffer());
  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const plantillaPdf = await PDFDocument.load(existingPdfBytes);
  const pdfDoc = await PDFDocument.create();
  const pages = await pdfDoc.copyPages(plantillaPdf, plantillaPdf.getPageIndices());
  pages.forEach(page => pdfDoc.addPage(page));

  const page = pdfDoc.addPage([595, 842]); // Tamaño A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;

  page.drawText("COTIZACIÓN", { x: 220, y, size: 20, font: boldFont, color: rgb(0.1, 0.25, 0.45) });
  y -= 40;

  page.drawText(`Cliente: ${cliente}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Fecha: ${new Date().toLocaleDateString()}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Vigencia: ${vigencia} días`, { x: 50, y, size: 12, font });
  y -= 30;

  // Tabla encabezado
  const tableX = 50;
  const headerHeight = 20;
  const columnWidths = [200, 80, 100, 100];

  page.drawRectangle({
    x: tableX, y, width: columnWidths.reduce((a, b) => a + b), height: headerHeight, color: rgb(0.1, 0.25, 0.45)
  });

  page.drawText("Descripción", { x: tableX + 5, y: y + 5, size: 12, font: boldFont, color: rgb(1,1,1) });
  page.drawText("Cantidad", { x: tableX + columnWidths[0] + 5, y: y + 5, size: 12, font: boldFont, color: rgb(1,1,1) });
  page.drawText("Precio Unitario", { x: tableX + columnWidths[0] + columnWidths[1] + 5, y: y + 5, size: 12, font: boldFont, color: rgb(1,1,1) });
  page.drawText("Total", { x: tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, y: y + 5, size: 12, font: boldFont, color: rgb(1,1,1) });

  y -= headerHeight;

  // Filas de productos
  itemsCotizados.forEach(item => {
    page.drawRectangle({
      x: tableX, y, width: columnWidths.reduce((a, b) => a + b), height: headerHeight, color: rgb(0.95, 0.95, 0.95)
    });
    page.drawText(item.descripcion, { x: tableX + 5, y: y + 5, size: 10, font });
    page.drawText(`${item.cantidad}`, { x: tableX + columnWidths[0] + 5, y: y + 5, size: 10, font });
    page.drawText(`$${item.precio.toFixed(2)}`, { x: tableX + columnWidths[0] + columnWidths[1] + 5, y: y + 5, size: 10, font });
    page.drawText(`$${item.total.toFixed(2)}`, { x: tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, y: y + 5, size: 10, font });
    y -= headerHeight;
  });

  // Totales
  const subtotal = itemsCotizados.reduce((acc, item) => acc + item.total, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  y -= 20;
  page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, { x: 380, y, size: 12, font: boldFont });
  y -= 15;
  page.drawText(`IVA (16%): $${iva.toFixed(2)}`, { x: 380, y, size: 12, font: boldFont });
  y -= 15;
  page.drawText(`TOTAL: $${total.toFixed(2)}`, { x: 380, y, size: 14, font: boldFont, color: rgb(0, 0.5, 0) });

  // Pie de página con imagen
  const imageUrl = 'footer_previta_1.png';
  const imageBytes = await fetch(imageUrl).then(res => res.arrayBuffer());
  const image = await pdfDoc.embedPng(imageBytes);
  const { width: imgOrigWidth, height: imgOrigHeight } = image.scale(1);
  const maxWidth = 500;
  const scale = maxWidth / imgOrigWidth;
  const imgWidth = imgOrigWidth * scale;
  const imgHeight = imgOrigHeight * scale;

  page.drawImage(image, {
    x: (595 - imgWidth) / 2,
    y: 20,
    width: imgWidth,
    height: imgHeight
  });

  // Descargar PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Cotizacion_${cliente}.pdf`;
  link.click();
});
