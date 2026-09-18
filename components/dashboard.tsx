"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  CalendarDays,
  Gauge,
  HeartPulse,
  LogOut,
  Plus,
  Scale,
  Target,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AthleteDialog } from "@/components/athlete-dialog";
import { RunDialog } from "@/components/run-dialog";
import { WeightDialog } from "@/components/weight-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { account, appwriteConfig, fromAppwriteDate, ID, Query, tablesDB, toAppwriteDate } from "@/lib/appwrite";
import type { Athlete, AthleteDraft, Run, RunDraft, WeightDraft, WeightEntry } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export function Dashboard({ userId, onSignOut }: { userId: string; onSignOut: () => void }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [runOpen, setRunOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [athleteOpen, setAthleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsResult, splitsResult, weightsResult, athletesResult] = await Promise.all([
        tablesDB.listRows({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.runs, queries: [Query.limit(5000)] }),
        tablesDB.listRows({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.runSplits, queries: [Query.limit(5000)] }),
        tablesDB.listRows({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.weightEntries, queries: [Query.limit(5000)] }),
        tablesDB.listRows({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.athletes, queries: [Query.limit(5000)] }),
      ]);
      const splitsByRun = new Map<string, Run["run_splits"]>();
      for (const row of splitsResult.rows) {
        const split = normalizeSplit(row as unknown as Record<string, unknown>);
        const current = splitsByRun.get(String(row.run_id)) || [];
        current.push(split);
        splitsByRun.set(String(row.run_id), current);
      }
      for (const splits of splitsByRun.values()) splits.sort((a, b) => a.kilometer - b.kilometer);
      setRuns(runsResult.rows.map((row) => normalizeRun(row as unknown as Record<string, unknown>, splitsByRun.get(row.$id) || [])).sort((a, b) => a.run_date.localeCompare(b.run_date)));
      setWeights(weightsResult.rows.map((row) => normalizeWeight(row as unknown as Record<string, unknown>)).sort((a, b) => a.entry_date.localeCompare(b.entry_date)));
      const loadedAthletes = athletesResult.rows.map((row) => normalizeAthlete(row as unknown as Record<string, unknown>)).sort((a, b) => a.name.localeCompare(b.name));
      setAthletes(loadedAthletes);
      setSelectedAthleteId((current) => current && loadedAthletes.some((athlete) => athlete.id === current) ? current : loadedAthletes[0]?.id || "");
    } catch {
      toast.error("Não foi possível carregar seus dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const saveRun = useCallback(async (draft: RunDraft) => {
    const duration = draft.splits.reduce((sum, split) => sum + split.split_seconds, 0);
    const distance = getRunDistance(draft.splits);
    const averageHeartRate = Math.round(draft.splits.reduce((sum, split) => sum + split.heart_rate * split.split_seconds, 0) / duration);
    const baseRun = { run_date: toAppwriteDate(draft.run_date), distance_km: distance, duration_seconds: duration, avg_heart_rate: averageHeartRate, perceived_effort: draft.perceived_effort, notes: draft.notes || null, created_by: userId, athlete_id: selectedAthleteId };
    const run = await tablesDB.createRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.runs, rowId: ID.unique(), data: baseRun });
    try {
      await Promise.all(draft.splits.map((split) => tablesDB.createRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.runSplits, rowId: ID.unique(), data: { ...split, run_id: run.$id, athlete_id: selectedAthleteId, created_by: userId } })));
      setRuns((current) => [...current, normalizeRun(run as unknown as Record<string, unknown>, draft.splits)].sort((a, b) => a.run_date.localeCompare(b.run_date)));
      toast.success("Corrida registrada.");
    } catch (error) {
      await tablesDB.deleteRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.runs, rowId: run.$id });
      toast.error("Não foi possível salvar as parciais.");
      throw error;
    }
  }, [selectedAthleteId, userId]);

  const saveWeight = useCallback(async (draft: WeightDraft) => {
    const entryDate = toAppwriteDate(draft.entry_date);
    const existing = await tablesDB.listRows({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.weightEntries, queries: [Query.equal("athlete_id", selectedAthleteId), Query.equal("entry_date", entryDate), Query.limit(1)] });
    const data = { athlete_id: selectedAthleteId, entry_date: entryDate, weight_kg: draft.weight_kg, created_by: userId };
    const row = existing.rows[0]
      ? await tablesDB.updateRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.weightEntries, rowId: existing.rows[0].$id, data })
      : await tablesDB.createRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.weightEntries, rowId: ID.unique(), data });
    const normalized = normalizeWeight(row as unknown as Record<string, unknown>);
    setWeights((current) => [...current.filter((entry) => entry.entry_date !== draft.entry_date || entry.athlete_id !== selectedAthleteId), normalized].sort((a, b) => a.entry_date.localeCompare(b.entry_date)));
    toast.success("Peso registrado.");
  }, [selectedAthleteId, userId]);

  const saveAthlete = useCallback(async (draft: AthleteDraft) => {
    const row = await tablesDB.createRow({ databaseId: appwriteConfig.databaseId, tableId: appwriteConfig.tables.athletes, rowId: ID.unique(), data: { ...draft, birth_date: draft.birth_date ? toAppwriteDate(draft.birth_date) : null, created_by: userId } });
    const athlete = normalizeAthlete(row as unknown as Record<string, unknown>);
    setAthletes((current) => [...current, athlete].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedAthleteId(athlete.id);
    toast.success(`${athlete.name} foi cadastrado(a).`);
  }, [userId]);

  useWebMcp(saveRun, saveWeight);

  const activeAthlete = athletes.find((athlete) => athlete.id === selectedAthleteId);
  const visibleRuns = useMemo(() => runs.filter((run) => run.athlete_id === selectedAthleteId), [runs, selectedAthleteId]);
  const visibleWeights = useMemo(() => weights.filter((entry) => entry.athlete_id === selectedAthleteId), [weights, selectedAthleteId]);
  const metrics = useMemo(() => calculateMetrics(visibleRuns), [visibleRuns]);
  const currentWeight = visibleWeights.at(-1)?.weight_kg;
  const firstWeight = activeAthlete?.start_weight_kg ?? null;
  const targetWeight = activeAthlete?.target_weight_kg ?? 72;
  const weightLost = firstWeight !== null && currentWeight !== undefined ? firstWeight - currentWeight : null;
  const weightProgress = firstWeight && currentWeight && firstWeight !== targetWeight ? Math.max(0, Math.min(100, ((firstWeight - currentWeight) / (firstWeight - targetWeight)) * 100)) : 0;
  const paceChart = visibleRuns.map((run) => ({ date: shortDate(run.run_date), pace: Math.round(run.duration_seconds / run.distance_km), bpm: run.avg_heart_rate }));
  const weightChart = visibleWeights.map((entry) => ({ date: shortDate(entry.entry_date), weight: entry.weight_kg }));
  const recentRuns = [...visibleRuns].reverse().slice(0, 5);

  if (loading) return <LoadingDashboard />;

  return (
    <main className="min-h-screen bg-[#080a0d] text-[#f7f8f4]">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#c7ff3f] text-[#0a0d08] shadow-[0_0_30px_rgba(199,255,63,.16)]"><TrendingUp className="size-5" strokeWidth={2.5} /></div>
            <div><p className="text-[1.05rem] font-extrabold tracking-[-0.03em]">MENDONÇA FIT</p><p className="text-xs text-white/45">corrida & evolução</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedAthleteId} onValueChange={(value) => value && setSelectedAthleteId(value)}>
              <SelectTrigger className="hidden h-10 w-44 border-white/10 bg-white/[.035] text-white sm:flex"><SelectValue placeholder="Selecionar pessoa" /></SelectTrigger>
              <SelectContent>{athletes.map((athlete) => <SelectItem key={athlete.id} value={athlete.id}>{athlete.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setAthleteOpen(true)} className="h-10 border-white/10 bg-white/[.03] text-white hover:bg-white/10 hover:text-white" aria-label="Cadastrar pessoa"><UserPlus /></Button>
            <Button variant="outline" disabled={!activeAthlete} onClick={() => setWeightOpen(true)} className="hidden h-10 border-white/10 bg-white/[.03] text-white hover:bg-white/10 hover:text-white lg:inline-flex"><Scale /> Registrar peso</Button>
            <Button disabled={!activeAthlete} onClick={() => setRunOpen(true)} className="h-10 bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d5ff70]"><Plus /> <span className="hidden sm:inline">Nova corrida</span></Button>
            <Button variant="ghost" size="icon" onClick={async () => { await account.deleteSession({ sessionId: "current" }); onSignOut(); }} className="text-white/50 hover:bg-white/10 hover:text-white" aria-label="Sair"><LogOut /></Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="pt-7">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase text-[#c7ff3f]"><span className="size-1.5 rounded-full bg-[#c7ff3f]" /> {monthFormatter.format(new Date())}</p>
              <h1 className="text-4xl font-black leading-[.95] tracking-[-0.055em] sm:text-6xl">{activeAthlete ? `Painel de ${activeAthlete.name}.` : "Cadastre a primeira pessoa."}</h1>
              <div className="mt-4 flex items-center gap-2 sm:hidden"><Select value={selectedAthleteId} onValueChange={(value) => value && setSelectedAthleteId(value)}><SelectTrigger className="h-10 w-full border-white/10 bg-white/[.035] text-white"><SelectValue placeholder="Selecionar pessoa" /></SelectTrigger><SelectContent>{athletes.map((athlete) => <SelectItem key={athlete.id} value={athlete.id}>{athlete.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <TabsList className="h-11 w-full justify-start bg-white/[.05] md:w-auto">
              <TabsTrigger value="overview" className="px-4">Visão geral</TabsTrigger>
              <TabsTrigger value="runs" className="px-4">Corridas</TabsTrigger>
              <TabsTrigger value="weight" className="px-4">Peso</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<Gauge />} label="Ritmo médio" value={formatPace(metrics.averagePace)} unit="/km" meta={`${metrics.runCount} treinos registrados`} />
              <Metric icon={<Activity />} label="Distância total" value={formatDecimal(metrics.totalDistance)} unit="km" meta="No período exibido" />
              <Metric icon={<HeartPulse />} label="FC média" value={String(metrics.averageHeartRate || "—")} unit={metrics.averageHeartRate ? "bpm" : ""} meta="Todos os treinos" />
              <Metric icon={<CalendarDays />} label="Tempo correndo" value={formatHours(metrics.totalDuration)} unit="" meta="Tempo acumulado" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(310px,.65fr)]">
              <ChartCard title="Evolução do ritmo" subtitle="Segundos por quilômetro — quanto menor, melhor" badge={metrics.paceGain ? `−${metrics.paceGain}s / km` : undefined}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={paceChart} margin={{ top: 18, right: 8, bottom: 0, left: -18 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,.35)", fontSize: 12 }} /><YAxis reversed domain={["dataMin - 10", "dataMax + 10"]} axisLine={false} tickLine={false} tickFormatter={formatPace} tick={{ fill: "rgba(255,255,255,.35)", fontSize: 11 }} /><Tooltip content={<PaceTooltip />} /><Line type="monotone" dataKey="pace" stroke="#c7ff3f" strokeWidth={3} dot={{ r: 4, fill: "#080a0d", stroke: "#c7ff3f", strokeWidth: 3 }} activeDot={{ r: 6 }} /></LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <section className="rounded-[24px] bg-[#c7ff3f] p-6 text-[#111708]">
                <div className="flex items-center justify-between"><div className="grid size-10 place-items-center rounded-xl bg-black/10"><Scale className="size-5" /></div>{weightLost !== null && weightLost > 0 && <span className="flex items-center gap-1 rounded-full bg-black/[.08] px-3 py-1.5 text-xs font-bold"><ArrowDownRight className="size-3.5" /> {formatDecimal(weightLost)} kg</span>}</div>
                <p className="mt-8 text-sm font-semibold opacity-60">Peso atual</p>
                <p className="mt-1 text-5xl font-black tracking-[-0.06em]">{currentWeight ? formatDecimal(currentWeight) : "—"} {currentWeight && <span className="text-xl">kg</span>}</p>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[#111708] transition-all" style={{ width: `${weightProgress}%` }} /></div>
                <div className="mt-2 flex justify-between text-xs font-semibold opacity-60"><span>Início: {firstWeight ? `${formatDecimal(firstWeight)} kg` : "—"}</span><span>Meta: {formatDecimal(targetWeight)} kg</span></div>
                <Button onClick={() => setWeightOpen(true)} variant="outline" className="mt-7 w-full border-black/15 bg-black/[.06] text-[#111708] shadow-none hover:bg-black/10 hover:text-[#111708]">Registrar peso de hoje</Button>
              </section>
            </div>

            <section className="rounded-[24px] border border-white/10 bg-[#11151a] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-white/45">Atividade</p><h2 className="text-xl font-bold tracking-tight">Últimas corridas</h2></div></div>
              {recentRuns.length ? <div className="grid gap-x-5 md:grid-cols-2">{recentRuns.map((run) => <RunRow key={run.id} run={run} />)}</div> : <EmptyState action={() => setRunOpen(true)} />}
            </section>
          </TabsContent>

          <TabsContent value="runs">
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#11151a]">
                <div className="flex items-center justify-between p-6"><div><p className="text-sm text-white/45">Histórico completo</p><h2 className="text-2xl font-bold tracking-tight">Suas corridas</h2></div><Button onClick={() => setRunOpen(true)} className="bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d5ff70]"><Plus /> Novo treino</Button></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left"><thead className="border-y border-white/[.07] bg-white/[.025] text-xs uppercase tracking-wider text-white/35"><tr><th className="px-6 py-3 font-semibold">Data</th><th className="px-4 py-3 font-semibold">Distância</th><th className="px-4 py-3 font-semibold">Tempo</th><th className="px-4 py-3 font-semibold">Ritmo</th><th className="px-4 py-3 font-semibold">FC média</th><th className="px-6 py-3 font-semibold">Esforço</th></tr></thead><tbody>{[...visibleRuns].reverse().map((run) => <tr key={run.id} className="border-b border-white/[.06] last:border-0"><td className="px-6 py-4 font-semibold">{longDate(run.run_date)}</td><td className="px-4 py-4">{formatDecimal(run.distance_km)} km</td><td className="px-4 py-4 font-mono text-sm">{formatDuration(run.duration_seconds)}</td><td className="px-4 py-4 font-mono font-bold text-[#c7ff3f]">{formatPace(Math.round(run.duration_seconds / run.distance_km))}</td><td className="px-4 py-4">{run.avg_heart_rate} bpm</td><td className="px-6 py-4">{run.perceived_effort ?? "—"}/10</td></tr>)}</tbody></table></div>
              </section>
              <section className="rounded-[24px] border border-white/10 bg-[#11151a] p-6"><div className="grid size-11 place-items-center rounded-xl bg-[#c7ff3f]/10 text-[#c7ff3f]"><Target /></div><p className="mt-8 text-sm text-white/45">Melhor ritmo médio</p><p className="mt-1 text-5xl font-black tracking-[-.06em]">{formatPace(metrics.bestPace)} <span className="text-base text-white/35">/km</span></p><p className="mt-6 border-t border-white/[.07] pt-5 text-sm leading-relaxed text-white/45">Confira as parciais no cadastro para entender em quais quilômetros seu ritmo e sua frequência variam mais.</p></section>
            </div>
          </TabsContent>

          <TabsContent value="weight">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,.65fr)]">
              <ChartCard title="Evolução do peso" subtitle="Registros diários em quilogramas">
                <ResponsiveContainer width="100%" height={320}><LineChart data={weightChart} margin={{ top: 18, right: 10, bottom: 0, left: -10 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,.35)", fontSize: 12 }} /><YAxis domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,.35)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "#171b20", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }} formatter={(value) => [`${value} kg`, "Peso"]} /><Line type="monotone" dataKey="weight" stroke="#c7ff3f" strokeWidth={3} dot={{ r: 4, fill: "#080a0d", stroke: "#c7ff3f", strokeWidth: 3 }} /></LineChart></ResponsiveContainer>
              </ChartCard>
              <section className="rounded-[24px] border border-white/10 bg-[#11151a] p-6"><div className="flex items-center justify-between"><div className="grid size-11 place-items-center rounded-xl bg-[#c7ff3f]/10 text-[#c7ff3f]"><Scale /></div><Button onClick={() => setWeightOpen(true)} className="bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d5ff70]"><Plus /> Registrar</Button></div><p className="mt-8 text-sm text-white/45">Peso perdido desde o início</p><p className="mt-1 flex items-baseline gap-2"><span className="text-5xl font-black tracking-[-.06em]">{weightLost !== null ? formatDecimal(weightLost) : "—"}</span>{weightLost !== null && <span className="text-base font-bold tracking-normal text-white/35">kg</span>}</p><div className="mt-7 space-y-3 border-t border-white/[.07] pt-5">{[...visibleWeights].reverse().slice(0, 5).map((entry) => <div key={entry.id} className="flex items-center justify-between text-sm"><span className="text-white/45">{longDate(entry.entry_date)}</span><span className="font-mono font-bold">{formatDecimal(entry.weight_kg)} kg</span></div>)}</div></section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <RunDialog open={runOpen} onOpenChange={setRunOpen} onSave={saveRun} />
      <WeightDialog open={weightOpen} onOpenChange={setWeightOpen} onSave={saveWeight} lastWeight={currentWeight} />
      <AthleteDialog open={athleteOpen} onOpenChange={setAthleteOpen} onSave={saveAthlete} />
    </main>
  );
}

function Metric({ icon, label, value, unit, meta }: { icon: React.ReactNode; label: string; value: string; unit: string; meta: string }) { return <div className="rounded-[20px] border border-white/10 bg-white/[.035] p-5"><div className="flex items-center justify-between text-white/45"><span className="[&_svg]:size-4">{icon}</span><span className="text-xs">{label}</span></div><p className="mt-6 text-3xl font-black tracking-[-0.04em]">{value} <span className="text-sm font-medium text-white/40">{unit}</span></p><p className="mt-1.5 text-xs text-white/40">{meta}</p></div>; }
function ChartCard({ title, subtitle, badge, children }: { title: string; subtitle: string; badge?: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#11151a] p-5 sm:p-7"><div className="mb-3 flex items-start justify-between gap-4"><div><p className="text-sm text-white/45">{subtitle}</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2></div>{badge && <span className="rounded-full bg-[#c7ff3f]/10 px-3 py-1.5 text-xs font-bold text-[#c7ff3f]">{badge}</span>}</div>{children}</section>; }
function RunRow({ run }: { run: Run }) { const pace = Math.round(run.duration_seconds / run.distance_km); return <div className="flex items-center gap-3 border-t border-white/[.07] py-3.5 first:border-t-0 md:[&:nth-child(2)]:border-t-0"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[.05] text-sm font-bold">{new Date(`${run.run_date}T12:00:00`).getDate().toString().padStart(2, "0")}</div><div className="min-w-0 flex-1"><p className="font-semibold">{formatDecimal(run.distance_km)} km</p><p className="truncate text-xs text-white/40">{run.notes || `${run.avg_heart_rate} bpm médio`}</p></div><div className="text-right"><p className="font-mono font-bold text-[#c7ff3f]">{formatPace(pace)}</p><p className="text-[11px] text-white/35">min/km</p></div></div>; }
function EmptyState({ action }: { action: () => void }) { return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/10 text-center"><div><Activity className="mx-auto size-7 text-white/25" /><p className="mt-3 font-semibold">Nenhuma corrida ainda</p><p className="mt-1 text-sm text-white/40">Registre seu primeiro treino para ver as métricas.</p><Button onClick={action} variant="outline" className="mt-4 border-white/10 bg-white/[.03] text-white hover:bg-white/10 hover:text-white">Registrar corrida</Button></div></div>; }
function LoadingDashboard() { return <main className="min-h-screen bg-[#080a0d] p-6 text-white"><div className="mx-auto max-w-[1340px] space-y-6"><Skeleton className="h-14 bg-white/[.06]" /><Skeleton className="h-24 bg-white/[.06]" /><div className="grid gap-3 md:grid-cols-4">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-36 bg-white/[.06]" />)}</div><Skeleton className="h-80 bg-white/[.06]" /></div></main>; }
function PaceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) { if (!active || !payload?.length) return null; return <div className="rounded-xl border border-white/10 bg-[#171b20] px-3 py-2 text-xs shadow-xl"><p className="text-white/40">{label}</p><p className="mt-1 font-mono font-bold text-[#c7ff3f]">{formatPace(payload[0].value)} /km</p></div>; }

function normalizeRun(run: Record<string, unknown>, splits: Run["run_splits"] = []): Run { return { id: String(run.$id), athlete_id: String(run.athlete_id), run_date: fromAppwriteDate(run.run_date), distance_km: Number(run.distance_km), duration_seconds: Number(run.duration_seconds), avg_heart_rate: Number(run.avg_heart_rate), perceived_effort: run.perceived_effort == null ? null : Number(run.perceived_effort), notes: run.notes == null ? null : String(run.notes), run_splits: splits }; }
function normalizeSplit(split: Record<string, unknown>): Run["run_splits"][number] { return { id: String(split.$id), run_id: String(split.run_id), kilometer: Number(split.kilometer), split_seconds: Number(split.split_seconds), heart_rate: Number(split.heart_rate) }; }
function normalizeWeight(entry: Record<string, unknown>): WeightEntry { return { id: String(entry.$id), athlete_id: String(entry.athlete_id), entry_date: fromAppwriteDate(entry.entry_date), weight_kg: Number(entry.weight_kg) }; }
function normalizeAthlete(entry: Record<string, unknown>): Athlete { return { id: String(entry.$id), name: String(entry.name), birth_date: entry.birth_date ? fromAppwriteDate(entry.birth_date) : null, start_weight_kg: numberOrNull(entry.start_weight_kg), target_weight_kg: numberOrNull(entry.target_weight_kg) }; }
function calculateMetrics(runs: Run[]) { const totalDistance = runs.reduce((sum, run) => sum + run.distance_km, 0); const totalDuration = runs.reduce((sum, run) => sum + run.duration_seconds, 0); const averagePace = totalDistance ? Math.round(totalDuration / totalDistance) : 0; const averageHeartRate = runs.length ? Math.round(runs.reduce((sum, run) => sum + run.avg_heart_rate, 0) / runs.length) : 0; const paces = runs.map((run) => Math.round(run.duration_seconds / run.distance_km)); return { totalDistance, totalDuration, averagePace, averageHeartRate, runCount: runs.length, bestPace: paces.length ? Math.min(...paces) : 0, paceGain: paces.length > 1 ? Math.max(0, paces[0] - paces.at(-1)!) : 0 }; }
function formatPace(seconds: number) { if (!seconds) return "—"; return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function formatDuration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60; return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(secs).padStart(2, "0")}`; }
function formatHours(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours}h ${minutes}min` : `${minutes}min`; }
function formatDecimal(value: number) { return value.toLocaleString("pt-BR", { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 1 }); }
function shortDate(date: string) { return dateFormatter.format(new Date(`${date}T12:00:00`)).replace(". de ", " ").replace(".", ""); }
function longDate(date: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`)); }
function numberOrNull(value: unknown) { return value == null ? null : Number(value); }
function getRunDistance(splits: RunDraft["splits"]) { return splits.reduce((maximum, split) => Math.max(maximum, split.kilometer), 0); }

type WebMCPContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => Promise<unknown> }, options: { signal: AbortSignal }) => void | Promise<void> };
function useWebMcp(saveRun: (draft: RunDraft) => Promise<void>, saveWeight: (draft: WeightDraft) => Promise<void>) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMCPContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const weightTool = {
      name: "record_weight",
      title: "Registrar peso",
      description: "Registra ou atualiza o peso do usuário em uma data.",
      inputSchema: {
        type: "object",
        properties: {
          entry_date: { type: "string", format: "date" },
          weight_kg: { type: "number", minimum: 25, maximum: 400 },
        },
        required: ["entry_date", "weight_kg"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as WeightDraft;
        if (!value.entry_date || value.weight_kg < 25 || value.weight_kg > 400) throw new Error("Dados de peso inválidos.");
        await saveWeight(value);
        return { status: "saved", ...value };
      },
    };
    const runTool = {
      name: "record_run",
      title: "Registrar corrida",
      description: "Registra uma corrida com tempo e frequência cardíaca por trecho. O campo kilometer indica a distância acumulada e pode terminar em uma parcial, como 6.6 km.",
      inputSchema: {
        type: "object",
        properties: {
          run_date: { type: "string", format: "date" },
          perceived_effort: { type: "integer", minimum: 1, maximum: 10 },
          notes: { type: "string", maxLength: 500 },
          splits: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                kilometer: { type: "number", exclusiveMinimum: 0 },
                split_seconds: { type: "integer", minimum: 1, maximum: 3600 },
                heart_rate: { type: "integer", minimum: 30, maximum: 240 },
              },
              required: ["kilometer", "split_seconds", "heart_rate"],
              additionalProperties: false,
            },
          },
        },
        required: ["run_date", "perceived_effort", "splits"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as RunDraft;
        if (!value.run_date || !Array.isArray(value.splits) || !value.splits.length) throw new Error("Dados de corrida inválidos.");
        await saveRun({ ...value, notes: value.notes || "" });
        return { status: "saved", distance_km: getRunDistance(value.splits) };
      },
    };
    void Promise.resolve(context.registerTool(weightTool, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool(runTool, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [saveRun, saveWeight]);
}
