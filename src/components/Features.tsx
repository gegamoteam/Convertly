"use client";

import {
    Shield, Zap, Layers, EyeOff,
    Code2, MonitorSmartphone, Lock, RefreshCw, HardDrive,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./Features.module.css";

export function Features() {
    const { t } = useI18n();

    const features = [
        { icon: Shield, title: t("features.f1.title"), desc: t("features.f1.desc") },
        { icon: Zap, title: t("features.f2.title"), desc: t("features.f2.desc") },
        { icon: Layers, title: t("features.f3.title"), desc: t("features.f3.desc") },
        { icon: EyeOff, title: t("features.f4.title"), desc: t("features.f4.desc") },
        { icon: Code2, title: t("features.f5.title"), desc: t("features.f5.desc") },
        { icon: MonitorSmartphone, title: t("features.f6.title"), desc: t("features.f6.desc") },
        { icon: Lock, title: t("features.f7.title"), desc: t("features.f7.desc") },
        { icon: RefreshCw, title: t("features.f8.title"), desc: t("features.f8.desc") },
        { icon: HardDrive, title: t("features.f9.title"), desc: t("features.f9.desc") },
    ];

    return (
        <section className={`section ${styles.features}`} id="features">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">{t("features.label")}</p>
                    <h2 className="section-title">
                        {t("features.title")}
                        <span className="gradient-text">{t("features.titleGradient")}</span>
                    </h2>
                    <p className="section-desc">
                        {t("features.desc")}
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    {features.map((f, i) => (
                        <div key={i} className={`glass-card ${styles.featureCard} animate-in`}>
                            <div className={styles.featureIcon}>
                                <f.icon size={22} strokeWidth={1.8} />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
