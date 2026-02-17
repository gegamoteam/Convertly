import styles from "./Stats.module.css";

const stats = [
    { value: "100+", label: "Supported Formats" },
    { value: "0", label: "Files Uploaded to Servers" },
    { value: "100%", label: "Client-Side Processing" },
    { value: "0ms", label: "Server Wait Time" },
];

export function Stats() {
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
