# 🧱 Simulador de Cotización de Obra –  💪

Proyecto final del curso **JavaScript** de **Coderhouse**, desarrollado por **Brian Pailacura**.

---

## 🎯 Descripción

El **Simulador de Cotización de Obra ** es una aplicación web interactiva que permite calcular el costo total de materiales para una obra, incluyendo:
- Selección de materiales por categoría.
- Cálculo de subtotales, envío y financiación.
- Generación de resumen de compra.
- Descarga del presupuesto en PDF o impresión directa.

Todo 100 % dinámico con **JavaScript**, **DOM**, **localStorage** y **Fetch**.

---

## ⚙️ Tecnologías utilizadas

- **HTML5** – Estructura semántica del sitio.  
- **CSS3 + Bootstrap 5** – Diseño responsive con modo oscuro.  
- **JavaScript (ES6)** – Lógica completa del simulador.  
- **JSON (materiales.json)** – Fuente de datos de productos.  
- **Librerías externas:**
  - [Toastify](https://apvarun.github.io/toastify-js/) → Notificaciones.  
  - [jsPDF](https://github.com/parallax/jsPDF) → Generación de PDF.  
  - [html2canvas](https://html2canvas.hertzen.com/) → Captura del contenido.  
  - [Bootstrap](https://getbootstrap.com/) → Estilos y modales.  

---

## 💡 Funcionalidades principales

✅ Carga dinámica de materiales desde un archivo JSON.  
✅ Filtrado por categoría y búsqueda por nombre.  
✅ Selección de cantidad y calidad (coeficiente de precio).  
✅ Carrito persistente con almacenamiento en `localStorage`.  
✅ Cálculo de envío, cuotas y total final.  
✅ Modal de resumen con desglose detallado.  
✅ Descarga del presupuesto en **PDF** o impresión directa.  
✅ Estilo claro/oscuro adaptable para impresión.  

---

## 🧠 Lógica del negocio

El simulador representa el flujo completo de una **cotización de obra**:

1. El usuario selecciona materiales desde el catálogo.  
2. Los agrega al carrito con cantidad y calidad.  
3. El sistema calcula el subtotal, el envío y la financiación.  
4. Se genera un resumen interactivo dentro de un modal.  
5. Puede imprimirse o descargarse como PDF profesional.  

Todos los datos se guardan y persisten hasta vaciar el carrito.

---
