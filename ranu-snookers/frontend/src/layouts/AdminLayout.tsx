import { useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import { useRealtime } from "@/hooks/useRealtime";
import { Logo } from "@/layouts/PublicLayout";
import { Select, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

export const ADMIN_NAV: { to: string; label: string; perm: string; icon: string }[] = [
  { to: "/admin", label: "Dashboard", perm: "tables.view", icon: "◉" },
  { to: "/admin/tables", label: "Tables", perm: "tables.view", icon: "▦" },
  { to: "/admin/bookings", label: "Bookings", perm: "bookings.view", icon: "🗓" },
  { to: "/admin/billing", label: "Billing", perm: "billing.operate", icon: "₹" },
  { to: "/admin/pos", label: "POS", perm: "pos.sell", icon: "🥤" },
  { to: "/admin/customers", label: "Customers", perm: "customers.view", icon: "👤" },
  { to: "/admin/memberships", label: "Memberships", perm: "customers.view", icon: "★" },
  { to: "/admin/inventory", label: "Inventory", perm: "inventory.manage", icon: "📦" },
  { to: "/admin/shift", label: "Shift & Expenses", perm: "shifts.operate", icon: "⏱" },
  { to: "/admin/devices", label: "Devices", perm: "devices.view", icon: "📡" },
  { to: "/admin/tournaments", label: "Tournaments", perm: "tables.view", icon: "🏆" },
  { to: "/admin/reports", label: "Reports", perm: "reports.view", icon: "📈" },
  { to: "/admin/approvals", label: "Approvals & Alerts", perm: "tables.view", icon: "⚑" },
  { to: "/admin/settings", label: "Settings", perm: "settings.manage", icon: "⚙" },
  { to: "/admin/users", label: "Users & Roles", perm: "users.manage", icon: "🔑" },
  { to: "/admin/audit", label: "Audit log", perm: "audit.view", icon: "📜" },
];

export function AdminLayout() {
  const { me, ready, isStaff, can, branch, branches, setBranch, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const live = useRealtime(isStaff ? branch?.id : undefined, "staff");
  if (!ready) return <div className="grid h-full place-items-center"><Spinner /></div>;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!isStaff) return <Navigate to="/my/bookings" replace />;
  const nav = ADMIN_NAV.filter((n) => can(n.perm));

  const Sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Admin">
      <div className="px-2 pb-4 pt-1"><Logo /></div>
      {nav.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === "/admin"} onClick={() => setOpen(false)}
          className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", isActive ? "bg-felt-600 text-white" : "text-ink-300 hover:bg-surface-2 hover:text-ink-50")}>
          <span aria-hidden className="w-5 text-center">{n.icon}</span>{n.label}
        </NavLink>
      ))}
      <div className="mt-auto space-y-2 border-t border-line pt-3 text-xs text-ink-400">
        <div className="px-2">{me.user.full_name} · {me.roles.map((r) => r.name).join(", ")}</div>
        <button className="px-2 text-ink-300 hover:text-ink-50" onClick={logout}>Sign out</button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-full bg-felt-950">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-felt-900 lg:block">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 border-r border-line bg-felt-900" onClick={(e) => e.stopPropagation()}>{Sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-felt-950/90 px-4 backdrop-blur">
          <button className="rounded-md p-1 text-xl lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
          {branches.length > 1 ? (
            <Select aria-label="Branch" className="h-9 max-w-56" value={branch?.id} onChange={(e) => { const b = branches.find((x) => x.id === e.target.value); if (b) setBranch(b); }}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          ) : <div className="text-sm font-medium">{branch?.name}</div>}
          <div className="ml-auto flex items-center gap-2 text-xs text-ink-400" title={live ? "Live updates connected" : "Reconnecting…"}>
            <span className={cn("size-2 rounded-full", live ? "bg-emerald-400" : "animate-pulse bg-amber-400")} />{live ? "Live" : "Reconnecting"}
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
