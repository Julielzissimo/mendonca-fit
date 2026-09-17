"use client";

import { useEffect, useState } from "react";
import type { Models } from "appwrite";

import { AuthScreen } from "@/components/auth-screen";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { account } from "@/lib/appwrite";

export default function Home() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="min-h-screen bg-[#080a0d] p-6"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-16 bg-white/[.06]" /><Skeleton className="mt-20 h-24 bg-white/[.06]" /><Skeleton className="h-96 bg-white/[.06]" /></div></div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <Dashboard userId={user.$id} onSignOut={() => setUser(null)} />;
}
