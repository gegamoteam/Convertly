"use client";

import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./CTA.module.css";

const GITHUB_URL = "https://github.com/gegamoteam/Convertly";

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
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.githubBtn}>
                        <Github size={18} />
                        {t("cta.secondary")}
                    </a>
                </div>
            </div>
        </section>
    );
}
