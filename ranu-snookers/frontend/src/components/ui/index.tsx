/** Minimal, accessible component kit (shadcn-style API, Tailwind styling). */
import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brass" | "outline";
const variants: Record<Variant, string> = {
  primary: "bg-felt-500 hover:bg-felt-400 text-white shadow-sm",
  secondary: "bg-surface-2 hover:bg-felt-800 text-ink-50 border border-line",
  ghost: "hover:bg-surface-2 text-ink-100",
  danger: "bg-red-600/90 hover:bg-red-500 text-white",
  brass: "bg-brass-500 hover:bg-brass-400 text-felt-950 font-semibold shadow-sm",
  outline: "border border-line hover:border-felt-500 text-ink-50",
};
const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base", xl: "h-14 px-6 text-lg" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof sizes;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "md", loading, disabled, children, ...p }, ref) => (
  <button
    ref={ref}
    className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none select-none", variants[variant], sizes[size], className)}
    disabled={disabled || loading}
    {...p}
  >
    {loading && <Spinner className="size-4" />}
    {children}
  </button>
));
Button.displayName = "Button";

export function Spinner({ className }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-surface/90 p-4 sm:p-5", className)} {...p}>{children}</div>;
}

export function CardTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 className="text-base font-semibold text-ink-50">{children}</h2>
      {action}
    </div>
  );
}

const fieldBase = "w-full rounded-lg border border-line bg-felt-950/60 px-3 text-ink-50 placeholder:text-ink-500 focus:border-felt-400 focus:outline-none";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-10", className)} {...p} />
));
Input.displayName = "Input";
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cn(fieldBase, "h-10", className)} {...p}>{children}</select>
));
Select.displayName = "Select";
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-20 py-2", className)} {...p} />
));
Textarea.displayName = "Textarea";

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-ink-300">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-400">{hint}</span>}
      {error && <span className="block text-xs text-red-400" role="alert">{error}</span>}
    </label>
  );
}

const tones = {
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  red: "bg-red-500/15 text-red-300 ring-red-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  blue: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  gray: "bg-ink-500/20 text-ink-300 ring-ink-500/30",
  orange: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
};
export type Tone = keyof typeof tones;
export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>{children}</span>;
}

export function Stat({ label, value, tone, sub, onClick }: { label: string; value: ReactNode; tone?: "good" | "warn" | "bad"; sub?: ReactNode; onClick?: () => void }) {
  const color = tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : tone === "good" ? "text-emerald-300" : "text-ink-50";
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("rounded-2xl border border-line bg-surface/90 p-4 text-left", onClick && "hover:border-felt-500")}>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className={cn("num mt-1 text-2xl font-semibold", color)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-400">{sub}</div>}
    </Comp>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-400">{children}</div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : String(error);
  return <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{msg}</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 text-2xl leading-none text-ink-400 hover:text-ink-50" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {items.map((i) => (
        <button key={i.value} role="tab" aria-selected={value === i.value} onClick={() => onChange(i.value)}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm", value === i.value ? "bg-felt-600 text-white" : "text-ink-300 hover:text-ink-50")}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-400">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <div className="p-6 text-center text-sm text-ink-400">Nothing here yet.</div>}
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;

// ---------------------------------------------------------------- toasts
type ToastT = { id: number; text: string; tone: "ok" | "err" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "err") => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastT[]>([]);
  const push = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-lg", t.tone === "ok" ? "bg-felt-600 text-white" : "bg-red-600 text-white")}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
