import Link from "next/link";
import {
    ArrowRight,
    Shield,
    Zap,
    Globe,
    Image,
    FileText,
    Music,
    Video,
    Database,
    Lock,
} from "lucide-react";
import styles from "./Hero.module.css";

export function Hero() {
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
                <div className={styles.floatIcon}><Globe size={20} /></div>
            </div>

            <div className={`container ${styles.heroContent}`}>
                <div className={styles.heroBadge}>
                    <span className="badge">
                        <Lock size={12} /> 100% Private &mdash; Runs Locally
                    </span>
                </div>

                <h1 className={styles.heroTitle}>
                    <span>Convert files,</span>
                    <span className="gradient-text">without compromise.</span>
                </h1>

                <p className={styles.heroDesc}>
                    Free, instant file conversion that runs entirely in your browser.
                    Your files never leave your device. No uploads, no servers, no tracking.
                </p>

                <div className={styles.heroActions}>
                    <Link href="/convert" className="btn btn-primary">
                        Start Converting <ArrowRight size={16} />
                    </Link>
                    <Link href="/#features" className="btn btn-secondary">
                        Learn More
                    </Link>
                </div>

                <div className={styles.heroTrust}>
                    <div className={styles.heroTrustItem}>
                        <Shield size={16} /> No Data Collection
                    </div>
                    <div className={styles.heroTrustItem}>
                        <Zap size={16} /> Instant Conversion
                    </div>
                    <div className={styles.heroTrustItem}>
                        <Globe size={16} /> 50+ Formats Supported
                    </div>
                </div>
            </div>
        </section>
    );
}
