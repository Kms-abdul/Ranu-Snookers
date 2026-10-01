import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/#games", label: "Games" },
  { to: "/#tables", label: "Tables" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#membership", label: "Membership" },
  { to: "/#about", label: "About" },
  { to: "/#contact", label: "Contact" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="RANU Snookers home">
      <span className="grid size-9 place-items-center rounded-full bg-felt-950 ring-2 ring-brass-500">
        <span className="grid size-5 place-items-center rounded-full bg-white text-[10px] font-black text-felt-950">R</span>
      </span>
      <span className="font-[family-name:var(--font-display)] text-xl tracking-wide">RANU <span className="text-brass-400">Snookers</span></span>
    </Link>
  );
}

export function PublicLayout() {
  const { me, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="felt-bg min-h-full">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-felt-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-5 text-sm text-ink-300 md:flex" aria-label="Main">
            {NAV.map((n) => <a key={n.to} href={n.to} className="hover:text-ink-50">{n.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            {me ? (
              <NavLink to={isStaff ? "/admin" : "/my/bookings"} className="hidden text-sm text-ink-300 hover:text-ink-50 sm:block">{isStaff ? "Staff app" : "My bookings"}</NavLink>
            ) : (
              <NavLink to="/login" className="hidden text-sm text-ink-300 hover:text-ink-50 sm:block">Login</NavLink>
            )}
            <Link to="/book" className="rounded-full bg-brass-500 px-4 py-2 text-sm font-bold text-felt-950 shadow hover:bg-brass-400">BOOK A TABLE</Link>
            <button className="md:hidden rounded-md p-2 text-ink-300" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
          </div>
        </div>
        <nav className={cn("border-t border-line/60 px-4 py-2 md:hidden", !open && "hidden")} aria-label="Mobile">
          {NAV.map((n) => <a key={n.to} href={n.to} onClick={() => setOpen(false)} className="block py-2 text-ink-300">{n.label}</a>)}
          <Link to={me ? (isStaff ? "/admin" : "/my/bookings") : "/login"} onClick={() => setOpen(false)} className="block py-2 text-ink-300">{me ? "My account" : "Login"}</Link>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="border-t border-line/60 px-4 py-8 text-center text-xs text-ink-400">© {new Date().getFullYear()} RANU Snookers · Book online, play on time.</footer>
    </div>
  );
}
