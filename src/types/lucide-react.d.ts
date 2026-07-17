declare module "lucide-react" {
    import type {
        ForwardRefExoticComponent,
        RefAttributes,
        SVGProps,
    } from "react";

    export interface LucideProps extends SVGProps<SVGSVGElement> {
        absoluteStrokeWidth?: boolean;
        size?: number | string;
    }

    export type LucideIcon = ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;

    export const AlertTriangle: LucideIcon;
    export const Archive: LucideIcon;
    export const ArrowDownCircle: LucideIcon;
    export const ArrowRight: LucideIcon;
    export const BookOpen: LucideIcon;
    export const Check: LucideIcon;
    export const CheckCircle: LucideIcon;
    export const ChevronDown: LucideIcon;
    export const ClipboardPaste: LucideIcon;
    export const Code2: LucideIcon;
    export const Copy: LucideIcon;
    export const Database: LucideIcon;
    export const Disc3: LucideIcon;
    export const Download: LucideIcon;
    export const ExternalLink: LucideIcon;
    export const Eye: LucideIcon;
    export const EyeOff: LucideIcon;
    export const FileAudio: LucideIcon;
    export const FileText: LucideIcon;
    export const FileVideo: LucideIcon;
    export const Github: LucideIcon;
    export const Globe: LucideIcon;
    export const HardDrive: LucideIcon;
    export const Headphones: LucideIcon;
    export const Image: LucideIcon;
    export const Info: LucideIcon;
    export const Layers: LucideIcon;
    export const Link2: LucideIcon;
    export const Loader2: LucideIcon;
    export const Lock: LucideIcon;
    export const Menu: LucideIcon;
    export const MonitorPlay: LucideIcon;
    export const MonitorSmartphone: LucideIcon;
    export const Music: LucideIcon;
    export const Package: LucideIcon;
    export const RefreshCw: LucideIcon;
    export const Repeat: LucideIcon;
    export const Settings2: LucideIcon;
    export const Shield: LucideIcon;
    export const ShieldCheck: LucideIcon;
    export const Shrink: LucideIcon;
    export const Sparkles: LucideIcon;
    export const Subtitles: LucideIcon;
    export const Trash2: LucideIcon;
    export const Upload: LucideIcon;
    export const Video: LucideIcon;
    export const X: LucideIcon;
    export const Youtube: LucideIcon;
    export const Zap: LucideIcon;
}
