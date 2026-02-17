import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
    title: "Terms of Service",
    description:
        "Convertly Terms of Service — Free, open-source file conversion by the Gegamo Team. All processing is done locally in your browser.",
};

export default function TermsPage() {
    return (
        <div className={styles.legalPage}>
            <div className={`container ${styles.legalContent}`}>
                <p className="section-label">Legal</p>
                <h1>Terms of Service</h1>
                <p className={styles.legalMeta}>Last updated: February 16, 2026</p>

                <div className={styles.legalHighlight}>
                    <p>
                        Convertly is a free tool provided as-is by the Gegamo Team.
                        By using Convertly, you agree to these terms.
                    </p>
                </div>

                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Convertly (&quot;the Service&quot;), you agree to be bound
                    by these Terms of Service. If you do not agree to these terms, please do
                    not use the Service.
                </p>

                <h2>2. Description of Service</h2>
                <p>
                    Convertly is a free, browser-based file conversion tool developed by the{" "}
                    <strong>Gegamo Team</strong>. The Service processes all files locally within
                    your web browser. No files are uploaded to or processed on any server.
                </p>

                <h2>3. Usage Rights</h2>
                <p>
                    Convertly is free to use for both personal and commercial purposes.
                    You may use the Service to convert files without limitation on the
                    number or frequency of conversions.
                </p>

                <h2>4. User Responsibilities</h2>
                <ul>
                    <li>
                        You are responsible for ensuring you have the right to convert the
                        files you process through Convertly
                    </li>
                    <li>
                        You agree not to use the Service for any unlawful purpose
                    </li>
                    <li>
                        You are solely responsible for backing up your original files before
                        conversion
                    </li>
                </ul>

                <h2>5. Intellectual Property</h2>
                <p>
                    Convertly does not claim any ownership or rights over the files you
                    convert. Your files remain entirely your property. The Convertly brand,
                    logo, and code are the property of the Gegamo Team.
                </p>

                <h2>6. Disclaimer of Warranties</h2>
                <p>
                    The Service is provided &quot;as is&quot; and &quot;as available&quot; without any
                    warranties of any kind, either express or implied. The Gegamo Team does
                    not guarantee that:
                </p>
                <ul>
                    <li>The Service will be uninterrupted or error-free</li>
                    <li>Conversion results will be perfectly accurate</li>
                    <li>The Service will meet your specific requirements</li>
                </ul>

                <h2>7. Limitation of Liability</h2>
                <p>
                    The Gegamo Team shall not be liable for any direct, indirect,
                    incidental, special, or consequential damages resulting from the use or
                    inability to use the Service, including but not limited to data loss or
                    file corruption.
                </p>

                <h2>8. Modifications</h2>
                <p>
                    The Gegamo Team reserves the right to modify these terms at any time.
                    Continued use of the Service after changes constitutes acceptance of the
                    new terms.
                </p>

                <h2>9. Governing Law</h2>
                <p>
                    These terms shall be governed by and construed in accordance with
                    applicable laws. Any disputes shall be resolved through good-faith
                    negotiation.
                </p>

                <h2>10. Contact</h2>
                <p>
                    For questions about these Terms of Service, contact the{" "}
                    <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                        Gegamo Team
                    </a>.
                </p>
            </div>
        </div>
    );
}
