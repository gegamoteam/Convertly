"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Repeat, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./Navbar.module.css";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { t, lang, setLang } = useI18n();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [mobileOpen]);

    const toggleLang = () => setLang(lang === "en" ? "es" : "en");

    return (
        <>
            <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
                <div className={styles.navbarInner}>
                    <Link href="/" className={styles.navbarLogo}>
                        <span className={styles.navbarLogoIcon}>
                            <Repeat size={20} strokeWidth={2.5} />
                        </span>
                        Convertly
                    </Link>

                    <ul className={styles.navbarLinks}>
                        <li><Link href="/#features">{t("nav.features")}</Link></li>
                        <li><Link href="/#formats">{t("nav.formats")}</Link></li>
                        <li><Link href="/#how-it-works">{t("nav.howItWorks")}</Link></li>
                        <li><Link href="/#faq">{t("nav.faq")}</Link></li>
                        <li><Link href="/privacy">{t("nav.privacy")}</Link></li>
                    </ul>

                    <div className={styles.navbarCta}>
                        <button onClick={toggleLang} className={styles.langToggle} title="Switch language">
                            <Globe size={16} /> {lang === "en" ? "ES" : "EN"}
                        </button>
                        <Link href="/convert" className="btn btn-primary">
                            {t("nav.start")} <ArrowRight size={16} />
                        </Link>
                    </div>

                    <button
                        className={styles.navbarMobileToggle}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div
                className={`${styles.mobileOverlay} ${mobileOpen ? styles.open : ""}`}
                onClick={() => setMobileOpen(false)}
            />
            <div className={`${styles.navbarMobileMenu} ${mobileOpen ? styles.open : ""}`}>
                <Link href="/#features" onClick={() => setMobileOpen(false)}>{t("nav.features")}</Link>
                <Link href="/#formats" onClick={() => setMobileOpen(false)}>{t("nav.formats")}</Link>
                <Link href="/#how-it-works" onClick={() => setMobileOpen(false)}>{t("nav.howItWorks")}</Link>
                <Link href="/#faq" onClick={() => setMobileOpen(false)}>{t("nav.faq")}</Link>
                <Link href="/privacy" onClick={() => setMobileOpen(false)}>{t("nav.privacy")}</Link>
                <Link href="/terms" onClick={() => setMobileOpen(false)}>Términos</Link>
                <button onClick={() => { toggleLang(); setMobileOpen(false); }} className={styles.langToggleMobile}>
                    <Globe size={16} /> {lang === "en" ? "Español" : "English"}
                </button>
                <Link href="/convert" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ marginTop: 24, textAlign: "center" }}>
                    {t("nav.start")} <ArrowRight size={16} />
                </Link>
            </div>
        </>
    );
}
