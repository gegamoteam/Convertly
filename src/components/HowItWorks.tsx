"use client";

import { Upload, RefreshCw, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
    const { t } = useI18n();

    const steps = [
        { num: "1", icon: Upload, title: t("how.s1.title"), desc: t("how.s1.desc") },
        { num: "2", icon: RefreshCw, title: t("how.s2.title"), desc: t("how.s2.desc") },
        { num: "3", icon: Download, title: t("how.s3.title"), desc: t("how.s3.desc") },
    ];

    return (
        <section className={`section ${styles.howItWorks}`} id="how-it-works">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">{t("how.label")}</p>
                    <h2 className="section-title">
                        {t("how.title")}
                        <span className="gradient-text">{t("how.titleGradient")}</span>
                    </h2>
                    <p className="section-desc">
                        {t("how.desc")}
                    </p>
                </div>

                <div className={styles.steps}>
                    {steps.map((s, i) => (
                        <div key={i} className={`${styles.step} animate-in`}>
                            <div className={styles.stepNumber}>{s.num}</div>
                            <s.icon size={28} strokeWidth={1.5} className={styles.stepIcon} />
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
