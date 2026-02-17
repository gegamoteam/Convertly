"use client";

import { useI18n } from "@/lib/i18n";
import styles from "./Stats.module.css";

export function Stats() {
    const { t } = useI18n();

    const stats = [
        { value: t("stats.s1.value"), label: t("stats.s1.label") },
        { value: t("stats.s2.value"), label: t("stats.s2.label") },
        { value: t("stats.s3.value"), label: t("stats.s3.label") },
        { value: t("stats.s4.value"), label: t("stats.s4.label") },
    ];

    return (
        <section className={`section ${styles.stats}`}>
            <div className="container">
                <div className={styles.statsGrid}>
                    {stats.map((stat, i) => (
                        <div key={i} className={`${styles.statItem} animate-in`}>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
