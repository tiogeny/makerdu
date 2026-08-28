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
 * Accede a claves estáticas de la interfaz tipo 'nav.techniques' o 'auth.email'
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

/**
 * Accede a contenido dinámico bilingüe de la BD: { "es": "...", "en": "..." }
 */
export const trans = (jsonObj, fallback = '') => {
    if (!jsonObj) return fallback;
    if (typeof jsonObj === 'string') return jsonObj;

    const lang = currentLang.value;
    if (jsonObj[lang] && typeof jsonObj[lang] === 'string' && jsonObj[lang].trim() !== '') {
        return jsonObj[lang];
    }
    if (jsonObj.es && typeof jsonObj.es === 'string' && jsonObj.es.trim() !== '') {
        return jsonObj.es;
    }
    if (jsonObj.en && typeof jsonObj.en === 'string' && jsonObj.en.trim() !== '') {
        return jsonObj.en;
    }
    return fallback;
};
