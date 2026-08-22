# Makerdu v2.6 - Estado del Proyecto & Guía para Asistentes IA

> **IMPORTANTE PARA ASISTENTES IA (Antigravity / Cursor / Windsurf / Claude Code):**
> Al abrir este repositorio en cualquier computadora, lee este archivo primero para entender la arquitectura, el estado actual del desarrollo y los siguientes pasos a ejecutar sin romper la sincronización.

---

## 1. Información General
* **Proyecto:** Makerdu v2.6 - Plataforma LMS Figital y Orquestador de Fabricación Digital
* **Repositorio Git:** `https://github.com/tiogeny/makerdu.git`
* **Entorno de Desarrollo:** Laragon local (PHP 8.3 / MySQL / Node.js v22)
* **Hosting Producción:** BanaHosting (cPanel / LiteSpeed / PHP 8.3 / MySQL)
* **Stack Tecnológico:**
  * **Backend:** Laravel 11 (Inertia.js + REST API)
  * **Frontend:** Vue 3 (Composition API `<script setup>`) + Tailwind CSS + Lucide Icons + Ziggy
  * **Motor IA:** Gemini 2.0 Flash / OpenAI (para Pre-flight Check de STL/SVG)
  * **Generación de Archivos:** DomPDF (Hojas de Rotulado) + ZipArchive (Batches de fabricación)

---

## 2. Reglas Arquitectónicas Inquebrantables
1. **Regla de 1-PC (Equipo en 1 Computadora):** La interfaz del estudiante permite alternar el *Rol Activo* (`Architect`, `Quality`, `Finance`, `Relator`) dentro de la misma pantalla sin destruir la sesión de Laravel.
2. **Separación Económica:** 
   - `FabCoins (FC)` = Insumos Físicos Reales (filamento, corte láser, placas). No se regalan con trivias. La IA de validación protege este balance.
   - `XP Points` = Puntos Pedagógicos de reputación virtual (bitácoras, rotación de rol, colaboración).
3. **Internacionalización (`i18n`):** Todo texto en vistas debe usar traducción (`es` base, `en` preparado).
4. **Deploy en BanaHosting (cPanel):** Nunca compilar en el cPanel. El workflow de deploy usa `npm run build` en local/GitHub Actions para subir `public/build/`.

---

## 3. Estado de Avance por Fases (Protocolo PRD)

| Fase | Descripción | Estado |
| :--- | :--- | :--- |
| **Fase 0** | Scaffold Laravel 11 + Vue 3 + Inertia + Tailwind + Git | ✅ Completado |
| **Fase 1** | Migraciones de Base de Datos y Modelos Eloquent | ✅ Completado |
| **Fase 2** | Autenticación (Código Clase + PIN 4 dígitos) y HUD Escuadra (1-PC) | ✅ Completado |
| **Fase 3** | Motor Pre-flight Check con IA (Validación STL/SVG + Gemini API) | ✅ Completado |
| **Fase 4** | Consumo FabCoins, Batches ZIP, Rotulado PDF y War Room Docente | ✅ Completado |

---

## 4. Credenciales de Prueba en Local (Seeder)
* **Aula / Taller:** Código `MK-402` (o `MK402`)
* **Alumnos de la Escuadra Titanes Maker:**
  - Mateo Alarcón: PIN `1234` (Rol: *Architect*, XP: 120)
  - Sofía Chang: PIN `5678` (Rol: *Quality*, XP: 150)
  - Lucas Ramos: PIN `9012` (Rol: *Finance*, XP: 95)
  - Camila Díaz: PIN `3456` (Rol: *Relator*, XP: 110)
* **Docente / War Room:** `profesor@makerdu.com` (Password: `password`)
* **Portal Familiar:** Accesible vía `/family/MK402/squad/1`

---

## 5. Instrucciones para Continuar en Otra Computadora
1. `git clone https://github.com/tiogeny/makerdu.git`
2. `composer install && npm install`
3. `cp .env.example .env && php artisan key:generate`
4. `php artisan migrate:fresh --seed`
5. `npm run build`
6. Decirle a la IA: *"Lee PROJECT_STATE.md y continuemos con el siguiente sprint de Makerdu."*