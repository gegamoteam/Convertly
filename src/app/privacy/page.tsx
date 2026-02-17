"use client";

import { useI18n } from "@/lib/i18n";
import styles from "../legal.module.css";

export default function PrivacyPage() {
    const { lang } = useI18n();

    if (lang === "es") return <PrivacyES />;
    return <PrivacyEN />;
}

function PrivacyEN() {
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
                    language and theme settings. This data never leaves your device and can be cleared at
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

function PrivacyES() {
    return (
        <div className={styles.legalPage}>
            <div className={`container ${styles.legalContent}`}>
                <p className="section-label">Legal</p>
                <h1>Política de Privacidad</h1>
                <p className={styles.legalMeta}>Última actualización: 16 de febrero de 2026</p>

                <div className={styles.legalHighlight}>
                    <p>
                        Convertly procesa todos los archivos localmente en tu navegador. No subimos,
                        almacenamos ni transmitimos tus archivos a ningún servidor.
                    </p>
                </div>

                <h2>Descripción General</h2>
                <p>
                    Convertly está construido por el <strong>Equipo Gegamo</strong> con un principio
                    fundamental: tus datos son tuyos. Creamos Convertly para ser una herramienta de
                    conversión de archivos que respeta tu privacidad por diseño, no como una
                    consideración secundaria.
                </p>

                <h2>Recolección de Datos</h2>
                <p>
                    <strong>No recolectamos ningún dato.</strong> Específicamente:
                </p>
                <ul>
                    <li>No subimos tus archivos a ningún servidor</li>
                    <li>No usamos cookies ni scripts de rastreo</li>
                    <li>No usamos servicios de analítica</li>
                    <li>No almacenamos información personal</li>
                    <li>No registramos tu dirección IP ni información del navegador</li>
                    <li>No usamos publicidad de terceros</li>
                </ul>

                <h2>Cómo Funciona la Conversión de Archivos</h2>
                <p>
                    Todas las conversiones de archivos se realizan completamente dentro de tu
                    navegador web usando JavaScript del lado del cliente. Cuando seleccionas un
                    archivo para convertir:
                </p>
                <ul>
                    <li>El archivo es leído directamente por tu navegador</li>
                    <li>El procesamiento de conversión ocurre usando la potencia de cómputo de tu dispositivo</li>
                    <li>El archivo convertido se pone a disposición para descargar desde la memoria de tu navegador</li>
                    <li>En ningún momento el archivo sale de tu dispositivo</li>
                </ul>

                <h2>Almacenamiento Local</h2>
                <p>
                    Convertly puede usar el almacenamiento local de tu navegador para guardar
                    preferencias como el idioma y la configuración del tema. Estos datos nunca
                    salen de tu dispositivo y pueden ser eliminados en cualquier momento a
                    través de la configuración de tu navegador.
                </p>

                <h2>Servicios de Terceros</h2>
                <p>
                    Convertly no se integra con ningún servicio de terceros que pueda acceder
                    a tus datos. Usamos Google Fonts para la tipografía, que se carga
                    directamente desde la CDN de Google. La política de privacidad de Google
                    aplica a este servicio específico.
                </p>

                <h2>Código Abierto</h2>
                <p>
                    Nuestro compromiso con la privacidad está respaldado por la transparencia.
                    Puedes inspeccionar nuestro código fuente para verificar que no se transmite
                    ningún dato desde tu dispositivo.
                </p>

                <h2>Cambios en Esta Política</h2>
                <p>
                    Si realizamos cambios en esta política de privacidad, actualizaremos esta
                    página con la nueva política y la fecha de la actualización. Nuestro compromiso
                    fundamental con el procesamiento exclusivamente local no cambiará.
                </p>

                <h2>Contacto</h2>
                <p>
                    Si tienes preguntas sobre esta política de privacidad, contacta al{" "}
                    <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                        Equipo Gegamo
                    </a>.
                </p>
            </div>
        </div>
    );
}
