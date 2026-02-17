import { Upload, RefreshCw, Download } from "lucide-react";
import styles from "./HowItWorks.module.css";

const steps = [
    {
        num: "1",
        icon: Upload,
        title: "Drop Your File",
        desc: "Drag and drop any supported file or click to browse. No size limits, no sign-ups.",
    },
    {
        num: "2",
        icon: RefreshCw,
        title: "Choose Format",
        desc: "Pick your target format. Conversion happens instantly, right in your browser.",
    },
    {
        num: "3",
        icon: Download,
        title: "Download Result",
        desc: "Your converted file is ready. Download it directly — nothing was uploaded anywhere.",
    },
];

export function HowItWorks() {
    return (
        <section className={`section ${styles.howItWorks}`} id="how-it-works">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">How It Works</p>
                    <h2 className="section-title">
                        Three steps,{" "}
                        <span className="gradient-text">zero compromises.</span>
                    </h2>
                    <p className="section-desc">
                        No accounts, no uploads, no waiting. Just fast, private conversion.
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
