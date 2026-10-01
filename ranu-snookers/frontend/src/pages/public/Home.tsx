import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/api";
import type { GameType, Plan, PublicTable, Timeline } from "@/types/api";
import { useAuth } from "@/stores/auth";
import { useRealtime } from "@/hooks/useRealtime";
import { minutesLabel, money, time, todayLocal } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function Home() {
  const { branch } = useAuth();
  useRealtime(branch?.id, "public");
  const games = useQuery({ queryKey: ["public-games"], queryFn: () => get<GameType[]>("/public/game-types") });
  const plans = useQuery({ queryKey: ["public-plans"], queryFn: () => get<Plan[]>("/public/membership-plans") });
  const tables = useQuery({ queryKey: ["public-tables", branch?.id], queryFn: () => get<PublicTable[]>(`/public/branches/${branch!.id}/tables`), enabled: !!branch });
  const timeline = useQuery({ queryKey: ["timeline", branch?.id, "today"], queryFn: () => get<Timeline>("/public/timeline", { branch_id: branch!.id, day: todayLocal() }), enabled: !!branch, refetchInterval: 60000 });
  const freeNow = timeline.data?.tables.filter((t) => t.status === "AVAILABLE").length ?? 0;

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
        <div className="space-y-6">
          <Badge tone="green">● {timeline.data ? `${freeNow} tables free right now` : "Live table availability"}</Badge>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-6xl">Your table,<br /><span className="text-brass-400">ready when you are.</span></h1>
          <p className="max-w-md text-ink-300">Snooker, pool, billiards and PS5 at {branch?.name ?? "RANU Snookers"}. See live availability, book in 60 seconds with a small deposit, and walk straight to your table.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="rounded-full bg-brass-500 px-6 py-3 font-bold text-felt-950 hover:bg-brass-400">BOOK A TABLE</Link>
            <a href="#tables" className="rounded-full border border-line px-6 py-3 text-ink-100 hover:border-felt-400">When is a table free?</a>
          </div>
        </div>
        <div className="relative hidden md:block" aria-hidden>
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-felt-600 to-felt-800 shadow-2xl ring-8 ring-[#3b2414]" />
          <div className="absolute left-[18%] top-[30%] size-10 rounded-full bg-red-600 shadow-lg" />
          <div className="absolute left-[24%] top-[36%] size-10 rounded-full bg-red-700 shadow-lg" />
          <div className="absolute left-[20%] top-[44%] size-10 rounded-full bg-red-600 shadow-lg" />
          <div className="absolute right-[22%] top-[48%] size-10 rounded-full bg-black shadow-lg ring-2 ring-white/10" />
          <div className="absolute bottom-[22%] right-[35%] size-10 rounded-full bg-white shadow-lg" />
          <div className="aspect-[4/3]" />
        </div>
      </section>

      <section id="games" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl">Games</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(games.data ?? []).map((g) => (
            <div key={g.id} className="rounded-2xl border border-line bg-surface/80 p-5">
              <div className="mb-3 size-3 rounded-full" style={{ background: g.color }} />
              <div className="text-lg font-semibold">{g.name}</div>
              <div className="text-sm text-ink-400">from {money(g.default_hourly_rate)}/hour</div>
            </div>
          ))}
        </div>
      </section>

      <section id="tables" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Live tables</h2>
        <p className="mb-6 text-sm text-ink-400">Updates automatically. “Free from” shows when each table is next available today.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(timeline.data?.tables ?? []).map((t) => (
            <div key={t.table.id} className="rounded-2xl border border-line bg-surface/80 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{t.table.name}</div>
                <Badge tone={t.status === "AVAILABLE" ? "green" : t.status === "RESERVED" ? "amber" : t.status === "MAINTENANCE" ? "gray" : "red"}>{t.status === "IN_USE" ? "In use" : t.status.toLowerCase()}</Badge>
              </div>
              <div className="text-xs text-ink-400">{t.table.game_type.name} · {money(t.table.hourly_rate)}/hr</div>
              <div className="mt-2 text-sm">{t.next_free_at ? <>Free from <b>{time(t.next_free_at)}</b></> : "Not available today"}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl">Pricing</h2>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-ink-400"><tr><th className="px-4 py-2">Table</th><th className="px-4 py-2">Game</th><th className="px-4 py-2 text-right">Per hour</th></tr></thead>
            <tbody className="divide-y divide-line bg-surface/70">
              {(tables.data ?? []).map((t) => <tr key={t.id}><td className="px-4 py-2">{t.name}</td><td className="px-4 py-2">{t.game_type.name}</td><td className="num px-4 py-2 text-right">{money(t.hourly_rate)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-400">Happy-hour, weekend and holiday rates apply automatically; your exact price is shown before you pay. Billing is per 15-minute block.</p>
      </section>

      <section id="membership" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl">Membership</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(plans.data ?? []).map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-line bg-surface/80 p-6">
              <Badge tone={p.tier === "PREMIUM" ? "violet" : p.tier === "GOLD" ? "amber" : "gray"}>{p.tier}</Badge>
              <div className="mt-3 text-xl font-semibold">{p.name}</div>
              <div className="num mt-1 text-3xl font-bold text-brass-400">{money(p.price)}</div>
              <div className="text-xs text-ink-400">{p.validity_days} days{p.included_minutes ? ` · ${minutesLabel(p.included_minutes)} play time` : ""}</div>
              <ul className="mt-4 space-y-1 text-sm text-ink-300">{p.benefits.map((b) => <li key={b}>✓ {b}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-400">Buy or renew at the counter — you get a RANU member card to tap at the table.</p>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-3xl">About</h2>
        <p className="max-w-3xl text-ink-300">RANU Snookers is a premium cue-sports club with tournament-grade tables, PS5 gaming, snacks and drinks served at your table. Tournaments run every month — ask at the counter to register.</p>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-3xl">Contact</h2>
        <div className="rounded-2xl border border-line bg-surface/80 p-6 text-sm text-ink-300">
          <div className="text-ink-50">{branch?.name}</div>
          <div>{branch?.address}</div>
          <div>{branch?.phone}</div>
          <div>Open daily {branch?.opening_time}–{branch?.closing_time}</div>
        </div>
      </section>
    </div>
  );
}
