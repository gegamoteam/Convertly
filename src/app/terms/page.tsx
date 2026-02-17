"use client";

import { useI18n } from "@/lib/i18n";
import styles from "../legal.module.css";

export default function TermsPage() {
    const { lang } = useI18n();

    if (lang === "es") return <TermsES />;
    return <TermsEN />;
}

function TermsEN() {
    return (
        <div className={styles.legalPage}>
            <div className={`container ${styles.legalContent}`}>
                <p className="section-label">Legal</p>
                <h1>Terms of Service</h1>
                <p className={styles.legalMeta}>Last updated: February 16, 2026</p>

                <div className={styles.legalHighlight}>
                    <p>
                        By using Convertly, you agree to these terms. Convertly is a free,
                        open-source file conversion tool that runs entirely in your browser.
                    </p>
                </div>

                <h2>Acceptance of Terms</h2>
                <p>
                    By accessing and using Convertly (&quot;the Service&quot;), you agree to be bound
                    by these Terms of Service. If you do not agree with any part of these terms,
                    do not use the Service.
                </p>

                <h2>Description of Service</h2>
                <p>
                    Convertly is a browser-based file conversion tool that processes files
                    entirely on your device. The Service is provided by the{" "}
                    <strong>Gegamo Team</strong> and is available at no cost.
                </p>

                <h2>Usage Rights</h2>
                <p>You may use Convertly to:</p>
                <ul>
                    <li>Convert files between supported formats</li>
                    <li>Compress files to reduce file size</li>
                    <li>Process multiple files in batch</li>
                    <li>Use the Service for personal and commercial purposes</li>
                </ul>

                <h2>Intellectual Property</h2>
                <p>
                    Convertly is open-source software released under the MIT License. The
                    source code is freely available for inspection, modification, and
                    distribution under the terms of the MIT License.
                </p>

                <h2>User Responsibilities</h2>
                <p>
                    You are solely responsible for the files you convert using Convertly.
                    You must ensure that you have the right to convert any files you process
                    through the Service.
                </p>

                <h2>Disclaimer of Warranties</h2>
                <p>
                    Convertly is provided &quot;as is&quot; without warranty of any kind, express or
                    implied. The Gegamo Team does not guarantee that the Service will be
                    uninterrupted, error-free, or that conversion results will meet specific
                    requirements.
                </p>

                <h2>Limitation of Liability</h2>
                <p>
                    Since all processing occurs locally in your browser, the Gegamo Team is
                    not responsible for any data loss, file corruption, or other issues that
                    may arise from using the Service. Always keep backups of your original
                    files.
                </p>

                <h2>Modifications to Terms</h2>
                <p>
                    We reserve the right to modify these terms at any time. Changes will be
                    posted on this page with an updated revision date. Continued use of the
                    Service after changes constitutes acceptance of the new terms.
                </p>

                <h2>Contact</h2>
                <p>
                    For questions about these terms, contact the{" "}
                    <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                        Gegamo Team
                    </a>.
                </p>
            </div>
        </div>
    );
}

function TermsES() {
    return (
        <div className={styles.legalPage}>
            <div className={`container ${styles.legalContent}`}>
                <p className="section-label">Legal</p>
                <h1>Términos de Servicio</h1>
                <p className={styles.legalMeta}>Última actualización: 16 de febrero de 2026</p>

                <div className={styles.legalHighlight}>
                    <p>
                        Al usar Convertly, aceptas estos términos. Convertly es una herramienta
                        de conversión de archivos gratuita y de código abierto que se ejecuta
                        completamente en tu navegador.
                    </p>
                </div>

                <h2>Aceptación de los Términos</h2>
                <p>
                    Al acceder y usar Convertly (&quot;el Servicio&quot;), aceptas estar sujeto
                    a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de
                    estos términos, no uses el Servicio.
                </p>

                <h2>Descripción del Servicio</h2>
                <p>
                    Convertly es una herramienta de conversión de archivos basada en el navegador
                    que procesa archivos completamente en tu dispositivo. El Servicio es
                    proporcionado por el <strong>Equipo Gegamo</strong> y está disponible sin costo.
                </p>

                <h2>Derechos de Uso</h2>
                <p>Puedes usar Convertly para:</p>
                <ul>
                    <li>Convertir archivos entre formatos soportados</li>
                    <li>Comprimir archivos para reducir su tamaño</li>
                    <li>Procesar múltiples archivos en lote</li>
                    <li>Usar el Servicio para fines personales y comerciales</li>
                </ul>

                <h2>Propiedad Intelectual</h2>
                <p>
                    Convertly es software de código abierto publicado bajo la Licencia MIT.
                    El código fuente está disponible libremente para inspección, modificación
                    y distribución bajo los términos de la Licencia MIT.
                </p>

                <h2>Responsabilidades del Usuario</h2>
                <p>
                    Eres el único responsable de los archivos que conviertes usando Convertly.
                    Debes asegurarte de tener el derecho de convertir cualquier archivo que
                    proceses a través del Servicio.
                </p>

                <h2>Descargo de Garantías</h2>
                <p>
                    Convertly se proporciona &quot;tal cual&quot; sin garantía de ningún tipo, expresa
                    o implícita. El Equipo Gegamo no garantiza que el Servicio será
                    ininterrumpido, libre de errores, o que los resultados de conversión
                    cumplirán con requisitos específicos.
                </p>

                <h2>Limitación de Responsabilidad</h2>
                <p>
                    Dado que todo el procesamiento ocurre localmente en tu navegador, el Equipo
                    Gegamo no es responsable de ninguna pérdida de datos, corrupción de archivos
                    u otros problemas que puedan surgir del uso del Servicio. Siempre mantén
                    copias de seguridad de tus archivos originales.
                </p>

                <h2>Modificaciones a los Términos</h2>
                <p>
                    Nos reservamos el derecho de modificar estos términos en cualquier momento.
                    Los cambios se publicarán en esta página con una fecha de revisión actualizada.
                    El uso continuado del Servicio después de los cambios constituye la aceptación
                    de los nuevos términos.
                </p>

                <h2>Contacto</h2>
                <p>
                    Para preguntas sobre estos términos, contacta al{" "}
                    <a href="https://gegamo.xyz" target="_blank" rel="noopener noreferrer">
                        Equipo Gegamo
                    </a>.
                </p>
            </div>
        </div>
    );
}
