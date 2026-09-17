"use client";

import { useState } from "react";
import { Activity, ArrowRight, HeartPulse, Scale, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: Models.User<Models.Preferences>) => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [recovery] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const secret = params.get("secret");
    return userId && secret ? { userId, secret } : null;
  });

  async function authenticate(formData: FormData) {
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    setLoading(true);
    try {
      await account.createEmailPasswordSession({ email, password });
      const user = await account.get();
      onAuthenticated(user);
      toast.success("Bem-vindo de volta.");
    } catch {
      toast.error("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  async function requestRecovery() {
    if (!email) return toast.error("Informe o e-mail de acesso.");
    setLoading(true);
    try {
      await account.createRecovery({ email, url: `${window.location.origin}${window.location.pathname}` });
      setRecoverySent(true);
      toast.success("Enviamos o link para redefinir a senha.");
    } catch {
      toast.error("Não foi possível enviar o link de recuperação.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(formData: FormData) {
    if (!recovery) return;
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("confirmation") || "");
    if (password !== confirmation) return toast.error("As senhas não coincidem.");
    setLoading(true);
    try {
      await account.updateRecovery({ ...recovery, password });
      window.history.replaceState({}, "", window.location.pathname);
      toast.success("Senha atualizada. Entre com a nova senha.");
      window.location.reload();
    } catch {
      toast.error("O link expirou ou já foi utilizado.");
      setLoading(false);
    }
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
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#c7ff3f]">{recovery ? "Defina seu acesso" : "Acesse seu painel"}</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.05em]">{recovery ? "Crie uma nova senha." : "Pronto para a próxima?"}</h2>
          <p className="mt-3 text-white/45">{recovery ? "Escolha uma senha forte para o login compartilhado." : "Use o acesso compartilhado para visualizar e cadastrar todos os membros."}</p>
          <div className="mt-8">{recovery ? <ResetForm loading={loading} onSubmit={updatePassword} /> : <AuthForm email={email} loading={loading} recoverySent={recoverySent} onEmailChange={setEmail} onRecover={requestRecovery} onSubmit={authenticate} />}</div>
        </div>
      </section>
    </main>
  );
}

function AuthForm({ email, loading, recoverySent, onEmailChange, onRecover, onSubmit }: { email: string; loading: boolean; recoverySent: boolean; onEmailChange: (value: string) => void; onRecover: () => void; onSubmit: (data: FormData) => void }) {
  return (
    <form action={onSubmit} className="mt-6 space-y-5">
      <div className="space-y-2"><Label htmlFor="signin-email">E-mail</Label><Input id="signin-email" name="email" type="email" required value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="acesso@exemplo.com" className="h-12 bg-white/[.035]" /></div>
      <div className="space-y-2"><Label htmlFor="signin-password">Senha</Label><Input id="signin-password" name="password" type="password" minLength={6} required placeholder="Senha de acesso" className="h-12 bg-white/[.035]" /></div>
      <Button disabled={loading} className="h-12 w-full bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]">{loading ? "Só um instante..." : "Entrar no painel"}<ArrowRight className="size-4" /></Button>
      <Button type="button" variant="ghost" disabled={loading || recoverySent} onClick={onRecover} className="w-full text-white/55 hover:bg-white/[.05] hover:text-white">{recoverySent ? "Link enviado para o e-mail" : "Esqueci ou quero trocar a senha"}</Button>
    </form>
  );
}

function ResetForm({ loading, onSubmit }: { loading: boolean; onSubmit: (data: FormData) => void }) {
  return (
    <form action={onSubmit} className="mt-6 space-y-5">
      <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" name="password" type="password" minLength={8} required placeholder="No mínimo 8 caracteres" className="h-12 bg-white/[.035]" /></div>
      <div className="space-y-2"><Label htmlFor="password-confirmation">Confirme a nova senha</Label><Input id="password-confirmation" name="confirmation" type="password" minLength={8} required placeholder="Repita a nova senha" className="h-12 bg-white/[.035]" /></div>
      <Button disabled={loading} className="h-12 w-full bg-[#c7ff3f] font-bold text-[#101508] hover:bg-[#d7ff75]">{loading ? "Atualizando..." : "Salvar nova senha"}<ArrowRight className="size-4" /></Button>
    </form>
  );
}
