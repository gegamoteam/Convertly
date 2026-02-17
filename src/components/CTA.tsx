import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import styles from "./CTA.module.css";

export function CTA() {
    return (
        <section className={`section ${styles.cta}`}>
            <div className={styles.ctaBg}>
                <div className={styles.ctaGlow} />
            </div>
            <div className={`container ${styles.ctaContent}`}>
                <p className="section-label">Ready to Convert?</p>
                <h2>
                    Start converting files{" "}
                    <span className="gradient-text">in seconds.</span>
                </h2>
                <p>
                    No sign-ups, no downloads, no tracking. Just drag, drop, and convert.
                </p>
                <div className={styles.ctaActions}>
                    <Link href="/convert" className="btn btn-primary">
                        Open Converter <ArrowRight size={16} />
                    </Link>
                    <Link href="/privacy" className="btn btn-secondary">
                        <Shield size={16} /> Our Privacy Promise
                    </Link>
                </div>
            </div>
        </section>
    );
}
