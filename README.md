# Makerdu v2.6

Plataforma LMS Figital y Orquestador de Fabricación Digital.
Desarrollado con Laravel 11, Inertia.js, Vue 3, Tailwind CSS y MySQL.

## Requisitos
- PHP 8.2+
- Composer
- Node.js & npm
- MySQL

## Instalación
1. Clonar el repositorio: git clone https://github.com/tiogeny/makerdu.git
2. Instalar dependencias: composer install y 
pm install
3. Configurar entorno: cp .env.example .env y php artisan key:generate
4. Ejecutar migraciones: php artisan migrate
5. Compilar frontend: 
pm run build o 
pm run dev

Para más detalles, consultar [PROJECT_STATE.md](PROJECT_STATE.md).
