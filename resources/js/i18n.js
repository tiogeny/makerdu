import { ref } from 'vue';

export const currentLang = ref(localStorage.getItem('makerdu_lang') || 'es');

export const translations = {
    es: {
        app_name: 'MAKERDU',
        portal_students: 'Portal de Alumnos y Escuadras',
        portal_teachers: 'War Room Docente',
        class_code: 'Código de Clase o Taller',
        secret_pin: 'Tu PIN Secreto de 4 Dígitos',
        enter_squad: 'INGRESAR A LA ESCUADRA',
        active_role_device: 'Panel de Escuadra: Rol Activo en Dispositivo',
        rule_1pc: 'Regla 1-PC',
        role_active: 'ACTIVO',
        project_roadmap: 'Malla del Proyecto',
        levels: 'Niveles',
        level_guide: 'Guía y Recursos del Nivel',
        preflight_lab: 'Laboratorio de Pre-flight Check IA (STL / SVG)',
        upload_design: 'Seleccionar archivo .STL o .SVG',
        run_preflight: 'Ejecutar Pre-flight Check',
        analyzing_file: 'Analizando archivo en 3D...',
        preflight_approved: 'PRE-FLIGHT APROBADO',
        preflight_rejected: 'CORRECCIÓN REQUERIDA',
        send_to_fabrication: 'ENVIAR A COLA DE FABRICACIÓN',
        fabcoins_balance: 'FabCoins (Insumos)',
        squad_xp: 'XP Escuadra',
        register_bitacora: 'Registrar Avance / Bitácora',
        send_evidence: 'ENVIAR EVIDENCIA (+25 XP)',
        view_3d: 'Visor 3D Interactivo',
        rotate_hint: 'Arrastra con el mouse para rotar el modelo 3D. Rueda para zoom.',
        print_bed: 'Cama de Impresión',
        max_boundary: 'Límite Máximo Permitido',
    },
    en: {
        app_name: 'MAKERDU',
        portal_students: 'Students & Squads Portal',
        portal_teachers: 'Teacher War Room',
        class_code: 'Class or Workshop Code',
        secret_pin: 'Your Secret 4-Digit PIN',
        enter_squad: 'ENTER SQUAD WORKSPACE',
        active_role_device: 'Squad Panel: Active Device Role',
        rule_1pc: '1-PC Rule',
        role_active: 'ACTIVE',
        project_roadmap: 'Project Roadmap',
        levels: 'Levels',
        level_guide: 'Level Guide & Resources',
        preflight_lab: 'AI Pre-flight Check Lab (STL / SVG)',
        upload_design: 'Select .STL or .SVG file',
        run_preflight: 'Run Pre-flight Check',
        analyzing_file: 'Analyzing 3D geometry...',
        preflight_approved: 'PRE-FLIGHT APPROVED',
        preflight_rejected: 'CORRECTION REQUIRED',
        send_to_fabrication: 'AUTHORIZE & SEND TO FABRICATION',
        fabcoins_balance: 'FabCoins (Real Materials)',
        squad_xp: 'Squad XP',
        register_bitacora: 'Register Progress / Logbook',
        send_evidence: 'SUBMIT EVIDENCE (+25 XP)',
        view_3d: 'Interactive 3D Viewer',
        rotate_hint: 'Click and drag to rotate the 3D model. Scroll to zoom.',
        print_bed: 'Print Bed Grid',
        max_boundary: 'Maximum Permitted Volume',
    }
};

export const setLanguage = (lang) => {
    if (translations[lang]) {
        currentLang.value = lang;
        localStorage.setItem('makerdu_lang', lang);
    }
};

export const t = (key) => {
    return translations[currentLang.value]?.[key] || translations['es']?.[key] || key;
};
