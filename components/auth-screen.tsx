"use client";

import { useState } from "react";
import { Activity, ArrowRight, HeartPulse, Scale, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export function AuthScreen() {
  const [loading, setLoading] = useState(false);

  async function authenticate(formData: FormData) {
    if (!supabase) return;
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) return toast.error(result.error.message);
    toast.success("Bem-vindo de volta.");
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#080a0d] text-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(199,255,63,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(199,255,63,.06)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#c7ff3f] text-[#0b0f08]"><TrendingUp className="size-5" strokeWidth={2.6} /></div>
          <div><p className="font-extrabold tracking-[-.03em]">MENDONÇA FIT</p><p className="text-xs text-white/40">corrida & evolução</p></div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.16em] text-[#c7ff3f]">Seu histórico. Seu ritmo.</p>
          <h1 className="text-6xl font-black leading-[.92] tracking-[-.065em]">Cada quilômetro conta uma história.</h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-white/55">Acompanhe ritmo, frequência cardíaca e peso em um único painel pensado para sua evolução.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[{ icon: Activity, label: "Ritmo por km" }, { icon: HeartPulse, label: "Frequência" }, { icon: Scale, label: "Peso diário" }].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Icon className="mb-8 size-5 text-[#c7ff3f]" /><p className="text-sm font-semibold">{label}</p></div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#c7ff3f] text-[#0b0f08]"><TrendingUp className="size-5" /></div>
            <p className="font-extrabold">MENDONÇA FIT</p>
          </div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#c7ff3f]">Acesse seu painel</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.05em]">Pronto para a próxima?</h2>
          <p className="mt-3 text-white/45">Use o acesso compartilhado para visualizar e cadastrar todos os membros.</p>
          <div className="mt-8"><AuthForm loading={loading} onSubmit={authenticate} /></div>
        </div>
      </section>
    </main>
  );
}

function AuthForm({ loading, onSubmit }: { loading: boolean; onSubmit: (data: FormData) => void }) {
  return (
    <form action={onSubmit} className="mt-6 space-y-5">
      <div className="space-y-2"><Label htmlFor="signin-email">E-mail</Label><Input id="signin-email" name="email" type="email" required placeholder="acesso@exemplo.com" className="h-12 bg-white/[.035]" /></div>
      <div className="space-y-2"><Label htmlFor="signin-password">Senha</Label><Input id="signin-password" name="password" type="password" minLength={6} required placeholder="Senha de acesso" className="h-12 bg-white/[.035]" /></div>
      <Button disabled={loading} className="h-12 w-full bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]">{loading ? "Só um instante..." : "Entrar no painel"}<ArrowRight className="size-4" /></Button>
    </form>
  );
}
