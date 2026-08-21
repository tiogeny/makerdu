# Makerdu v2.6 - Estado del Proyecto & Guía para Asistentes IA

> **IMPORTANTE PARA ASISTENTES IA (Antigravity / Cursor / Windsurf / Claude Code):**
> Al abrir este repositorio en cualquier computadora, lee este archivo primero para entender la arquitectura, el estado actual del desarrollo y los siguientes pasos a ejecutar sin romper la sincronización.

---

## 1. Información General
* **Proyecto:** Makerdu v2.6 - Plataforma LMS Figital y Orquestador de Fabricación Digital
* **Repositorio Git:** https://github.com/tiogeny/makerdu.git
* **Entorno de Desarrollo:** Laragon local (PHP 8.3 / MySQL / Node.js v22)
* **Hosting Producción:** BanaHosting (cPanel / LiteSpeed / PHP 8.3 / MySQL)
* **Stack Tecnológico:**
  * **Backend:** Laravel 11 (Inertia.js + REST API)
  * **Frontend:** Vue 3 (Composition API <script setup>) + Tailwind CSS + Lucide Icons + Ziggy
  * **Motor IA:** Gemini 2.0 Flash / OpenAI (para Pre-flight Check de STL/SVG)
  * **Generación de Archivos:** DomPDF (Hojas de Rotulado) + ZipArchive (Batches de fabricación)

---

## 2. Reglas Arquitectónicas Inquebrantables
1. **Regla de 1-PC (Equipo en 1 Computadora):** La interfaz del estudiante permite alternar el *Rol Activo* (Architect, Quality, Finance, Relator) dentro de la misma pantalla sin destruir la sesión de Laravel.
2. **Separación Económica:** 
   - FabCoins (FC) = Insumos Físicos Reales (filamento, corte láser, placas). No se regalan con trivias.
   - XP Points = Puntos Pedagógicos de reputación virtual (bitácoras, rotación de rol, colaboración).
3. **Internacionalización (i18n):** Todo texto en vistas debe usar traducción (es base, en preparado).
4. **Deploy en BanaHosting (cPanel):** Nunca compilar en el cPanel. El workflow de deploy usa 
pm run build en local/GitHub Actions para subir public/build/.

---

## 3. Estado de Avance por Fases (Protocolo PRD)

| Fase | Descripción | Estado |
| :--- | :--- | :--- |
| **Fase 0** | Scaffold Laravel 11 + Vue 3 + Inertia + Tailwind + Git | ✅ Completado |
| **Fase 1** | Migraciones de Base de Datos y Modelos Eloquent | 🔄 En ejecución |
| **Fase 2** | Autenticación (Código Clase + PIN 4 dígitos) y HUD Escuadra (1-PC) | ⏳ Pendiente |
| **Fase 3** | Motor Pre-flight Check con IA (Validación STL/SVG) | ⏳ Pendiente |
| **Fase 4** | Consumo FabCoins, Batches ZIP, Rotulado PDF y War Room Docente | ⏳ Pendiente |

---

## 4. Estructura de Base de Datos (PRD v2.6)
* users: pin (4 dígitos), ole_type (student, teacher, fablab_tech, parent, admin), parent_id, xp_points, language.
* parent_profiles: phone_whatsapp, dni_id, 
otifications_enabled.
* classrooms: 	eacher_id, 
ame, ccess_code (5 chars), mode (school_squads, private_workshop), 	inkercad_link.
* squads: classroom_id, 
ame, abcoins_balance.
* squad_user: pivote con current_role, ctive_minutes.
* projects & project_levels: 	itle_json, description_json, 	ype (2.5D, 3D, Laser), 	otal_levels, 	oolbox_json, alidation_rules_json, abcoins_cost.
* itacora_entries: squad_id, level_id, ctive_role_user_id, content_text, ile_url, i_score, i_feedback, status.
* abrication_batches: classroom_id, zip_file_url, pdf_label_url, shipping_address, status.
