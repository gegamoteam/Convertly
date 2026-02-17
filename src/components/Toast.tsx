"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertTriangle, X, Info } from "lucide-react";
import styles from "./Toast.module.css";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => { } });

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = ++toastIdCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setExiting(true), 3500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (exiting) {
            const timer = setTimeout(() => onRemove(toast.id), 300);
            return () => clearTimeout(timer);
        }
    }, [exiting, onRemove, toast.id]);

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertTriangle size={18} />,
        info: <Info size={18} />,
    };

    return (
        <div className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.exiting : ""}`}>
            <span className={styles.toastIcon}>{icons[toast.type]}</span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => setExiting(true)}>
                <X size={14} />
            </button>
        </div>
    );
}
