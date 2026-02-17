"use client";

import Link from "next/link";
import {
    ArrowRight, Shield, Zap,
    Image, FileText, Music, Video, Database, Github, Code2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./Hero.module.css";

const GITHUB_URL = "https://github.com/gegamoteam/Convertly";

export function Hero() {
    const { t } = useI18n();

    return (
        <section className={styles.hero}>
            <div className={styles.heroBg}>
                <div className={`${styles.heroGlow} ${styles.heroGlow1}`} />
                <div className={`${styles.heroGlow} ${styles.heroGlow2}`} />
                <div className={styles.heroGridLines} />
            </div>

            <div className={styles.heroFloatIcons}>
                <div className={styles.floatIcon}><Image size={20} /></div>
                <div className={styles.floatIcon}><FileText size={20} /></div>
                <div className={styles.floatIcon}><Music size={20} /></div>
                <div className={styles.floatIcon}><Video size={20} /></div>
                <div className={styles.floatIcon}><Database size={20} /></div>
                <div className={styles.floatIcon}><Code2 size={20} /></div>
            </div>

            <div className={`container ${styles.heroContent}`}>
                <div className={styles.heroBadge}>
                    <span className="badge">
                        <Shield size={12} /> {t("hero.badge")}
                    </span>
                </div>

                <h1 className={styles.heroTitle}>
                    <span>{t("hero.title1")}</span>
                    <span className="gradient-text">{t("hero.titleGradient")}</span>
                </h1>

                <p className={styles.heroDesc}>
                    {t("hero.desc")}
                </p>

                <div className={styles.heroActions}>
                    <Link href="/convert" className="btn btn-primary">
                        {t("hero.cta")} <ArrowRight size={16} />
                    </Link>
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.githubBtn}>
                        <Github size={18} />
                        {t("hero.github")}
                    </a>
                </div>

                <div className={styles.heroTrust}>
                    <div className={styles.heroTrustItem}>
                        <Shield size={16} /> {t("hero.trust1")}
                    </div>
                    <div className={styles.heroTrustItem}>
                        <Code2 size={16} /> {t("hero.trust2")}
                    </div>
                    <div className={styles.heroTrustItem}>
                        <Zap size={16} /> {t("hero.trust3")}
                    </div>
                </div>
            </div>
        </section>
    );
}
