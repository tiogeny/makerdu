# MAKERDU PROJECT STATE — v3.0 "Nebula"
Last Updated: 2026-08-24

## Resumen del Proyecto
Makerdu es un LMS Figital (Físico+Digital) para talleres de fabricación digital escolar (impresión 3D, corte láser, vectorización).
Conecta retos pedagógicos con Gemini Vision IA, FabCoins y un ecosistema de Micro-Apps autónomas que funcionan 100% en el navegador.

---

## Arquitectura de Roles

| Rol | Acceso | Funciones Clave |
|-----|--------|-----------------|
| **SuperAdmin** | `/admin/dashboard` | Crea cursos maestros, gestiona aulas, calibra IA, administra Micro-Apps |
| **Docente** | `/teacher/war-room` | Elige proyecto del catálogo, matricula alumnos, genera lotes .ZIP, monitorea avance |
| **Alumno** | `/hud` (PIN) | Completa misiones por niveles, usa Micro-Apps, acumula XP y FabCoins |

---

## Stack Tecnológico
- **Backend:** PHP 8.3/8.4 · Laravel 11 · Inertia.js
- **Frontend:** Vue 3 (Composition API) · Tailwind CSS · Lucide Icons
- **IA:** Google Gemini 2.0 Flash Vision (validación de mallas 3D y bocetos)
- **3D/Gráficos:** Three.js (WebGL) · OrbitControls · STL parser en browser
- **Vectorización:** Canvas API + algoritmo de Bézier propio (sin dependencias externas)
- **PDF:** Laravel DomPDF (rotulado de lotes, tarjetas PIN)
- **QR:** API pública qrserver.com (generación dinámica del QR del pasaporte)
- **Hosting:** BanaHosting cPanel (Usuario: discoper, PHP: ea-php84, Dominio: makerdu.com)
- **Repositorio:** https://github.com/tiogeny/makerdu (rama: main)

---

## Credenciales de Prueba (post migrate:fresh --seed)
- **SuperAdmin:** contacto@fablablima.org / password → /admin/dashboard
- **Docente 1:** profesor@makerdu.com / password → /teacher/war-room
- **Docente 2:** maria.torres@colegio.edu / password → /teacher/war-room
- **Alumno:** Código MK402 / PIN 1234 → /student-login → /hud

---

## Estructura de Carpetas Clave

### Backend (Laravel)
```
app/Http/Controllers/
├── AdminDashboardController.php    # KPIs del SuperAdmin
├── AiSandboxController.php         # Consola calibración Gemini Vision
├── AiTutorChatController.php       # Chat tutor IA del alumno
├── ClassroomManagerController.php  # Gestión de aulas y matrícula
├── MicroAppManagerController.php   # App Store del SuperAdmin
├── ProjectBuilderController.php    # CRUD cursos maestros
├── SquadController.php             # HUD alumno, preflight, bitácora
├── StudentAuthController.php       # Login PIN de alumnos
└── TeacherWarRoomController.php    # Torre de control docente

app/Models/
├── BitacoraEntry.php, Classroom.php, FabricationBatch.php
├── MicroApp.php, ParentProfile.php, Project.php
├── ProjectLevel.php, Squad.php, User.php
```

### Frontend (Vue 3 / Inertia)
```
resources/js/
├── Pages/
│   ├── Admin/
│   │   ├── Dashboard.vue           # Centro de Mando SuperAdmin (KPIs + accesos rápidos)
│   │   ├── Apps/Index.vue          # Micro-Apps Store & Sandbox
│   │   ├── AiSandbox/Index.vue     # Calibración Gemini Vision en vivo
│   │   ├── CourseBuilder/          # CRUD cursos maestros (Create/Edit/Index)
│   │   └── ClassroomManager/       # Gestión de aulas
│   ├── Teacher/
│   │   └── WarRoom.vue             # Torre de Control (3 pestañas: Catálogo, Radar, Escuadras)
│   ├── Student/
│   │   ├── SquadHud.vue            # HUD del alumno (Roadmap + Studio de 4 pasos)
│   │   ├── MakerPassport.vue       # Certificado imprimible con QR dinámico
│   │   ├── Login.vue               # Login PIN
│   │   └── Portal.vue              # Portal familiar
│   ├── Auth/Login.vue              # Login docente/admin
│   └── Welcome.vue                 # Landing page
├── Components/
│   ├── AiTutorChatModal.vue        # Chat Gemini tutor en el HUD
│   ├── MicroAppOverlay.vue         # Shell fullscreen postMessage para Micro-Apps
│   ├── StlViewer3D.vue             # Visor 3D embebido en el HUD
│   └── VideoTutorialPlayer.vue     # Player de video tutorial
├── locales/
│   ├── es.json                     # Traducciones ES (v3.0 completo)
│   └── en.json                     # Traducciones EN (v3.0 completo)
└── i18n.js                         # Motor de internacionalización

public/apps/                        # Micro-Apps autónomas (100% browser)
├── vectorizer/                     # Vectorizador Cámara B/N + Bézier 2D→3D
├── viewer-3d/                      # Visor 3D WebGL (STL + cotas)
└── box-generator/                  # Generador Cajas Láser finger-joint (SVG/DXF)
```

