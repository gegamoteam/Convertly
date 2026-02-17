"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./CTA.module.css";

export function CTA() {
    const { t } = useI18n();

    return (
        <section className={`section ${styles.cta}`}>
            <div className={styles.ctaBg}>
                <div className={styles.ctaGlow} />
            </div>
            <div className={`container ${styles.ctaContent}`}>
                <p className="section-label">{t("cta.label")}</p>
                <h2>
                    {t("cta.title")}
                    <span className="gradient-text">{t("cta.titleGradient")}</span>
                </h2>
                <p>
                    {t("cta.desc")}
                </p>
                <div className={styles.ctaActions}>
                    <Link href="/convert" className="btn btn-primary">
                        {t("cta.primary")} <ArrowRight size={16} />
                    </Link>
                    <Link href="/privacy" className="btn btn-secondary">
                        <Shield size={16} /> {t("cta.secondary")}
                    </Link>
                </div>
            </div>
        </section>
    );
}
