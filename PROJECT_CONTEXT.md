# 🚀 Makerdu Studio — Documento Maestro de Contexto & Arquitectura

Este documento contiene la visión completa, decisiones técnicas, convenciones de diseño, estructura de datos y estado actual del proyecto **Makerdu Studio**. Su objetivo es permitir que cualquier desarrollador o agente de Inteligencia Artificial (Antigravity u otros) en cualquier computadora pueda retomar el trabajo con contexto total sin perder ningún detalle.

---

## 1. Identidad, Tonalidad & Filosofía Pedagógica

### Propósito del Proyecto
Makerdu es un LMS / Plataforma de Fabricación Digital interactiva que guía a estudiantes a través de retos STEAM basados en aprendizaje por proyectos (PBL). El reto insignia activo es:
**"Lanza tu Colección de Art Toys 2.5D Autoportantes"**.

### Tonalidad & Reglas de Comunicación
* **Inspiración Avengers / Marvel Maker:** Tonalidad heroica, motivadora y empoderadora, pero aterrizada y creíble para jóvenes de 10 a 17 años.
* **Nivel Inicial / Explorador (Sin Falsas Promesas):**
  * NUNCA utilizar verbos absolutos como *"dominarás la fabricación digital"* o *"serás un experto"*.
  * Usar: *"Aprenderás los fundamentos", "Darás tus primeros pasos", "Nivel Inicial / Explorador"*.
* **Estandarización de Términos:**
  * **El Estudio** (o *Makerdu Studio*, ruta `/studio`): Es la plataforma de software y el espacio de trabajo digital.
  * **Taller:** Se reserva EXCLUSIVAMENTE para el espacio físico de las impresoras 3D y herramientas manuales.
  * **Estudiante Maker** o **Maker** (NUNCA *"Creador Maker"* porque es redundante).
  * **Reto vs Misión:** El Reto es el proyecto global (ej. Colección de Art Toys). El Reto contiene **5 Misiones**. Cada misión contiene **3 Pasos**.
  * **Modo de Trabajo:** Se ofrece elección clara entre **Modo Individual** o **En Equipo** (con saldos y mesas vinculadas).

### Economía Maker & FabCoins
* **Bolsa Inicial Oficial:** **12 FabCoins (FC)** por mesa/escuadra.
* **Equivalencia Física Real:**
  * *"Te alcanza para fabricar 4 personajes de 5 cm de alto o 2 personajes de 10 cm de alto."*
  * El costo estándar de impresión de un Art Toy de 10 cm con 10 mm de espesor y 15% infill es de **~4 FabCoins**.

---

## 2. Arquitectura de Navegación en 2 Niveles

Inspirada en el estándar de las suites más avanzadas del mundo (**Tinkercad, Canva, Codecademy, Coursera**):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NIVEL 1: CENTRO DE MANDO DEL RETO (/studio)                                │
│  (Hero Card, Saldo 12 FC, Video/Profesor, Roadmap de las 5 Misiones)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Al pulsar "Entrar" en cualquier misión
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  NIVEL 2: ESTACIÓN DE CREACIÓN INMERSIVA (/studio/mision/{level_number})    │
│  (100% pantalla sin scroll, Sidebar de misiones, 3 pasos enfocados, IA)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Nivel 1: El Centro de Mando (`/studio` -> `Studio.vue`)
* **Hero Card del Reto:** Título de la colección, descripción, video/profesor, botón para abrir el **🎬 Expediente del Reto** (modal con 4 láminas interactivas), saldo de 12 FC, selector Solo vs Equipo y barra general de progreso.
* **Mapa de Misiones (Quest Strip Compacto):** Una franja horizontal de 5 columnas (sin scroll vertical) con las 5 etapas:
  * Etapa 1: Concebir (Boceto B/N, 0 FC, +50 PM).
  * Etapa 2: Ingeniería Digital 3D (STL, 0 FC, +50 PM).
  * Etapa 3: Producción & Slicer (Laminado, 4 FC, +50 PM).
  * Etapa 4: Acabado Físico & Packaging (0 FC, +50 PM).
  * Etapa 5: Lanzamiento & Pitch (Pitch 30s, 0 FC, +100 PM).

### Nivel 2: La Estación Inmersiva (`/studio/mision/{id}` -> `MissionStation.vue`)
* **Layout `h-screen overflow-hidden`:** Todo cabe en el viewport de 100vh sin scroll vertical forzado.
* **Sidebar Izquierdo (Misiones):** Permite alternar entre las 5 etapas con 1 solo clic.
* **Slim Top HUD (50px):** Botón para volver al mapa del reto, título compacto, stepper de 3 pasos (`[ 1. Reglas ]` · `[ 2. Mesa de Trabajo ]` · `[ 3. Auditoría IA ]`), saldo de 12 FC y switch de tema (`☀️ / 🌙`).
* **Flujo Continuo:** Al completar una misión en el Paso 3, el sistema traslada de inmediato al alumno a la siguiente misión (`/studio/mision/2`, `/studio/mision/3`, etc.).

