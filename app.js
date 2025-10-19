// === Utilidades ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const ARS = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const toast = (text) => Toastify({ text, duration: 2000, gravity: 'top', position: 'right', style: { background: '#16a34a' } }).showToast();
const oops = (text) => Toastify({ text, duration: 2800, gravity: 'top', position: 'right', style: { background: '#dc2626' } }).showToast();

// === Estado ===
let DATA = { materiales: [] };
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

// === Cargar datos ===
async function cargarDatos() {
  try {
    const res = await fetch('./materiales.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json || !Array.isArray(json.materiales)) throw new Error('JSON inválido');
    DATA.materiales = json.materiales;
  } catch (e) {
    console.error(e);
    oops('No se pudo cargar el catálogo. Reintenta.');
  }
}

// === Render categorías ===
function renderCategorias() {
  const sel = $('#cat');
  if (!sel) return;
  const cats = [...new Set(DATA.materiales.map(m => m.categoria))].sort();
  sel.innerHTML = '<option value="">Todas</option>';
  cats.forEach(c => sel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
}

// === Render grid de materiales ===
function renderGrid() {
  const grid = $('#grid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = ($('#q')?.value ?? '').trim().toLowerCase();
  const cat = $('#cat')?.value ?? '';
  const calidad = $('#calidad')?.value ?? '';

  const items = DATA.materiales.filter(m => (!cat || m.categoria === cat) && (!q || m.nombre.toLowerCase().includes(q)));
  if (items.length === 0) {
    grid.innerHTML = `<p class="text-muted">No hay resultados.</p>`;
    return;
  }

  for (const m of items) {
    const precioBase = Number(m.precio) || 0;
    const coef = (m.coef?.[calidad] ?? 1);
    const precio = Math.round(precioBase * coef);
    grid.insertAdjacentHTML('beforeend', `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h3 class="h6 m-0">${m.nombre}</h3>
              <span class="badge badge-cat">${m.categoria}</span>
            </div>
            <p class="small opacity-75 mb-2">Unidad: ${m.unidad}</p>
            <strong class="mt-auto">${ARS(precio)}</strong>
            <div class="input-group input-group-sm mt-2">
              <span class="input-group-text">Cant.</span>
              <input type="number" class="form-control" min="1" step="1" value="1" data-id="${m.id}"/>
              <button class="btn btn-brand add" data-id="${m.id}">Agregar</button>
            </div>
          </div>
        </div>
      </div>`);
  }
}

// === Helpers Carrito ===
function persist() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function addItem(id, cantidad) {
  const mat = DATA.materiales.find(x => x.id === id);
  if (!mat) return oops('Material no encontrado');

  const calidad = $('#calidad')?.value ?? 'standard';
  const precio = Math.round(mat.precio * (mat.coef?.[calidad] ?? 1));
  const idx = carrito.findIndex(i => i.id === id && i.calidad === calidad);

  if (idx > -1) carrito[idx].cantidad += cantidad;
  else carrito.push({ id, nombre: mat.nombre, unidad: mat.unidad, calidad, precio, cantidad });

  persist();
  renderCarrito();
  toast('Agregado al carrito');
}

function updateCant(id, calidad, cantidad) {
  const item = carrito.find(i => i.id === id && i.calidad === calidad);
  if (!item) return;
  item.cantidad = Math.max(1, cantidad | 0);
  persist();
  renderCarrito();
}

function removeItem(id, calidad) {
  carrito = carrito.filter(i => !(i.id === id && i.calidad === calidad));
  persist();
  renderCarrito();
}

// === Render Carrito ===
function renderCarrito() {
  const tbody = $('#tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let items = 0, total = 0;
  for (const i of carrito) {
    const precio = Number(i.precio) || 0;
    const cant = Number(i.cantidad) || 0;
    const sub = precio * cant; items += cant; total += sub;

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>
          <div class="d-flex flex-column">
            <span>${i.nombre}</span>
            <small class="text-muted">Calidad: ${i.calidad}</small>
          </div>
        </td>
        <td class="text-center" style="max-width:120px">
          <input type="number" min="1" value="${cant}" class="form-control form-control-sm qty" data-id="${i.id}" data-cal="${i.calidad}">
        </td>
        <td>${i.unidad}</td>
        <td class="text-end">${ARS(precio)}</td>
        <td class="text-end">${ARS(sub)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger del" data-id="${i.id}" data-cal="${i.calidad}">×</button></td>
      </tr>`);
  }

  $('#items') && ($('#items').textContent = items);
  $('#total') && ($('#total').textContent = ARS(total));
  calcularFinanciacion();
}

// === Totales ===
function getResumenData(){
  const envioSel = document.querySelector('input[name="envio"]:checked');
  const cuotasSel = $('#cuotas');

  const envio = Number(envioSel?.value || 0);
  const [n, interes] = (cuotasSel?.value || '1-0').split('-').map(Number);

  const subTotal = carrito.reduce((acc,i)=> acc + (Number(i.precio)||0) * (Number(i.cantidad)||0), 0);
  const total = subTotal + envio;
  const totalConInteres = Math.round(total * (1 + (Number(interes)||0)/100));
  const valorCuota = Math.ceil(totalConInteres / (Number(n)||1));

  return { subTotal, envio, n, interes, total, totalConInteres, valorCuota };
}

// === HTML del resumen (desde carrito) ===
function resumenMarkup(){
  const { subTotal, envio, n, interes, total, totalConInteres, valorCuota } = getResumenData();

  const rows = carrito.length
    ? carrito.map(i => `
      <tr>
        <td>${i.nombre}<br><small class="text-muted">Calidad: ${i.calidad}</small></td>
        <td class="text-center">${i.cantidad}</td>
        <td class="text-end">${ARS(i.precio)}</td>
        <td class="text-end">${ARS(i.precio * i.cantidad)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4" class="text-center opacity-75">No hay ítems en el carrito</td></tr>`;

  return `
    <div class="table-responsive mb-3">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Material</th>
            <th class="text-center">Cant.</th>
            <th class="text-end">Unitario</th>
            <th class="text-end">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="card p-3 mb-2">
      <div class="d-flex justify-content-between"><span>Subtotal</span><strong>${ARS(subTotal)}</strong></div>
      <div class="d-flex justify-content-between"><span>Envío</span><strong>${ARS(envio)}</strong></div>
      <div class="d-flex justify-content-between"><span>Total (sin interés)</span><strong>${ARS(total)}</strong></div>
    </div>

    <div class="card p-3">
      <div class="d-flex justify-content-between"><span>Plan de pago</span><strong>${n} cuota(s) • ${interes}% interés</strong></div>
      <div class="d-flex justify-content-between"><span>Total final</span><strong>${ARS(totalConInteres)}</strong></div>
      <div class="d-flex justify-content-between"><span>Valor de cuota</span><strong>${ARS(valorCuota)} x ${n}</strong></div>
    </div>
  `;
}

// === Resumen en modal ===
function renderResumenModal(){
  const cont = $('#resumenHTML');
  if(!cont) return;
  cont.innerHTML = resumenMarkup();
}

// === Calcular Financiación ===
function calcularFinanciacion() {
  const cuotasSel = $('#cuotas');
  const envioSel = document.querySelector('input[name="envio"]:checked');
  if (!cuotasSel || !envioSel) {
    $('#granTotal') && ($('#granTotal').textContent = ARS(0));
    $('#valorCuota') && ($('#valorCuota').textContent = ARS(0));
    return;
  }

  const envio = Number(envioSel.value) || 0;
  const [n, interes] = (cuotasSel.value || '1-0').split('-').map(Number);
  const sub = carrito.reduce((acc, i) => acc + (Number(i.precio) || 0) * (Number(i.cantidad) || 0), 0);
  const total = sub + envio;
  const totalConInteres = Math.round(total * (1 + (Number(interes) || 0) / 100));
  const valorCuota = Math.ceil(totalConInteres / (Number(n) || 1));

  $('#granTotal').textContent = ARS(totalConInteres);
  $('#valorCuota').textContent = `${ARS(valorCuota)} x ${n}`;
}

// === Eventos ===
addEventListener('click', (e) => {
  const addBtn = e.target.closest('.add');
  if (addBtn) {
    const id = Number(addBtn.dataset.id);
    const input = addBtn.closest('.input-group').querySelector('input[type="number"]');
    const cant = Math.max(1, Number(input?.value || 1));
    addItem(id, cant);
    return;
  }

  const delBtn = e.target.closest('.del');
  if (delBtn) {
    removeItem(Number(delBtn.dataset.id), delBtn.dataset.cal);
    return;
  }

  if (e.target.id === 'vaciar') {
    carrito = [];
    persist();
    renderCarrito();
    toast('Carrito limpio');
    return;
  }

  if (e.target.id === 'reset') {
    $('#q').value = '';
    $('#cat').value = '';
    renderGrid();
    return;
  }

  if (e.target.id === 'confirmar') {
    if (!carrito.length) return oops('Agregá al menos un material');
    renderResumenModal();
    const modal = new bootstrap.Modal($('#resumenModal'));
    modal.show();
    return;
  }
});

addEventListener('input', (e) => {
  if (e.target.id === 'q') renderGrid();
  if (e.target.id === 'calidad') { renderGrid(); renderCarrito(); }
  if (e.target.classList.contains('qty')) {
    updateCant(Number(e.target.dataset.id), e.target.dataset.cal, Number(e.target.value));
  }
});

['#cat', '#cuotas', 'input[name="envio"]'].forEach(sel => {
  $$(sel).forEach(el => el.addEventListener('change', () => {
    if (el.id === 'cat') renderGrid();
    calcularFinanciacion();
  }));
});

// === Init ===
async function init() {
  await cargarDatos();
  renderCategorias();
  renderGrid();
  renderCarrito();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// === Imprimir en ventana aparte (siempre muestra todas las filas) ===
addEventListener('click', (e) => {
  if (e.target.id !== 'btnImprimir') return;
  if (!carrito.length) return oops('Agregá al menos un material');

  // Aseguramos datos frescos
  renderResumenModal();

  const htmlResumen = resumenMarkup();

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>Simulador de Cotización de Obra — El Papi</title>
        <style>
          body{
            font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
            background:#fff;color:#111827;margin:24px;
          }
          h1{ margin:0 0 6px 0;font:600 20px/1.2 system-ui; }
          .meta{ font:400 12px/1.2 system-ui;color:#6b7280;margin-bottom:12px; }
          hr{ border:0;border-top:1px solid #e5e7eb;margin:8px 0 16px 0; }
          table{ width:100%; border-collapse:collapse; margin-bottom:12px; }
          thead th{ background:#f3f4f6; color:#111827; text-align:left; }
          th,td{ border:1px solid #d1d5db; padding:8px; }
          td.text-end{ text-align:right; }
          td.text-center{ text-align:center; }
          .card{ border:1px solid #e5e7eb; padding:12px; margin-bottom:10px; }
          .row{ display:flex; justify-content:space-between; }
        </style>
      </head>
      <body>
        <div class="row">
          <div>
            <h1>Resumen de compra</h1>
            <div class="meta">${new Date().toLocaleString()}</div>
          </div>
          <div style="font:600 14px/1.2 system-ui;color:#16a34a">El Papi</div>
        </div>
        <hr/>
        ${htmlResumen}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  // win.close(); // si querés cerrar automáticamente
});

// === Descargar PDF del resumen (tema claro + multipágina, sin clonar el DOM del modal) ===
addEventListener('click', async (e) => {
  if (e.target.id !== 'btnDescargarPDF') return;
  if (!carrito.length) return oops('Agregá al menos un material');

  try {
    renderResumenModal();
    if (!window.jspdf || !window.html2canvas) return oops('Faltan jsPDF/html2canvas');

    const root = document.createElement('div');
    root.className = 'export-root export-light';

    const headerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:8px">
        <div>
          <h2 style="margin:0 0 6px 0;font:600 20px/1.2 system-ui">Resumen de compra</h2>
          <div style="font:400 12px/1.2 system-ui;color:#6b7280">${new Date().toLocaleString()}</div>
        </div>
        <div style="font:600 14px/1.2 system-ui;color:#16a34a">El Papi</div>
      </div>
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:8px 0 16px 0"/>
    `;

    root.innerHTML = headerHTML + resumenMarkup();
    document.body.appendChild(root);

    const canvas = await html2canvas(root, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const imgW = pageW - margin * 2;
    const imgH = canvas.height * imgW / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgH;
    let position = margin;

    doc.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= (pageH - margin * 2);

    while (heightLeft > 0) {
      doc.addPage();
      position = margin - (imgH - heightLeft);
      doc.addImage(imgData, 'PNG', margin, position, imgW, imgH);
      heightLeft -= (pageH - margin * 2);
    }

    doc.save('resumen-de-compra.pdf');
    toast('PDF generado con éxito 🧾');
  } catch (err) {
    console.error(err);
    oops('No se pudo generar el PDF');
  } finally {
    document.querySelector('.export-root')?.remove();
  }
});