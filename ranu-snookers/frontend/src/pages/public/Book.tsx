/** Booking wizard: branch → game → date → time → duration → table → details → deposit → confirmation. */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { get } from "@/services/api";
import { createHold, customerSchema, fetchAvailability, fetchTimeline, type CustomerForm } from "@/services/booking";
import type { Availability, GameType } from "@/types/api";
import { useAuth } from "@/stores/auth";
import { useRealtime } from "@/hooks/useRealtime";
import { Badge, Button, ErrorBox, Field, Input, Select, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { localToIso, minutesLabel, money, time, todayLocal } from "@/lib/format";

const DURATIONS = [30, 60, 90, 120, 180];

function timeSlots(open: string, close: string, step = 30): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let end = ch * 60 + cm;
  const start = oh * 60 + om;
  if (end <= start) end += 24 * 60;
  const out: string[] = [];
  for (let t = start; t < end; t += step) out.push(`${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  return out;
}

export default function Book() {
  const { branch, branches, setBranch, me } = useAuth();
  const nav = useNavigate();
  useRealtime(branch?.id, "public");
  const [game, setGame] = useState<string>("");
  const [day, setDay] = useState(todayLocal());
  const [slot, setSlot] = useState("18:00");
  const [duration, setDuration] = useState(60);
  const [picked, setPicked] = useState<Availability | null>(null);

  const games = useQuery({ queryKey: ["public-games"], queryFn: () => get<GameType[]>("/public/game-types") });
  const slots = useMemo(() => (branch ? timeSlots(branch.opening_time, branch.closing_time) : []), [branch]);
  // After-midnight slots belong to the same business day but the next calendar date.
  const startIso = useMemo(() => {
    if (!branch) return "";
    const afterMidnight = slot < branch.opening_time;
    const d = afterMidnight ? new Date(new Date(`${day}T00:00:00+05:30`).getTime() + 86400000) : new Date(`${day}T00:00:00+05:30`);
    const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    return localToIso(localDay, slot);
  }, [branch, day, slot]);

  const avail = useQuery({
    queryKey: ["availability", branch?.id, startIso, duration, game],
    queryFn: () => fetchAvailability(branch!.id, startIso, duration, game || undefined),
    enabled: !!branch && !!startIso, retry: false,
  });
  const timeline = useQuery({ queryKey: ["timeline", branch?.id, day, game], queryFn: () => fetchTimeline(branch!.id, day, game || undefined), enabled: !!branch });

  const form = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: { name: me?.user.full_name ?? "", phone: me?.user.phone ?? "", email: me?.user.email ?? "" } });
  const hold = useMutation({
    mutationFn: (c: CustomerForm) => createHold({ branch_id: branch!.id, table_id: picked!.table.id, start_at: startIso, duration_minutes: duration, customer: { name: c.name, phone: c.phone, email: c.email || undefined } }),
    onSuccess: (r) => nav(`/booking/${r.booking.reference}`, { state: r }),
  });

  if (!branch) return <div className="grid place-items-center p-20"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-3xl">Book a table</h1>
      <p className="mb-6 text-sm text-ink-400">Prices and availability are live. Your table is held for 10 minutes while you pay the deposit.</p>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface/80 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {branches.length > 1 && (
          <Field label="Branch">
            <Select value={branch.id} onChange={(e) => { const b = branches.find((x) => x.id === e.target.value); if (b) setBranch(b); setPicked(null); }}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Game">
          <Select value={game} onChange={(e) => { setGame(e.target.value); setPicked(null); }}>
            <option value="">All games</option>
            {(games.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
        <Field label="Date"><Input type="date" min={todayLocal()} max={todayLocal(30)} value={day} onChange={(e) => { setDay(e.target.value); setPicked(null); }} /></Field>
        <Field label="Start time">
          <Select value={slot} onChange={(e) => { setSlot(e.target.value); setPicked(null); }}>
            {slots.map((s) => <option key={s} value={s}>{new Date(`2000-01-01T${s}:00`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</option>)}
          </Select>
        </Field>
        <Field label="Duration">
          <Select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setPicked(null); }}>
            {DURATIONS.map((d) => <option key={d} value={d}>{minutesLabel(d)}</option>)}
          </Select>
        </Field>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Available tables · {time(startIso)}–{time(new Date(new Date(startIso).getTime() + duration * 60000).toISOString())}</h2>
      {avail.isLoading && <Spinner />}
      <ErrorBox error={avail.error} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(avail.data ?? []).map((a) => {
          const ok = a.status === "AVAILABLE";
          return (
            <button key={a.table.id} disabled={!ok} onClick={() => setPicked(a)} aria-pressed={picked?.table.id === a.table.id}
              className={cn("rounded-2xl border-2 bg-surface/80 p-4 text-left transition", ok ? "border-line hover:border-felt-400" : "cursor-not-allowed border-line/50 opacity-60",
                picked?.table.id === a.table.id && "border-brass-400 bg-felt-800/60")}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{a.table.name}</div>
                <Badge tone={ok ? "green" : a.status === "MAINTENANCE" ? "gray" : "red"}>{ok ? "Available" : a.status === "IN_USE" ? "In use" : a.status === "BOOKED" ? "Booked" : a.status.toLowerCase()}</Badge>
              </div>
              <div className="text-xs text-ink-400">{a.table.game_type.name}</div>
              {ok && a.quote ? (
                <div className="mt-3">
                  <div className="num text-2xl font-bold text-brass-400">{money(a.quote.amount)}</div>
                  <div className="text-xs text-ink-400">Deposit now {money(a.quote.deposit)} · rest at the club</div>
                  {a.quote.segments.length > 1 && <div className="mt-1 text-xs text-emerald-300">{a.quote.segments.map((s) => `${s.minutes}m ${s.rule}`).join(" + ")}</div>}
                </div>
              ) : (
                <div className="mt-3 text-sm text-ink-300">{a.next_available_at ? <>Next free at <b>{time(a.next_available_at)}</b></> : a.reason ?? "Not available"}</div>
              )}
            </button>
          );
        })}
      </div>

      {picked && picked.quote && (
        <form onSubmit={form.handleSubmit((v) => hold.mutate(v))} className="mt-8 grid gap-4 rounded-2xl border border-brass-500/40 bg-surface/90 p-5 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <div className="text-sm text-ink-400">Your booking</div>
            <div className="text-lg font-semibold">{picked.table.name} · {time(startIso)} · {minutesLabel(duration)} · <span className="text-brass-400">{money(picked.quote.amount)}</span></div>
          </div>
          <Field label="Name" error={form.formState.errors.name?.message}><Input autoComplete="name" {...form.register("name")} /></Field>
          <Field label="Mobile (WhatsApp)" error={form.formState.errors.phone?.message}><Input inputMode="tel" autoComplete="tel" {...form.register("phone")} /></Field>
          <Field label="Email (optional)" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register("email")} /></Field>
          <label className="flex items-start gap-2 self-end text-sm text-ink-300">
            <input type="checkbox" className="mt-1" {...form.register("agree")} />
            <span>I agree: deposit is refundable up to 4 hours before start; no-shows forfeit the deposit.</span>
          </label>
          {form.formState.errors.agree && <div className="text-xs text-red-400 sm:col-span-2">{form.formState.errors.agree.message}</div>}
          <div className="sm:col-span-2"><ErrorBox error={hold.error} /></div>
          <Button type="submit" variant="brass" size="xl" className="sm:col-span-2" loading={hold.isPending}>Pay deposit {money(picked.quote.deposit)} &amp; hold table</Button>
        </form>
      )}

      <section className="mt-12">
        <h2 className="mb-1 text-lg font-semibold">When will tables be free? ({day})</h2>
        <p className="mb-3 text-xs text-ink-400">Grey = booked / in use. Updates live.</p>
        <div className="space-y-2 overflow-x-auto">
          {timeline.data?.tables.map((t) => {
            const open = new Date(timeline.data!.opens_at).getTime();
            const close = new Date(timeline.data!.closes_at).getTime();
            const span = close - open;
            return (
              <div key={t.table.id} className="flex min-w-[560px] items-center gap-3">
                <div className="w-24 shrink-0 text-sm">{t.table.name}</div>
                <div className="relative h-6 flex-1 rounded bg-felt-700/60">
                  {t.busy.map((b, i) => {
                    const l = Math.max(0, (new Date(b.start).getTime() - open) / span) * 100;
                    const w = Math.min(100 - l, ((new Date(b.end).getTime() - new Date(b.start).getTime()) / span) * 100);
                    return <div key={i} title={`${time(b.start)}–${time(b.end)}`} className={cn("absolute inset-y-0 rounded", b.kind === "IN_USE" ? "bg-sky-500/60" : "bg-ink-500/80")} style={{ left: `${l}%`, width: `${w}%` }} />;
                  })}
                </div>
                <div className="w-28 shrink-0 text-right text-xs text-ink-300">{t.next_free_at ? `free ${time(t.next_free_at)}` : "—"}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
