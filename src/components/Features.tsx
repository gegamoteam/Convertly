import {
    Shield,
    Zap,
    Layers,
    EyeOff,
    CircleDollarSign,
    MonitorSmartphone,
    Lock,
    RefreshCw,
    HardDrive,
} from "lucide-react";
import styles from "./Features.module.css";

const features = [
    {
        icon: Shield,
        title: "100% Local Processing",
        desc: "Every conversion happens in your browser. Your files never touch a server.",
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        desc: "No upload/download delays. Conversion starts the moment you drop your file.",
    },
    {
        icon: Layers,
        title: "50+ Formats",
        desc: "Images, documents, audio, video, and data files. All the formats you need.",
    },
    {
        icon: EyeOff,
        title: "Zero Tracking",
        desc: "No analytics, no cookies, no data collection. Your privacy is absolute.",
    },
    {
        icon: CircleDollarSign,
        title: "Completely Free",
        desc: "No subscriptions, no limits, no hidden fees. Free forever.",
    },
    {
        icon: MonitorSmartphone,
        title: "Works Everywhere",
        desc: "Desktop, tablet, or phone. Works on any modern browser, any device.",
    },
    {
        icon: Lock,
        title: "End-to-End Secure",
        desc: "Files stay on your device. Nothing is stored, transmitted, or logged.",
    },
    {
        icon: RefreshCw,
        title: "Batch Conversion",
        desc: "Convert multiple files at once. Drag, drop, and download in seconds.",
    },
    {
        icon: HardDrive,
        title: "No Installation",
        desc: "Nothing to download or install. Open the page and start converting.",
    },
];

export function Features() {
    return (
        <section className={`section ${styles.features}`} id="features">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">Features</p>
                    <h2 className="section-title">
                        Privacy-first conversion,{" "}
                        <span className="gradient-text">no exceptions.</span>
                    </h2>
                    <p className="section-desc">
                        Built from the ground up for security. Your files never leave your device.
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
