'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AuthButtonProps {
  userEmail: string | null;
}

export default function AuthButton({ userEmail }: AuthButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!userEmail) {
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
        {userEmail}
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
