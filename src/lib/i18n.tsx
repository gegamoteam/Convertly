"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type Lang = "en" | "es";

interface I18nContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string) => string;
    showSelector: boolean;
    dismissSelector: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────────────────────
const translations: Record<Lang, Record<string, string>> = {
    en: {
        // ── Navbar ──
        "nav.features": "Features",
        "nav.formats": "Formats",
        "nav.howItWorks": "How It Works",
        "nav.faq": "FAQ",
        "nav.privacy": "Privacy",
        "nav.start": "Start Converting",

        // ── Hero ──
        "hero.badge": "100% Private — Runs Locally",
        "hero.title1": "Convert files,",
        "hero.titleGradient": "without compromise.",
        "hero.desc": "Free, instant file conversion that runs entirely in your browser. Your files never leave your device. No uploads, no servers, no tracking.",
        "hero.cta": "Start Converting",
        "hero.ctaSecondary": "Learn More",
        "hero.trust1": "No Data Collection",
        "hero.trust2": "Instant Conversion",
        "hero.trust3": "100+ Formats Supported",

        // ── Features ──
        "features.label": "Features",
        "features.title": "Privacy-first conversion, ",
        "features.titleGradient": "no exceptions.",
        "features.desc": "Built from the ground up for security. Your files never leave your device.",
        "features.f1.title": "100% Local Processing",
        "features.f1.desc": "Every conversion happens in your browser. Your files never touch a server.",
        "features.f2.title": "Lightning Fast",
        "features.f2.desc": "No upload/download delays. Conversion starts the moment you drop your file.",
        "features.f3.title": "100+ Formats",
        "features.f3.desc": "Images, documents, audio, video, and data files. All the formats you need.",
        "features.f4.title": "Zero Tracking",
        "features.f4.desc": "No analytics, no cookies, no data collection. Your privacy is absolute.",
        "features.f5.title": "Completely Free",
        "features.f5.desc": "No subscriptions, no limits, no hidden fees. Free forever.",
        "features.f6.title": "Works Everywhere",
        "features.f6.desc": "Desktop, tablet, or phone. Works on any modern browser, any device.",
        "features.f7.title": "End-to-End Secure",
        "features.f7.desc": "Files stay on your device. Nothing is stored, transmitted, or logged.",
        "features.f8.title": "Batch Conversion",
        "features.f8.desc": "Convert multiple files at once. Drag, drop, and download in seconds.",
        "features.f9.title": "No Installation",
        "features.f9.desc": "Nothing to download or install. Open the page and start converting.",

        // ── How It Works ──
        "how.label": "How It Works",
        "how.title": "Three steps, ",
        "how.titleGradient": "zero compromises.",
        "how.desc": "No accounts, no uploads, no waiting. Just fast, private conversion.",
        "how.s1.title": "Drop Your File",
        "how.s1.desc": "Drag and drop any supported file or click to browse. No size limits, no sign-ups.",
        "how.s2.title": "Choose Format",
        "how.s2.desc": "Pick your target format. Conversion happens instantly, right in your browser.",
        "how.s3.title": "Download Result",
        "how.s3.desc": "Your converted file is ready. Download it directly — nothing was uploaded anywhere.",

        // ── Supported Formats ──
        "formats.label": "Supported Formats",
        "formats.title": "Every format you need, ",
        "formats.titleGradient": "all in one place.",
        "formats.desc": "100+ formats across images, audio, video, data, subtitles, and more — all converted locally.",
        "formats.images": "Images",
        "formats.audio": "Audio",
        "formats.video": "Video",
        "formats.documents": "Documents",
        "formats.data": "Data",
        "formats.subtitles": "Subtitles",

        // ── Stats ──
        "stats.s1.value": "100+",
        "stats.s1.label": "Supported Formats",
        "stats.s2.value": "0",
        "stats.s2.label": "Files Uploaded to Servers",
        "stats.s3.value": "100%",
        "stats.s3.label": "Client-Side Processing",
        "stats.s4.value": "0ms",
        "stats.s4.label": "Server Wait Time",

        // ── FAQ ──
        "faq.label": "FAQ",
        "faq.title": "Got questions? ",
        "faq.titleGradient": "We've got answers.",
        "faq.desc": "Everything you need to know about Convertly and how it works.",
        "faq.q1": "Is Convertly really free?",
        "faq.a1": "Yes, completely free with no hidden fees, subscriptions, or premium tiers. All features are available to everyone. Convertly is open-source and maintained by the Gegamo Team.",
        "faq.q2": "How does local processing work?",
        "faq.a2": "When you drop a file into Convertly, your browser handles the entire conversion using JavaScript and the Canvas API. The file never leaves your device. No data is sent to any server at any point during the process.",
        "faq.q3": "What file formats are supported?",
        "faq.a3": "We support 100+ formats across images (PNG, JPG, WEBP, GIF, BMP, SVG, TIFF, ICO), audio (MP3, WAV, FLAC, OGG), video (MP4, WEBM, AVI, MKV), documents (TXT, HTML, Markdown), and data files (JSON, CSV, XML, YAML, TSV). We're constantly adding more.",
        "faq.q4": "Is there a file size limit?",
        "faq.a4": "There's no hard limit imposed by Convertly. Since processing happens in your browser, the practical limit depends on your device's available memory. Most files up to several hundred MB work fine.",
        "faq.q5": "Can I convert multiple files at once?",
        "faq.a5": "Yes! Our batch conversion feature lets you drag and drop multiple files at once. Each file is processed independently and you can download them individually or all at once.",
        "faq.q6": "Do you collect any data or analytics?",
        "faq.a6": "No. Zero data collection, zero tracking, zero cookies, zero analytics. We don't even have a backend server. Your privacy is absolute and non-negotiable.",
        "faq.q7": "Can I adjust conversion quality?",
        "faq.a7": "Yes, for image conversions you can adjust the output quality using a slider. This is especially useful for lossy formats like JPG and WEBP where you want to balance quality vs file size.",
        "faq.q8": "Is Convertly open source?",
        "faq.a8": "Yes! Convertly is fully open-source under the MIT license. You can view, fork, and contribute to the codebase on GitHub. We welcome contributions from the community.",

        // ── CTA ──
        "cta.label": "Ready to Convert?",
        "cta.title": "Start converting files ",
        "cta.titleGradient": "in seconds.",
        "cta.desc": "No sign-ups, no downloads, no tracking. Just drag, drop, and convert.",
        "cta.primary": "Open Converter",
        "cta.secondary": "Our Privacy Promise",

        // ── Footer ──
        "footer.desc": "Free, private file conversion that runs entirely in your browser. No uploads, no servers, no tracking.",
        "footer.product": "Product",
        "footer.convertFiles": "Convert Files",
        "footer.features": "Features",
        "footer.formats": "Formats",
        "footer.formatsCol": "Formats",
        "footer.images": "Images",
        "footer.documents": "Documents",
        "footer.audioVideo": "Audio & Video",
        "footer.dataFiles": "Data Files",
        "footer.legal": "Legal",
        "footer.privacyPolicy": "Privacy Policy",
        "footer.termsOfService": "Terms of Service",
        "footer.madeBy": "Made by",
        "footer.rights": "All rights reserved.",

        // ── Convert Page ──
        "convert.label": "File Tools",
        "convert.titleConvert": "Convert your files ",
        "convert.titleConvertGradient": "instantly.",
        "convert.titleCompress": "Compress your files ",
        "convert.titleCompressGradient": "effortlessly.",
        "convert.descConvert": "100+ formats supported. Everything happens locally — nothing is uploaded.",
        "convert.descCompress": "Reduce file sizes without losing quality. 100% private, no uploads.",
        "convert.modeConvert": "Convert",
        "convert.modeConvertSub": "Change format",
        "convert.modeCompress": "Compress",
        "convert.new": "NEW",
        "convert.compressTitle": "Choose compression level",
        "convert.compressDesc": "Higher compression = smaller file, slightly lower quality",
        "convert.light": "Light",
        "convert.lightDesc": "Best quality",
        "convert.lightPercent": "~20% smaller",
        "convert.balanced": "Balanced",
        "convert.balancedDesc": "Recommended",
        "convert.balancedPercent": "~50% smaller",
        "convert.maximum": "Maximum",
        "convert.maximumDesc": "Smallest size",
        "convert.maximumPercent": "~70% smaller",
        "convert.saved": "Saved",
        "convert.dropFiles": "Drop files to",
        "convert.addMore": "Add more files",
        "convert.browse": "browse files",
        "convert.toGetStarted": " to get started",
        "convert.convertTo": "Convert to:",
        "convert.clearSelection": "Clear selection",
        "convert.filesWillTarget": "Files will automatically target",
        "convert.convertAll": "Convert All",
        "convert.compressAll": "Compress All",
        "convert.downloadAll": "Download All",
        "convert.reset": "Reset",
        "convert.clear": "Clear",
        "convert.file": "file",
        "convert.files": "files",
        "convert.done": "done",
        "convert.converting": "Converting",
        "convert.compressing": "Compressing",
        "convert.converted": "Converted",
        "convert.compressed": "Compressed",
        "convert.percentSaved": "saved",
        "convert.quality": "Quality",
        "convert.smaller": "Smaller",
        "convert.better": "Better",
        "convert.original": "Original",
        "convert.all": "All",
        "convert.images": "Images",
        "convert.audio": "Audio",
        "convert.video": "Video",
        "convert.docs": "Docs",
        "convert.data": "Data",
        "convert.subtitles": "Subtitles",
        "convert.failedPrefix": "Failed:",
        "convert.noConversions": "No conversions available for",

        // ── Language Selector ──
        "lang.title": "Choose your language",
        "lang.desc": "Select your preferred language for Convertly.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPANISH
    // ═══════════════════════════════════════════════════════════════════════
    es: {
        // ── Navbar ──
        "nav.features": "Características",
        "nav.formats": "Formatos",
        "nav.howItWorks": "Cómo Funciona",
        "nav.faq": "Preguntas",
        "nav.privacy": "Privacidad",
        "nav.start": "Empezar a Convertir",

        // ── Hero ──
        "hero.badge": "100% Privado — Se ejecuta localmente",
        "hero.title1": "Convierte archivos,",
        "hero.titleGradient": "sin compromisos.",
        "hero.desc": "Conversión de archivos gratuita e instantánea que se ejecuta completamente en tu navegador. Tus archivos nunca salen de tu dispositivo. Sin subidas, sin servidores, sin rastreo.",
        "hero.cta": "Empezar a Convertir",
        "hero.ctaSecondary": "Más Información",
        "hero.trust1": "Sin Recolección de Datos",
        "hero.trust2": "Conversión Instantánea",
        "hero.trust3": "100+ Formatos Soportados",

        // ── Features ──
        "features.label": "Características",
        "features.title": "Conversión con privacidad primero, ",
        "features.titleGradient": "sin excepciones.",
        "features.desc": "Construido desde cero para la seguridad. Tus archivos nunca salen de tu dispositivo.",
        "features.f1.title": "100% Procesamiento Local",
        "features.f1.desc": "Cada conversión ocurre en tu navegador. Tus archivos nunca tocan un servidor.",
        "features.f2.title": "Ultra Rápido",
        "features.f2.desc": "Sin demoras de subida/descarga. La conversión comienza en el momento en que sueltas tu archivo.",
        "features.f3.title": "100+ Formatos",
        "features.f3.desc": "Imágenes, documentos, audio, video y archivos de datos. Todos los formatos que necesitas.",
        "features.f4.title": "Cero Rastreo",
        "features.f4.desc": "Sin analíticas, sin cookies, sin recolección de datos. Tu privacidad es absoluta.",
        "features.f5.title": "Completamente Gratis",
        "features.f5.desc": "Sin suscripciones, sin límites, sin tarifas ocultas. Gratis para siempre.",
        "features.f6.title": "Funciona en Todas Partes",
        "features.f6.desc": "Escritorio, tableta o teléfono. Funciona en cualquier navegador moderno, en cualquier dispositivo.",
        "features.f7.title": "Seguridad de Extremo a Extremo",
        "features.f7.desc": "Los archivos permanecen en tu dispositivo. Nada se almacena, transmite o registra.",
        "features.f8.title": "Conversión por Lotes",
        "features.f8.desc": "Convierte múltiples archivos a la vez. Arrastra, suelta y descarga en segundos.",
        "features.f9.title": "Sin Instalación",
        "features.f9.desc": "Nada que descargar o instalar. Abre la página y empieza a convertir.",

        // ── How It Works ──
        "how.label": "Cómo Funciona",
        "how.title": "Tres pasos, ",
        "how.titleGradient": "cero compromisos.",
        "how.desc": "Sin cuentas, sin subidas, sin esperas. Solo conversión rápida y privada.",
        "how.s1.title": "Suelta Tu Archivo",
        "how.s1.desc": "Arrastra y suelta cualquier archivo soportado o haz clic para buscar. Sin límites de tamaño, sin registros.",
        "how.s2.title": "Elige el Formato",
        "how.s2.desc": "Selecciona tu formato de destino. La conversión ocurre instantáneamente en tu navegador.",
        "how.s3.title": "Descarga el Resultado",
        "how.s3.desc": "Tu archivo convertido está listo. Descárgalo directamente — nada fue subido a ningún lado.",

        // ── Supported Formats ──
        "formats.label": "Formatos Soportados",
        "formats.title": "Cada formato que necesitas, ",
        "formats.titleGradient": "todo en un solo lugar.",
        "formats.desc": "100+ formatos de imágenes, audio, video, datos, subtítulos y más — todo convertido localmente.",
        "formats.images": "Imágenes",
        "formats.audio": "Audio",
        "formats.video": "Video",
        "formats.documents": "Documentos",
        "formats.data": "Datos",
        "formats.subtitles": "Subtítulos",

        // ── Stats ──
        "stats.s1.value": "100+",
        "stats.s1.label": "Formatos Soportados",
        "stats.s2.value": "0",
        "stats.s2.label": "Archivos Subidos a Servidores",
        "stats.s3.value": "100%",
        "stats.s3.label": "Procesamiento Local",
        "stats.s4.value": "0ms",
        "stats.s4.label": "Tiempo de Espera del Servidor",

        // ── FAQ ──
        "faq.label": "Preguntas Frecuentes",
        "faq.title": "¿Tienes preguntas? ",
        "faq.titleGradient": "Tenemos respuestas.",
        "faq.desc": "Todo lo que necesitas saber sobre Convertly y cómo funciona.",
        "faq.q1": "¿Es Convertly realmente gratis?",
        "faq.a1": "Sí, completamente gratis sin tarifas ocultas, suscripciones ni niveles premium. Todas las funciones están disponibles para todos. Convertly es de código abierto y mantenido por el Equipo Gegamo.",
        "faq.q2": "¿Cómo funciona el procesamiento local?",
        "faq.a2": "Cuando sueltas un archivo en Convertly, tu navegador maneja toda la conversión usando JavaScript y la API Canvas. El archivo nunca sale de tu dispositivo. No se envían datos a ningún servidor en ningún momento del proceso.",
        "faq.q3": "¿Qué formatos de archivo son compatibles?",
        "faq.a3": "Soportamos más de 100 formatos de imágenes (PNG, JPG, WEBP, GIF, BMP, SVG, TIFF, ICO), audio (MP3, WAV, FLAC, OGG), video (MP4, WEBM, AVI, MKV), documentos (TXT, HTML, Markdown) y datos (JSON, CSV, XML, YAML, TSV). Estamos constantemente añadiendo más.",
        "faq.q4": "¿Hay un límite de tamaño de archivo?",
        "faq.a4": "No hay un límite estricto impuesto por Convertly. Como el procesamiento ocurre en tu navegador, el límite práctico depende de la memoria disponible de tu dispositivo. La mayoría de archivos de hasta varios cientos de MB funcionan bien.",
        "faq.q5": "¿Puedo convertir varios archivos a la vez?",
        "faq.a5": "¡Sí! Nuestra función de conversión por lotes te permite arrastrar y soltar múltiples archivos a la vez. Cada archivo se procesa de forma independiente y puedes descargarlos individualmente o todos a la vez.",
        "faq.q6": "¿Recopilan algún dato o analítica?",
        "faq.a6": "No. Cero recolección de datos, cero rastreo, cero cookies, cero analíticas. Ni siquiera tenemos un servidor backend. Tu privacidad es absoluta y no negociable.",
        "faq.q7": "¿Puedo ajustar la calidad de conversión?",
        "faq.a7": "Sí, para conversiones de imágenes puedes ajustar la calidad de salida usando un control deslizante. Esto es especialmente útil para formatos con pérdida como JPG y WEBP donde quieres equilibrar calidad vs tamaño de archivo.",
        "faq.q8": "¿Es Convertly de código abierto?",
        "faq.a8": "¡Sí! Convertly es completamente de código abierto bajo la licencia MIT. Puedes ver, bifurcar y contribuir al código en GitHub. Damos la bienvenida a contribuciones de la comunidad.",

        // ── CTA ──
        "cta.label": "¿Listo para Convertir?",
        "cta.title": "Empieza a convertir archivos ",
        "cta.titleGradient": "en segundos.",
        "cta.desc": "Sin registros, sin descargas, sin rastreo. Solo arrastra, suelta y convierte.",
        "cta.primary": "Abrir Convertidor",
        "cta.secondary": "Nuestra Promesa de Privacidad",

        // ── Footer ──
        "footer.desc": "Conversión de archivos gratuita y privada que se ejecuta completamente en tu navegador. Sin subidas, sin servidores, sin rastreo.",
        "footer.product": "Producto",
        "footer.convertFiles": "Convertir Archivos",
        "footer.features": "Características",
        "footer.formats": "Formatos",
        "footer.formatsCol": "Formatos",
        "footer.images": "Imágenes",
        "footer.documents": "Documentos",
        "footer.audioVideo": "Audio y Video",
        "footer.dataFiles": "Archivos de Datos",
        "footer.legal": "Legal",
        "footer.privacyPolicy": "Política de Privacidad",
        "footer.termsOfService": "Términos de Servicio",
        "footer.madeBy": "Creado por",
        "footer.rights": "Todos los derechos reservados.",

        // ── Convert Page ──
        "convert.label": "Herramientas de Archivos",
        "convert.titleConvert": "Convierte tus archivos ",
        "convert.titleConvertGradient": "al instante.",
        "convert.titleCompress": "Comprime tus archivos ",
        "convert.titleCompressGradient": "sin esfuerzo.",
        "convert.descConvert": "100+ formatos soportados. Todo ocurre localmente — nada se sube.",
        "convert.descCompress": "Reduce el tamaño de archivos sin perder calidad. 100% privado, sin subidas.",
        "convert.modeConvert": "Convertir",
        "convert.modeConvertSub": "Cambiar formato",
        "convert.modeCompress": "Comprimir",
        "convert.new": "NUEVO",
        "convert.compressTitle": "Elige el nivel de compresión",
        "convert.compressDesc": "Mayor compresión = archivo más pequeño, calidad ligeramente menor",
        "convert.light": "Ligera",
        "convert.lightDesc": "Mejor calidad",
        "convert.lightPercent": "~20% más pequeño",
        "convert.balanced": "Balanceada",
        "convert.balancedDesc": "Recomendado",
        "convert.balancedPercent": "~50% más pequeño",
        "convert.maximum": "Máxima",
        "convert.maximumDesc": "Menor tamaño",
        "convert.maximumPercent": "~70% más pequeño",
        "convert.saved": "Ahorro",
        "convert.dropFiles": "Suelta archivos para",
        "convert.addMore": "Agregar más archivos",
        "convert.browse": "buscar archivos",
        "convert.toGetStarted": " para comenzar",
        "convert.convertTo": "Convertir a:",
        "convert.clearSelection": "Borrar selección",
        "convert.filesWillTarget": "Los archivos se convertirán automáticamente a",
        "convert.convertAll": "Convertir Todo",
        "convert.compressAll": "Comprimir Todo",
        "convert.downloadAll": "Descargar Todo",
        "convert.reset": "Reiniciar",
        "convert.clear": "Limpiar",
        "convert.file": "archivo",
        "convert.files": "archivos",
        "convert.done": "listo",
        "convert.converting": "Convirtiendo",
        "convert.compressing": "Comprimiendo",
        "convert.converted": "Convertido",
        "convert.compressed": "Comprimido",
        "convert.percentSaved": "ahorrado",
        "convert.quality": "Calidad",
        "convert.smaller": "Más pequeño",
        "convert.better": "Mejor",
        "convert.original": "Original",
        "convert.all": "Todos",
        "convert.images": "Imágenes",
        "convert.audio": "Audio",
        "convert.video": "Video",
        "convert.docs": "Documentos",
        "convert.data": "Datos",
        "convert.subtitles": "Subtítulos",
        "convert.failedPrefix": "Error:",
        "convert.noConversions": "No hay conversiones disponibles para",

        // ── Language Selector ──
        "lang.title": "Elige tu idioma",
        "lang.desc": "Selecciona tu idioma preferido para Convertly.",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const I18nContext = createContext<I18nContextType>({
    lang: "en",
    setLang: () => { },
    t: (key: string) => key,
    showSelector: false,
    dismissSelector: () => { },
});

export const useI18n = () => useContext(I18nContext);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
function detectLanguage(): Lang {
    if (typeof navigator === "undefined") return "en";
    const browserLang = navigator.language || "";
    if (browserLang.startsWith("es")) return "es";
    return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>("en");
    const [showSelector, setShowSelector] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("convertly-lang") as Lang | null;
        const hasChosen = localStorage.getItem("convertly-lang-chosen");

        if (saved && (saved === "en" || saved === "es")) {
            setLangState(saved);
        } else {
            setLangState(detectLanguage());
        }

        if (!hasChosen) {
            setShowSelector(true);
        }

        setMounted(true);
    }, []);

    const setLang = useCallback((l: Lang) => {
        setLangState(l);
        localStorage.setItem("convertly-lang", l);
        localStorage.setItem("convertly-lang-chosen", "1");
        document.documentElement.lang = l;
    }, []);

    const dismissSelector = useCallback(() => {
        setShowSelector(false);
        localStorage.setItem("convertly-lang-chosen", "1");
        localStorage.setItem("convertly-lang", lang);
    }, [lang]);

    const t = useCallback((key: string): string => {
        return translations[lang][key] || translations.en[key] || key;
    }, [lang]);

    if (!mounted) return null;

    return (
        <I18nContext.Provider value={{ lang, setLang, t, showSelector, dismissSelector }}>
            {children}
        </I18nContext.Provider>
    );
}
