"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AthleteDraft } from "@/lib/types";

export function AthleteDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (draft: AthleteDraft) => Promise<void> }) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), birth_date: birthDate || null, start_weight_kg: startWeight ? Number(startWeight.replace(",", ".")) : null, target_weight_kg: targetWeight ? Number(targetWeight.replace(",", ".")) : null });
      setName(""); setBirthDate(""); setStartWeight(""); setTargetWeight(""); onOpenChange(false);
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#11151a] text-white sm:max-w-lg">
        <DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-xl bg-[#c7ff3f] text-[#101508]"><UserPlus className="size-5" /></div><DialogTitle className="text-2xl tracking-[-.03em]">Cadastrar pessoa</DialogTitle><DialogDescription>As corridas, pesos e métricas ficarão separadas neste perfil.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="athlete-name">Nome</Label><Input id="athlete-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do membro" className="h-11 bg-white/[.035]" /></div>
          <div className="space-y-2"><Label htmlFor="athlete-birth">Data de nascimento <span className="font-normal text-white/35">(opcional)</span></Label><Input id="athlete-birth" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-11 bg-white/[.035]" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="athlete-start">Peso inicial</Label><div className="relative"><Input id="athlete-start" inputMode="decimal" value={startWeight} onChange={(event) => setStartWeight(event.target.value)} placeholder="82,0" className="h-11 bg-white/[.035] pr-10" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">kg</span></div></div>
            <div className="space-y-2"><Label htmlFor="athlete-target">Meta de peso</Label><div className="relative"><Input id="athlete-target" inputMode="decimal" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} placeholder="72,0" className="h-11 bg-white/[.035] pr-10" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">kg</span></div></div>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60 hover:bg-white/10 hover:text-white">Cancelar</Button><Button disabled={saving} type="submit" className="bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]">{saving ? "Salvando..." : "Cadastrar pessoa"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
