"use client";

import { useI18n } from "@/lib/i18n";
import styles from "./LanguageSelector.module.css";

export function LanguageSelector() {
    const { showSelector, setLang, dismissSelector, t } = useI18n();

    if (!showSelector) return null;

    return (
        <div className={styles.overlay} onClick={dismissSelector}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalIcon}>🌐</div>
                <h2>{t("lang.title")}</h2>
                <p>{t("lang.desc")}</p>
                <div className={styles.options}>
                    <button
                        className={styles.option}
                        onClick={() => { setLang("en"); dismissSelector(); }}
                    >
                        <span className={styles.flag}>🇺🇸</span>
                        <span className={styles.optionLabel}>English</span>
                    </button>
                    <button
                        className={styles.option}
                        onClick={() => { setLang("es"); dismissSelector(); }}
                    >
                        <span className={styles.flag}>🇪🇸</span>
                        <span className={styles.optionLabel}>Español</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