---

## Rutas Principales

| Ruta | Controlador | Rol |
|------|-------------|-----|
| `/` | Welcome.vue | Público |
| `/login` | Auth/Login.vue | Admin/Docente |
| `/student-login` | Student/Login.vue | Alumno |
| `/admin/dashboard` | AdminDashboardController | SuperAdmin |
| `/admin/apps` | MicroAppManagerController | SuperAdmin |
| `/admin/ai-sandbox` | AiSandboxController | SuperAdmin |
| `/admin/projects` | ProjectBuilderController | SuperAdmin |
| `/admin/classrooms` | ClassroomManagerController | SuperAdmin |
| `/teacher/war-room` | TeacherWarRoomController | Docente |
| `/hud` | SquadController | Alumno |
| `/apps/vectorizer` | Static (public/) | Público |
| `/apps/viewer-3d` | Static (public/) | Público |
| `/apps/box-generator` | Static (public/) | Público |

---

## Protocolo postMessage (Micro-Apps → LMS)

```json
{
  "type": "MAKERDU_MICROAPP_ASSET",
  "appName": "box-generator",
  "fileType": "svg",
  "fileName": "caja_makerdu_120x80x50mm.svg",
  "content": "<svg ...>...</svg>",
  "box_L_mm": 120, "box_A_mm": 80, "box_H_mm": 50,
  "material_thickness_mm": 3,
  "kerf_mm": 0.1,
  "fabcoins_cost": 12
}
```

---

## Guía de Despliegue a Producción (cPanel ea-php84)

```bash
cd /home/discoper/makerdu_core
git pull origin main
cp -r public/build/* /home/discoper/makerdu.com/build/
cp -r public/apps /home/discoper/makerdu.com/
ea-php84 artisan migrate:fresh --seed --force  # ⚠️ borra datos
ea-php84 artisan optimize:clear
ea-php84 artisan config:cache && ea-php84 artisan route:cache
```

---

## Changelog v3.0 "Nebula"

### Nuevas Funcionalidades
- **Micro-App Vectorizador** (`/apps/vectorizer`): Cámara → B/N → Bézier 2D → Extrusor 3D Three.js
- **Micro-App Visor 3D WebGL** (`/apps/viewer-3d`): Carga STL, cotas X/Y/Z, wireframe, volumen
- **Micro-App Box Generator** (`/apps/box-generator`): Cajas finger-joint SVG/DXF con kerf compensation
- **Shell Overlay postMessage** (`MicroAppOverlay.vue`): Fullscreen 100vw×100vh sin pestañas
- **App Store SuperAdmin** (`/admin/apps`): Registro y sandbox de micro-apps
- **AI Sandbox** (`/admin/ai-sandbox`): Calibración en vivo de Gemini Vision + sliders de tolerancias
- **i18n completo v3.0**: ES+EN con todas las claves nuevas (studio, micro_apps, passport, admin KPIs)
- **Pasaporte Maker v3.0**: QR dinámico correcto en producción, i18n completo, v3.0 branding

### Correcciones
- QR en pasaporte usaba `makerdu.test` en producción → corregido con `request()->getSchemeAndHttpHost()`
- Contraseñas admin: `password` (no `makerdu2025`)
- Version string actualizado a v3.0 en locales ES y EN