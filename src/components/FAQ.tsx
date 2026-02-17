"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./FAQ.module.css";

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const { t } = useI18n();

    const faqs = [
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
        { q: t("faq.q3"), a: t("faq.a3") },
        { q: t("faq.q4"), a: t("faq.a4") },
        { q: t("faq.q5"), a: t("faq.a5") },
        { q: t("faq.q6"), a: t("faq.a6") },
        { q: t("faq.q7"), a: t("faq.a7") },
        { q: t("faq.q8"), a: t("faq.a8") },
    ];

    return (
        <section className={`section ${styles.faq}`} id="faq">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">{t("faq.label")}</p>
                    <h2 className="section-title">
                        {t("faq.title")}
                        <span className="gradient-text">{t("faq.titleGradient")}</span>
                    </h2>
                    <p className="section-desc">
                        {t("faq.desc")}
                    </p>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`${styles.faqItem} ${openIndex === i ? styles.faqOpen : ""}`}
                        >
                            <button
                                className={styles.faqQuestion}
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                aria-expanded={openIndex === i}
                            >
                                <span>{faq.q}</span>
                                <ChevronDown size={20} className={styles.faqChevron} />
                            </button>
                            <div className={styles.faqAnswer}>
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
