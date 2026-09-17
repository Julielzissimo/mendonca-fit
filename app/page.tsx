"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthScreen } from "@/components/auth-screen";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setChecking(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (checking) return <div className="min-h-screen bg-[#080a0d] p-6"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-16 bg-white/[.06]" /><Skeleton className="mt-20 h-24 bg-white/[.06]" /><Skeleton className="h-96 bg-white/[.06]" /></div></div>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;
  return <Dashboard userId={session?.user.id ?? "demo-user"} />;
}
