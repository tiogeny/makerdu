import { ref } from 'vue';
import es from './locales/es.json';
import en from './locales/en.json';

export const currentLang = ref(localStorage.getItem('makerdu_lang') || 'es');

export const dictionaries = {
    es,
    en,
};

export const setLanguage = (lang) => {
    if (dictionaries[lang]) {
        currentLang.value = lang;
        localStorage.setItem('makerdu_lang', lang);
    }
};

/**
 * Accede a claves anidadas tipo 'roles.Architect.name' o 'inspection_3d.title'
 */
export const t = (key) => {
    const lang = currentLang.value;
    const dict = dictionaries[lang] || dictionaries.es;

    const parts = key.split('.');
    let current = dict;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            // Fallback a español si no existe en el idioma actual
            let fallback = dictionaries.es;
            for (const fPart of parts) {
                if (fallback && typeof fallback === 'object' && fPart in fallback) {
                    fallback = fallback[fPart];
                } else {
                    return key;
                }
            }
            return fallback || key;
        }
    }

    return typeof current === 'string' ? current : key;
};
