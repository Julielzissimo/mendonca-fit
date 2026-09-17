"use client";

import { useState } from "react";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeightDraft } from "@/lib/types";

export function WeightDialog({ open, onOpenChange, onSave, lastWeight }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (draft: WeightDraft) => Promise<void>; lastWeight?: number }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState(lastWeight ? String(lastWeight) : "");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(weight.replace(",", "."));
    if (value < 25 || value > 400) return;
    setSaving(true);
    try { await onSave({ entry_date: date, weight_kg: value }); onOpenChange(false); } finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#11151a] text-white sm:max-w-md">
        <DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-xl bg-[#c7ff3f] text-[#101508]"><Scale className="size-5" /></div><DialogTitle className="text-2xl tracking-[-.03em]">Registrar peso</DialogTitle><DialogDescription>Um registro por dia. Se a data já existir, o valor será atualizado.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="weight-date">Data</Label><Input id="weight-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="h-11 bg-white/[.035]" /></div>
          <div className="space-y-2"><Label htmlFor="weight-value">Peso</Label><div className="relative"><Input id="weight-value" inputMode="decimal" required value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="78,6" className="h-16 bg-white/[.035] pr-14 text-2xl font-bold" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">kg</span></div></div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60 hover:bg-white/10 hover:text-white">Cancelar</Button><Button disabled={saving} type="submit" className="bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]">{saving ? "Salvando..." : "Salvar peso"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
