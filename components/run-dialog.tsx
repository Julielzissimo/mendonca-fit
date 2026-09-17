"use client";

import { useMemo, useState } from "react";
import { HeartPulse, Plus, TimerReset, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RunDraft } from "@/lib/types";

type SplitInput = { distance: string; minutes: string; seconds: string; heartRate: string; partial: boolean };
const emptySplit = (partial = false): SplitInput => ({ distance: partial ? "0,1" : "1", minutes: partial ? "0" : "5", seconds: "30", heartRate: "150", partial });
const parseDistance = (value: string) => Number(value.replace(",", ".")) || 0;
const formatDistance = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function RunDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (draft: RunDraft) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [effort, setEffort] = useState("6");
  const [notes, setNotes] = useState("");
  const [splits, setSplits] = useState<SplitInput[]>([emptySplit(), emptySplit(), emptySplit(), emptySplit(), emptySplit()]);
  const [saving, setSaving] = useState(false);

  const totalSeconds = useMemo(() => splits.reduce((total, split) => total + Number(split.minutes || 0) * 60 + Number(split.seconds || 0), 0), [splits]);
  const totalDistance = useMemo(() => splits.reduce((total, split) => total + parseDistance(split.distance), 0), [splits]);
  const averagePace = totalDistance ? Math.round(totalSeconds / totalDistance) : 0;
  const hasPartialSplit = splits.some((split) => split.partial);

  function updateSplit(index: number, field: keyof SplitInput, value: string) {
    setSplits((current) => current.map((split, splitIndex) => splitIndex === index ? { ...split, [field]: value } : split));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    let cumulativeDistance = 0;
    const normalized = splits.map((split) => {
      cumulativeDistance += parseDistance(split.distance);
      return { kilometer: Math.round(cumulativeDistance * 10) / 10, split_seconds: Number(split.minutes) * 60 + Number(split.seconds), heart_rate: Number(split.heartRate) };
    });
    if (splits.some((split) => {
      const distance = parseDistance(split.distance);
      return distance <= 0 || distance > 1 || (split.partial && (distance >= 1 || distance * 10 % 1 !== 0));
    }) || normalized.some((split) => split.split_seconds < 1 || split.heart_rate < 30 || split.heart_rate > 240)) return;
    setSaving(true);
    try {
      await onSave({ run_date: date, perceived_effort: Number(effort), notes, splits: normalized });
      onOpenChange(false);
      setNotes("");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#11151a] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-[-.03em]">Registrar corrida</DialogTitle>
          <DialogDescription>Informe o tempo e a frequência cardíaca de cada quilômetro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="run-date">Data do treino</Label><Input id="run-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="h-11 bg-white/[.035]" /></div>
            <div className="space-y-2"><Label>Esforço percebido</Label><Select value={effort} onValueChange={(value) => value && setEffort(value)}><SelectTrigger className="h-11 w-full bg-white/[.035]"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8,9,10].map((item) => <SelectItem key={item} value={String(item)}>{item} / 10</SelectItem>)}</SelectContent></Select></div>
          </div>

          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><Label>Parciais</Label><p className="mt-1 text-xs text-white/40">Adicione os quilômetros completos e, se necessário, um trecho final parcial.</p></div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="sm" disabled={hasPartialSplit} onClick={() => setSplits((current) => [...current, emptySplit()])} className="border-white/10 bg-white/[.035] text-white hover:bg-white/10 hover:text-white"><Plus /> Adicionar km</Button>
                <Button type="button" variant="outline" size="sm" disabled={hasPartialSplit} onClick={() => setSplits((current) => [...current, emptySplit(true)])} className="border-[#c7ff3f]/25 bg-[#c7ff3f]/[.06] text-[#c7ff3f] hover:bg-[#c7ff3f]/10 hover:text-[#c7ff3f]"><Plus /> Adicionar parcial</Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[72px_1fr_1fr_40px] gap-3 bg-white/[.04] px-3 py-2 text-xs font-semibold text-white/45"><span>Trecho</span><span>Tempo</span><span>FC média</span><span /></div>
              {splits.map((split, index) => (
                <div key={index} className="grid grid-cols-[72px_1fr_1fr_40px] items-center gap-3 border-t border-white/[.07] px-3 py-2.5">
                  {split.partial ? <div className="relative"><Input aria-label="Distância da parcial em quilômetros" inputMode="decimal" required pattern="0[,.][1-9]" title="Informe uma distância entre 0,1 e 0,9 km" maxLength={3} value={split.distance} onChange={(e) => updateSplit(index, "distance", e.target.value)} className="h-9 bg-white/[.03] pr-7 text-center font-mono font-bold text-[#c7ff3f]" /><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/35">km</span></div> : <span className="font-mono font-bold text-[#c7ff3f]">{String(index + 1).padStart(2, "0")}</span>}
                  <div className="flex items-center gap-1.5"><Input aria-label={`Minutos do trecho ${index + 1}`} type="number" min="0" max="59" value={split.minutes} onChange={(e) => updateSplit(index, "minutes", e.target.value)} className="h-9 min-w-0 bg-white/[.03] text-center" /><span className="text-white/35">:</span><Input aria-label={`Segundos do trecho ${index + 1}`} type="number" min="0" max="59" value={split.seconds} onChange={(e) => updateSplit(index, "seconds", e.target.value)} className="h-9 min-w-0 bg-white/[.03] text-center" /></div>
                  <div className="relative"><HeartPulse className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/35" /><Input aria-label={`Frequência cardíaca do km ${index + 1}`} type="number" min="30" max="240" value={split.heartRate} onChange={(e) => updateSplit(index, "heartRate", e.target.value)} className="h-9 bg-white/[.03] pl-8" /></div>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={splits.length === 1} onClick={() => setSplits((current) => current.filter((_, splitIndex) => splitIndex !== index))} className="text-white/35 hover:bg-red-500/10 hover:text-red-400" aria-label={`Remover km ${index + 1}`}><Trash2 /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#c7ff3f]/[.08] p-4 text-center">
            <Summary label="Distância" value={`${formatDistance(totalDistance)} km`} />
            <Summary label="Tempo total" value={formatDuration(totalSeconds)} />
            <Summary label="Ritmo médio" value={`${formatPace(averagePace)} /km`} />
          </div>
          <div className="space-y-2"><Label htmlFor="run-notes">Observações</Label><Textarea id="run-notes" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Como foi o treino?" className="bg-white/[.035]" /></div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60 hover:bg-white/10 hover:text-white">Cancelar</Button><Button disabled={saving} type="submit" className="bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]"><TimerReset />{saving ? "Salvando..." : "Salvar corrida"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] text-white/40">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }
function formatPace(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function formatDuration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60; return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`; }
