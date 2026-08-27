# 🚀 Makerdu — Plataforma LMS Figital & Orquestador de Fabricación Digital STEAM

<div align="center">

![Makerdu Banner](https://img.shields.io/badge/Makerdu-LMS%20STEAM%20Figital-0284c7?style=for-the-badge&logo=makerbot&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel%2011-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue.js%203-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-9553E9?style=for-the-badge&logo=inertia&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js%20WebGL-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Plataforma educativa para colegios, universidades y FabLabs que conecta el aprendizaje basado en proyectos (PBL) con la fabricación digital física (Impresión 3D, Corte Láser, Plotters, Termoformado y CNC).**

[Características](#-características-principales) • [Arquitectura de Roles](#-arquitectura-de-roles) • [Suite de 19 Micro-Apps](#-suite-maestra-de-19-micro-apps) • [Economía FabCoins](#-economía-de-fabcoins--carrocerías) • [Guía de Despliegue](#-guía-de-instalación-y-despliegue)

</div>

---

## 🌟 Características Principales

1. **Dual Login Figital para Alumnos:** Acceso sin correos ni contraseñas complejas mediante **Código de Aula (6 letras)** + **PIN Numérico (4 dígitos)**, ideal para aulas escolares y dinámicas de equipo.
2. **Suite de 19 Micro-Apps Autónomas en el Navegador:** Herramientas CAD/CAM 2D/3D que corren 100% en la GPU del cliente (WebGL / Three.js), sin consumir memoria en el servidor y exportando archivos listos para fabricación (`STL` 3D Binario y `SVG` Láser).
3. **Bitácora de Retos en Tiempo Real:** Las escuadras envían sus bocetos, fotos y archivos 3D/Láser con comunicación directa vía `postMessage` desde las micro-apps.
4. **War Room Docente:** Panel táctico en vivo para que los profesores evalúen entregas por niveles, otorguen retroalimentación con IA Gemini Vision y asignen FabCoins.
5. **Economía de Recompensas FabCoins & Carrocerías:** Sistema de gamificación con pasaporte maker, niveles coleccionables y canje de materiales en la tienda del colegio.
6. **Multiidioma Nativo (i18n):** Arquitectura bilingüe (Español / Inglés) tanto en base de datos (`_json`) como en frontend reactivo (`vue-i18n`).

---

## 👥 Arquitectura de Roles

```
 ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
 │   👑 SUPER ADMINISTRADOR  │ ──►│   🎓 DOCENTE / MENTOR    │ ──►│   🚀 ESTUDIANTE / ESCUADRA│
 ├──────────────────────────┤    ├──────────────────────────┤    ├──────────────────────────┤
 │ • Catálogo Maestro STEAM │    │ • Crear Aulas y Códigos  │    │ • Login con Código + PIN │
 │ • Gestión de Micro-Apps  │    │ • Gestión de Escuadras   │    │ • Pasaporte Maker        │
 │ • Catálogo de Recompensas│    │ • War Room en Vivo       │    │ • Bitácora de Retos      │
 │ • Monitoreo Global       │    │ • Validación y FabCoins  │    │ • Micro-Apps & Canjes    │
 └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

### 1. Super Administrador (`admin`)
* **Dashboard Global (`/admin/dashboard`):** Estadísticas de aulas activas, docentes, proyectos y transacciones.
* **Proyectos STEAM (`/admin/projects`):** Creación y edición de cursos con sus respectivos niveles, guías de entrega y costos en FabCoins.
* **Catálogo de Micro-Apps (`/admin/apps`):** Habilitar, deshabilitar y previsualizar herramientas interactivas.
* **Tienda de Recompensas (`/admin/rewards`):** Configuración de ítems canjeables con FabCoins.

### 2. Docente / Mentor (`teacher`)
* **Portal Docente (`/portal`):** Vista de aulas activas, progreso curricular y creación de nuevas clases.
* **Gestión de Aula (`/portal/classrooms/{id}`):** Generación del código de acceso, creación de escuadras, asignación de proyectos y registro de estudiantes con PIN.
* **War Room en Tiempo Real (`/portal/classrooms/{id}/warroom`):** Feed en vivo de entregas de bitácora, visor STL 3D integrado, retroalimentación formativa y otorgamiento de FabCoins.

### 3. Estudiante / Escuadra Maker (`student`)
* **Acceso Figital (`/login`):** Selección de Aula $\rightarrow$ Selección de Escuadra $\rightarrow$ PIN de 4 dígitos.
* **Dashboard de Escuadra (`/dashboard`):** Acceso al proyecto asignado, niveles desbloqueados y saldo de FabCoins.
* **Bitácora de Proyecto (`/portal/classrooms/{id}/squads/{squadId}/bitacora`):** Registro fotográfico de bocetos, subida de archivos STL/SVG y envío directo desde las micro-apps.
* **Pasaporte Maker (`/maker-passport`):** Colección de carrocerías desbloqueadas e insignias ganadas.

---

## 🛠️ Suite Maestra de 19 Micro-Apps

Todas las micro-apps son independientes, cargadas dinámicamente en iframes aislados dentro de `public/apps/[slug]/` y sincronizadas con el LMS Makerdu:

| # | Icono | Micro-App | Slug | Eje Tecnológico | Salida de Fabricación |
|---|---|---|---|---|---|
| 1 | 🎨 | **Vectorizador B/N & Bézier** | `vectorizer` | Bocetos a vectores y extrusión 2.5D | `SVG` / `STL` |
| 2 | 🧊 | **Visor 3D WebGL Autónomo** | `viewer-3d` | Inspección 360°, cotas y volumen | `STL` |
| 3 | 📦 | **Generador de Cajas Láser** | `box-generator` | Finger-joint paramétrico con kerf | `SVG` |
| 4 | 🦖 | **Digitoy Studio 3D** | `digitoy-studio` | Figuras articuladas print-in-place | `STL` |
| 5 | ⚙️ | **Engranajes & Autómatas** | `gear-generator` | Cinemática, torque y reducción | `SVG` / `STL` |
| 6 | 👾 | **Pixel & Voxel Art Studio** | `pixel-art-studio` | Mosaicos 2D, simetría y vóxeles 3D | `SVG` / `STL` |
| 7 | 💡 | **Lámparas Waffle Grid** | `lamp-designer` | Costillas entrelazadas y luz interna | `SVG` / `STL` |
| 8 | 🔤 | **Sellos Ergonómicos** | `stamp-maker` | Mango 3D, relieve espejado y troquel | `STL` / `SVG` |
| 9 | 💎 | **Bio-Joyería Andina** | `jewelry-pattern` | Aretes, dijes sagrados y ojal | `SVG` / `STL` |
| 10 | 📐 | **Packaging Plegable** | `packaging-box` | Cajas de cartulina y doblado 3D | `SVG` / `STL` |
| 11 | 🪵 | **Bisagras Vivas Flexibles** | `living-hinge` | Patrones elásticos de flexión láser | `SVG` / `STL` |
| 12 | 🖼️ | **Litofanías 3D & Cajas Luz** | `lithophane-maker` | Fotos a relieve 3D con contraluz | `STL` |
| 13 | 🪴 | **Macetas & Jarrones 3D** | `vase-pot-generator` | Modo vaso continuo y low-poly | `STL` |
| 14 | 🤖 | **Chasis Robótica 2WD/4WD** | `robot-chassis` | Carritos 2WD/4WD, TT DC y Arduino | `SVG` / `STL` |
| 15 | 🗺️ | **Topografía & Maquetas 2.5D** | `layered-topography` | Capas apilables con despiece 3D | `SVG` / `STL` |
| 16 | 🍫 | **Moldes & Matrices 3D** | `mold-maker` | Chocolatería, jabones y draft angle | `STL` |
| 17 | 🧱 | **Block CAD 3D (Tinker-Lite)** | `block-cad` | Modelador 3D por bloques primitivos | `STL` |
| 18 | 🗿 | **Clay Sculptor 3D** | `clay-sculptor` | Escultura digital en arcilla 3D | `STL` |
| 19 | 🍪 | **Cortadores de Galletas** | `cookie-cutter` | Cuchilla afilada y pestaña ergonómica | `STL` / `SVG` |

---

## 🪙 Economía de FabCoins & Carrocerías

* **FabCoins (FC):** Moneda educativa de mérito que las escuadras ganan al completar niveles de proyectos y participar en retos.
* **Carrocerías (Tiers Maker):**
  1. 🪵 **Nivel 1 — Madera & Cartón:** Acceso inicial.
  2. ⚡ **Nivel 2 — Acrílico & Neón:** Desbloqueado con 50 FC.
  3. 🤖 **Nivel 3 — Robótica & Filamento PLA:** Desbloqueado con 120 FC.
  4. 🔮 **Nivel 4 — Resina & Titanio Cibernético:** Desbloqueado con 250 FC.
* **Tienda de Recompensas:** Los alumnos pueden canjear tiempo de máquina (minutos de láser / impresión 3D), filamentos de colores especiales o kits electrónicos.

---

## 🚀 Guía de Instalación y Despliegue

### Requisitos del Sistema
* **PHP:** 8.2 o superior (Recomendado PHP 8.4)
* **Composer:** 2.x
* **Node.js:** 18.x o 20.x y npm
* **Base de Datos:** MySQL 8.0+ o MariaDB 10.5+

### Instalación en Entorno Local (Laragon / XAMPP)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tiogeny/makerdu.git
cd makerdu

# 2. Instalar dependencias PHP y JavaScript
composer install
npm install

# 3. Configurar variables de entorno
cp .env.example .env
php artisan key:generate

# 4. Configurar base de datos en .env y ejecutar migraciones con datos demo
php artisan migrate:fresh --seed

# 5. Compilar assets de frontend
npm run dev
# o para producción: npm run build
```

---

### Despliegue en Producción (cPanel / BanaHosting)

```bash
# Entrar al directorio raíz del proyecto
cd /home/usuario/makerdu_core

# Descargar las últimas actualizaciones
git pull origin main

# Actualizar base de datos y catálogo de micro-apps
ea-php84 artisan db:seed --force

# Limpiar y optimizar cachés
ea-php84 artisan optimize:clear
ea-php84 artisan config:cache
ea-php84 artisan route:cache
ea-php84 artisan view:cache
```

---

## 🔑 Credenciales de Acceso Demo

| Rol | Usuario / Código | Contraseña / PIN | URL de Acceso |
|---|---|---|---|
| 👑 **SuperAdmin** | `contacto@fablablima.org` | `password` | `/login` |
| 🎓 **Docente Demo 1** | `profesor@makerdu.com` | `password` | `/login` |
| 🎓 **Docente Demo 2** | `maria.torres@colegio.edu` | `password` | `/login` |
| 🚀 **Estudiante Demo 1** | Código Aula: `MK601` | PIN: `2468` | `/login` (Pestaña Estudiantes) |
| 🚀 **Estudiante Demo 2** | Código Aula: `MK402` | PIN: `1234` | `/login` (Pestaña Estudiantes) |

---

<div align="center">

Desarrollado con ❤️ para la comunidad de Educación STEAM y Fabricación Digital.
**Makerdu © 2026**

</div>
