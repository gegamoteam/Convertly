"use client";

import Link from "next/link";
import { Repeat, Github } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./Footer.module.css";

const GITHUB_URL = "https://github.com/gegamoteam/Convertly";

export function Footer() {
    const { t } = useI18n();

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <span className={styles.footerLogoIcon}>
                                <Repeat size={18} strokeWidth={2.5} />
                            </span>
                            Convertly
                        </div>
                        <p>{t("footer.desc")}</p>
                        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.footerGithub}>
                            <Github size={16} /> {t("footer.openSource")}
                        </a>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{t("footer.product")}</h4>
                        <ul>
                            <li><Link href="/convert">{t("footer.convertFiles")}</Link></li>
                            <li><Link href="/download">Media Download</Link></li>
                            <li><Link href="/#features">{t("footer.features")}</Link></li>
                            <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{t("footer.github")}</a></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{t("footer.formatsCol")}</h4>
                        <ul>
                            <li><Link href="/convert">{t("footer.images")}</Link></li>
                            <li><Link href="/convert">{t("footer.documents")}</Link></li>
                            <li><Link href="/convert">{t("footer.audioVideo")}</Link></li>
                            <li><Link href="/convert">{t("footer.dataFiles")}</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{t("footer.legal")}</h4>
                        <ul>
                            <li><Link href="/privacy">{t("footer.privacyPolicy")}</Link></li>
                            <li><Link href="/terms">{t("footer.termsOfService")}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span>
                        {t("footer.madeBy")}{" "}
                        <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                            Gegamo Team
                        </a>
                    </span>
                    <span>&copy; {new Date().getFullYear()} Convertly. {t("footer.rights")}</span>
                </div>
            </div>
        </footer>
    );
}
