'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium transition-all"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-sm truncate max-w-[150px]">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs font-medium transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