---

## 3. Las 5 Misiones y sus Herramientas Específicas

1. **Misión 1: Concebir — Nace tu Personaje y Marca**
   * **Paso 1 (Reglas):** 4 Reglas de oro (Plumón negro grueso, Base plana >= 40%, Silueta cerrada, Regla del estarcido) + Catálogo Digitoys en PDF (`DIGITOYS-construccion.pdf`).
   * **Paso 2 (Mesa de Trabajo):**
     * **Camino A (Papel y Plumón):** Subir foto o capturar con cámara web.
     * **Camino B (Lienzo Maker 2D):** Micro-app con 3 modos (Plumón Libre calibrado, Armador de formas Digitoys y Pixel Art 24x24).
   * **Paso 3 (Auditoría IA):** Visto bueno de silueta y base autoportante con Gemini IA.
2. **Misión 2: Ingeniería Digital 2.5D — De la Idea al Sólido**
   * **Insumo:** Boceto aprobado de la Misión 1.
   * **Herramienta:** Micro-app `vectorizer` (Vectorizador & Extrusor 2.5D con espesor a 10 mm sin soportes).
   * **Entregable:** Archivo STL (`art_toy_2.5d.stl`).
3. **Misión 3: Producción — Simulación de Laminado y Costeo**
   * **Insumo:** STL extruido de la Misión 2.
   * **Herramienta:** Micro-app `slicer-3d` (Simulador de Laminado en capas Z con infill 15%).
   * **Entregable:** Simulación de impresión y costeo de ~4 FabCoins.
4. **Misión 4: Post-Procesado Físico & Packaging Maker**
   * **Herramienta:** Manual de lijado al agua grano 400/800 y plantilla de caja en PDF.
   * **Entregable:** Foto del Art Toy lijado de pie sobre la mesa y su caja montada.
5. **Misión 5: Lanzamiento — Catálogo y Pitch Comercial**
   * **Herramienta:** Ficha de catálogo y estructura de pitch en 30 segundos.
   * **Entregable:** Video pitch y obtención de la certificación Maker.

---

## 4. Micro-Apps en `public/apps/`

* **Comunicación LMS <-> Micro-App:**
  Las herramientas se comunican mediante `window.parent.postMessage` con el formato estándar:
  ```javascript
  window.parent.postMessage({
      type: 'MAKERDU_MICROAPP_ASSET',
      assetType: 'image' | 'model',
      dataUrl: dataUrl,
      image_snapshot: dataUrl,
      stlContent: stlString,
      fileName: 'boceto_maker_2d.png',
      source: 'sketch-pad'
  }, '*');
  ```
* `MicroAppOverlay.vue` recibe el evento y emite `assetReady`, cerrando el modal e inyectando el archivo en la bitácora del estudiante.

---

## 5. Script de Reinicio Rápido de Datos (Base de Datos)

Para dejar el sistema limpio (0 progreso, agrupamientos deshechos, 12 FC por alumno):
```powershell
php C:\Users\Henry\.gemini\antigravity\brain\9ad8c79d-a192-49b5-b86e-a17b81d5f5bf\scratch\wipe_all_student_progress.php
```
O en el servidor vía tinker:
```php
App\Models\BitacoraEntry::truncate();
App\Models\User::where('role_type', 'student')->update(['xp_points' => 0]);
Illuminate\Support\Facades\DB::table('squad_user')->truncate();
App\Models\Squad::truncate();
foreach (App\Models\User::where('role_type', 'student')->get() as $s) {
    $sq = App\Models\Squad::create(['classroom_id' => 1, 'name' => 'Mesa · ' . explode(' ', $s->name)[0], 'fabcoins_balance' => 12, 'is_active' => true]);
    $sq->members()->attach($s->id, ['current_role' => 'Architect', 'active_minutes' => 0]);
}
```

---

## 6. Comandos para Desplegar Avances en el Servidor / Hosting

Cuando se requiera actualizar el servidor remoto desde la terminal de hosting:

```bash
# 1. Navegar a la carpeta del proyecto
cd /ruta/hacia/tu/makerdu

# 2. Descargar los últimos cambios de GitHub
git pull origin main

# 3. Instalar dependencias backend si hubo cambios
composer install --no-dev --optimize-autoloader

# 4. Compilar assets frontend (si node/npm están en el servidor)
npm run build

# 5. Limpiar y recalcular cachés de Laravel
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
