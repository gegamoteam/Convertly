import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "Convertly Privacy Policy — We process nothing on our servers. All file conversions happen locally in your browser. No data is collected, stored, or transmitted.",
};

export default function PrivacyPage() {
    return (
        <div className={styles.legalPage}>
            <div className={`container ${styles.legalContent}`}>
                <p className="section-label">Legal</p>
                <h1>Privacy Policy</h1>
                <p className={styles.legalMeta}>Last updated: February 16, 2026</p>

                <div className={styles.legalHighlight}>
                    <p>
                        Convertly processes all files locally in your browser. We do not upload,
                        store, or transmit your files to any server.
                    </p>
                </div>

                <h2>Overview</h2>
                <p>
                    Convertly is built by the <strong>Gegamo Team</strong> with a core principle:
                    your data is yours. We created Convertly to be a file conversion tool that
                    respects your privacy by design, not as an afterthought.
                </p>

                <h2>Data Collection</h2>
                <p>
                    <strong>We do not collect any data.</strong> Specifically:
                </p>
                <ul>
                    <li>We do not upload your files to any server</li>
                    <li>We do not use cookies or tracking scripts</li>
                    <li>We do not use analytics services</li>
                    <li>We do not store any personal information</li>
                    <li>We do not log your IP address or browser information</li>
                    <li>We do not use third-party advertising</li>
                </ul>

                <h2>How File Conversion Works</h2>
                <p>
                    All file conversions are performed entirely within your web browser using
                    client-side JavaScript. When you select a file for conversion:
                </p>
                <ul>
                    <li>The file is read directly by your browser</li>
                    <li>Conversion processing happens using your device&apos;s computing power</li>
                    <li>The converted file is made available for download from your browser&apos;s memory</li>
                    <li>At no point does the file leave your device</li>
                </ul>

                <h2>Local Storage</h2>
                <p>
                    Convertly may use your browser&apos;s local storage to save preferences such as
                    theme settings. This data never leaves your device and can be cleared at
                    any time through your browser settings.
                </p>

                <h2>Third-Party Services</h2>
                <p>
                    Convertly does not integrate with any third-party services that could
                    access your data. We use Google Fonts for typography, which is loaded
                    directly from Google&apos;s CDN. Google&apos;s privacy policy applies to this
                    specific service.
                </p>

                <h2>Open Source</h2>
                <p>
                    Our commitment to privacy is backed by transparency. You can inspect our
                    source code to verify that no data is being transmitted from your device.
                </p>

                <h2>Changes to This Policy</h2>
                <p>
                    If we make changes to this privacy policy, we will update this page with
                    the new policy and the date of the update. Our core commitment to local-only
                    processing will not change.
                </p>

                <h2>Contact</h2>
                <p>
                    If you have questions about this privacy policy, contact the{" "}
                    <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                        Gegamo Team
                    </a>.
                </p>
            </div>
        </div>
    );
}
