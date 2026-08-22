# Makerdu v2.6 - Estado del Proyecto & Guía para Asistentes IA

> **IMPORTANTE PARA ASISTENTES IA (Antigravity / Cursor / Windsurf / Claude Code):**
> Al abrir este repositorio en cualquier computadora, lee este archivo primero para entender la arquitectura, el estado actual del desarrollo y los siguientes pasos a ejecutar sin romper la sincronización.

---

## 1. Información General
* **Proyecto:** Makerdu v2.6 - Plataforma LMS Figital y Orquestador de Fabricación Digital
* **Repositorio Git:** `https://github.com/tiogeny/makerdu.git`
* **Entorno de Desarrollo:** Laragon local (PHP 8.3 / MySQL / Node.js v22)
* **Hosting Producción:** BanaHosting (cPanel / LiteSpeed / PHP 8.3 / MySQL)
* **Servicio de Video Streaming:** Bunny.net (Bunny Stream / Storage)
* **Stack Tecnológico:**
  * **Backend:** Laravel 11 (Inertia.js + REST API)
  * **Frontend:** Vue 3 (Composition API `<script setup>`) + Tailwind CSS + Three.js (STLLoader + OrbitControls) + Bunny Player + Lucide Icons + i18n
  * **Motor IA:** Gemini 2.0 Flash / OpenAI (para Pre-flight Check de STL/SVG)
  * **Generación de Archivos:** DomPDF (Hojas de Rotulado) + ZipArchive (Batches de fabricación)

---

## 2. Reglas Arquitectónicas Inquebrantables
1. **Regla de 1-PC (Equipo en 1 Computadora):** La interfaz del estudiante permite alternar el *Rol Activo* (`Architect`, `Quality`, `Finance`, `Relator`) dentro de la misma pantalla sin destruir la sesión de Laravel.
2. **Separación Económica:** 
   - `FabCoins (FC)` = Insumos Físicos Reales (filamento, corte láser, placas). No se regalan con trivias. La IA de validación protege este balance.
   - `XP Points` = Puntos Pedagógicos de reputación virtual (bitácoras, rotación de rol, colaboración).
3. **Internacionalización Modular (`i18n`):** 
   - `resources/js/locales/es.json` (Español completo y estructurado por secciones).
   - `resources/js/locales/en.json` (Inglés estructurado).
   - Helper reactivo `t('section.key')` con memoria en `localStorage`.
4. **Deploy en BanaHosting (cPanel):** Nunca compilar en el cPanel. El workflow de deploy usa `npm run build` en local/GitHub Actions para subir `public/build/`.

---

## 3. Estado de Avance por Fases y Módulos

| Fase / Módulo | Descripción | Estado |
| :--- | :--- | :--- |
| **Fase 0** | Scaffold Laravel 11 + Vue 3 + Inertia + Tailwind + Git | ✅ Completado |
| **Fase 1** | Migraciones de Base de Datos y Modelos Eloquent | ✅ Completado |
| **Fase 2** | Autenticación (Código Clase + PIN 4 dígitos) y HUD Escuadra (1-PC) | ✅ Completado |
| **Fase 3** | Motor Pre-flight Check con IA (Validación STL/SVG + Gemini API) | ✅ Completado |
| **Fase 4** | Consumo FabCoins, Batches ZIP, Rotulado PDF y War Room Docente | ✅ Completado |
| **Módulo 1**| **Visor 3D Real (STLLoader + OrbitControls 360°)** | ✅ Completado |
| **Módulo 2**| **Internacionalización Estructurada (`es.json` / `en.json`)** | ✅ Completado |
| **Módulo 3**| **Layout Profesional en 3 Pestañas + Bunny.net Video Player** | ✅ Completado |
| **Módulo 4**| **Bitácora Digital Multimedia (Fotos, Ficha Técnica y Portafolio)** | ✅ Completado |

---

## 4. Credenciales de Prueba en Local (Seeder)
* **Aula / Taller:** Código `MK-402` (o `MK402`)
* **Alumnos de la Escuadra Titanes Maker:**
  - Mateo Alarcón: PIN `1234` (Rol: *Diseñador 3D*, XP: 120)
  - Sofía Chang: PIN `5678` (Rol: *Inspector de Calidad*, XP: 150)
  - Lucas Ramos: PIN `9012` (Rol: *Gestor de FabCoins*, XP: 95)
  - Camila Díaz: PIN `3456` (Rol: *Cronista de Bitácora*, XP: 110)
* **Docente / Torre de Control:** `profesor@makerdu.com` (Password: `password`)
* **Portal Familiar:** Accesible vía `/family/MK402/squad/1`

---

## 5. Instrucciones para Continuar en Otra Computadora
1. `git clone https://github.com/tiogeny/makerdu.git`
2. `composer install && npm install`
3. `cp .env.example .env && php artisan key:generate`
4. `php artisan migrate:fresh --seed`
5. `npm run build`
6. Decirle a la IA: *"Lee PROJECT_STATE.md y continuemos con el siguiente sprint de Makerdu."*