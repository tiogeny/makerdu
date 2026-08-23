# Makerdu v2.6 - Estado Integral del Proyecto & Guía de Arquitectura

> **DOCUMENTO MAESTRO DE CONTINUIDAD:**
> Este documento resume la arquitectura, la lógica de negocio pedagógica y el estado del código de Makerdu v2.6. Es la referencia oficial tanto para el equipo humano como para cualquier sesión de IA (Antigravity, Gemini, Cursor, Windsurf, Claude Code).

---

## 1. Información General del Proyecto
* **Nombre:** Makerdu v2.6 - Plataforma LMS Figital y Orquestador de Fabricación Digital
* **Repositorio Oficial:** `https://github.com/tiogeny/makerdu.git`
* **Entorno Local:** Windows / Laragon (PHP 8.3 / MySQL / Node.js 22)
* **Entorno Producción:** BanaHosting cPanel (LiteSpeed / PHP 8.3 / MySQL)
* **Dominio Producción:** `https://makerdu.com`
* **Streaming de Video:** Bunny.net (Bunny Stream / Storage)
* **Motor IA:** Google Gemini 3.5 / 3.6 Multimodal (Vision 3D, Mini-Dashboard de Calidad, Tutor Chatbot en Vivo)

---

## 2. Los 4 Perfiles / Arquetipos de Usuario y sus Ciclos de Vida Actuales

### 👑 1. Super Administrador (Makerdu Core / FabLab Lima)
* **Credencial Inicial:** `contacto@fablablima.org` | `password` (Rol: `admin`)
* **Portal:** Centro de Mando Maestro (`/admin/dashboard`)
* **Responsabilidades:**
  1. **Catálogo Maestro de Cursos:** Diseña los proyectos oficiales (`/admin/projects`) con sus 4 niveles, tolerancias físicas, videos Bunny Stream, tipo de entregable y costos en FabCoins.
  2. **Gestión de Aulas & Asignaciones:** Crea talleres/colegios (`/admin/classrooms`) y vincula a qué profesor y curso pertenece cada aula.
  3. **Supervisión Global:** Métricas de colegios, escuadras, alumnos y FabCoins circulantes.

---

### 👨‍🏫 2. Docente / Profesor de Aula (Historia, Arte, Ciencias, Tecnología)
* **Credencial Inicial:** `profesor@makerdu.com` | `password` (Rol: `teacher`)
* **Portal:** Taller del Docente (`/teacher/war-room`) con 3 Pestañas Clave:
  1. **📚 Catálogo de Proyectos Makerdu:** Explora los cursos maestros creados por el Admin y con 1 clic selecciona *"Usar este Proyecto con mi Aula"*.
  2. **📊 Torre de Control (Radar en Vivo):** Monitorea el mapa de calor de las escuadras en tiempo real, audita bitácoras y genera Lotes de Producción (`.ZIP` de modelos 3D + Hoja de Rotulado PDF para el FabLab).
  3. **🏫 Escuadras & Tarjetas PIN:** Pega la lista de alumnos en bloque para generar escuadras de 4 y descarga los carnets PIN en PDF listos para imprimir.

---

### 🧒 3. Alumno / Escuadras Maker (Mateo, Sofía, Lucas, Camila)
* **Credencial Inicial:** Código de Aula (ej. `MK402`) + PIN de 4 dígitos (ej. `1234`) (Rol: `student`)
* **Portal:** Cabina del Estudiante (`/hud`)
* **Mecánica de Trabajo (Regla de 1-PC):**
  * 4 Alumnos comparten 1 computadora alternando el **Rol Activo** (`Architect`, `Quality`, `Finance`, `Relator`) con 1 clic.
* **Stepper Guiado de 4 Pasos Adaptable:**
  * **Paso 1 (Comprender):** Misión pedagógica y video tutorial en Bunny Stream.
  * **Paso 2 (Crear & Auditar):** Adaptable dinámicamente al tipo de entregable:
    * `photo_sketch`: Lienzo de ideación y subida de foto de la libreta en papel (0 FC).
    * `stl_3d`: Visor 3D Three.js 360°, simulador de capas y control de calidad IA con Gemini Vision.
    * `svg_laser`: Inspección vectorial 2D para corte y grabado láser.
    * `checklist_assembly`: Checklist interactivo de pruebas físicas y post-procesado (0 FC).
  * **Paso 3 (Reflexionar):** Ficha de Autoevaluación & Pensamiento Crítico (+50 XP).
  * **Paso 4 (Fabricar / Finalizar):** Autorización de consumo de FabCoins para insumos reales o confirmación directa (+100 XP) y modal de victoria.
* **Tutor IA Flotante:** Chatbot con memoria del modelo 3D activo y respuestas en Markdown concisas (<120 palabras).
* **Pasaporte Maker:** Certificado digital verificable con código QR dinámico para celular.

---

### 👨‍👩‍👧 4. Familia / Padres de Familia
* **Portal:** Portal Familiar Seguro (`/family/{accessCode}/squad/{squadId}`)
* **Acceso:** Vía enlace de WhatsApp compartido por el docente o escaneando el código QR del Pasaporte Maker.
* **Contenido:** Visualización del portafolio digital, fotos del prototipo real y sello de competencias curriculares CNEB / STEAM logradas por su hijo.

---

## 3. Catálogo de Proyectos Sembrados en Base de Datos

1. 🔏 **Sellos y Relieves 2.5D:** Arte y Ergonomía (4 niveles: Boceto ➔ TinkerCAD ➔ Gemini Vision ➔ Ensamble).
2. 💍 **Bio-joyería Amazónica en 3D:** Naturaleza y Bisutería (4 niveles: Silueta ➔ Ojal de Enganche ➔ Base Plana IA ➔ Herrajes).
3. 🏺 **Patrimonio Chavín en Corte Láser:** Historia y Encastre MDF 3mm (4 niveles: Iconografía ➔ Vectores SVG ➔ Ranuras Kerf ➔ Maqueta).

---

## 4. Estructura de Producción en BanaHosting (cPanel)

```
📁 /home/discoper/
   ├── 📁 makerdu_core/           <-- (Repositorio Git clonado con Laravel: app, database, routes, vendor, .env)
   └── 📁 makerdu.com/ (o public) <-- (Contenido web público: index.php, build/, storage)
```

### Comandos de Actualización en Servidor (15 segundos):
```bash
cd /home/discoper/makerdu_core
git pull origin main
cp -r /home/discoper/makerdu_core/public/build /home/discoper/makerdu.com/
ea-php83 artisan optimize:clear
```