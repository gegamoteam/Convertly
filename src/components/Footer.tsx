import Link from "next/link";
import { Repeat } from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
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
                        <p>
                            Free, private file conversion that runs entirely in your browser.
                            No uploads, no servers, no tracking.
                        </p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Product</h4>
                        <ul>
                            <li><Link href="/convert">Convert Files</Link></li>
                            <li><Link href="/#features">Features</Link></li>
                            <li><Link href="/#formats">Formats</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Formats</h4>
                        <ul>
                            <li><Link href="/convert">Images</Link></li>
                            <li><Link href="/convert">Documents</Link></li>
                            <li><Link href="/convert">Audio & Video</Link></li>
                            <li><Link href="/convert">Data Files</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>Legal</h4>
                        <ul>
                            <li><Link href="/privacy">Privacy Policy</Link></li>
                            <li><Link href="/terms">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span>
                        Made by{" "}
                        <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                            Gegamo Team
                        </a>
                    </span>
                    <span>&copy; {new Date().getFullYear()} Convertly. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
}
