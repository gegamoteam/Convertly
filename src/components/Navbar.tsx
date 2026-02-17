"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Repeat } from "lucide-react";
import styles from "./Navbar.module.css";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
                        <li><Link href="/#features">Features</Link></li>
                        <li><Link href="/#formats">Formats</Link></li>
                        <li><Link href="/#how-it-works">How It Works</Link></li>
                        <li><Link href="/#faq">FAQ</Link></li>
                        <li><Link href="/privacy">Privacy</Link></li>
                    </ul>

                    <div className={styles.navbarCta}>
                        <Link href="/convert" className="btn btn-primary">
                            Start Converting <ArrowRight size={16} />
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
                <Link href="/#features" onClick={() => setMobileOpen(false)}>Features</Link>
                <Link href="/#formats" onClick={() => setMobileOpen(false)}>Formats</Link>
                <Link href="/#how-it-works" onClick={() => setMobileOpen(false)}>How It Works</Link>
                <Link href="/#faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
                <Link href="/privacy" onClick={() => setMobileOpen(false)}>Privacy</Link>
                <Link href="/terms" onClick={() => setMobileOpen(false)}>Terms</Link>
                <Link href="/convert" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ marginTop: 24, textAlign: "center" }}>
                    Start Converting <ArrowRight size={16} />
                </Link>
            </div>
        </>
    );
}
