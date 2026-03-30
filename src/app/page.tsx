import { createClient } from '@/lib/supabase/server';
import DiceCanvas from '@/components/DiceCanvas';
import Leaderboard from '@/components/Leaderboard';
import AuthButton from '@/components/AuthButton';
import HUD from '@/components/HUD';
import type { Profile, LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let profile: Profile | null = null;
  let canDrop = false;
  let elite: LeaderboardEntry[] = [];
  let cursed: LeaderboardEntry[] = [];
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, total_score, last_drop, active_skin')
        .eq('id', user.id)
        .single();

      if (data) {
        profile = data as Profile;
        if (!profile.last_drop) {
          canDrop = true;
        } else {
          // Can drop again after midnight UTC
          const lastDrop = new Date(profile.last_drop);
          const now = new Date();
          const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          canDrop = lastDrop < todayMidnight;
        }
      }
    }

    // Fetch leaderboards
    const { data: topScores } = await supabase
      .from('profiles')
      .select('username, total_score')
      .gt('total_score', 0)
      .order('total_score', { ascending: false })
      .limit(3);

    const { data: bottomScores } = await supabase
      .from('profiles')
      .select('username, total_score')
      .gt('total_score', 0)
      .order('total_score', { ascending: true })
      .limit(3);

    elite = (topScores ?? []) as LeaderboardEntry[];
    cursed = (bottomScores ?? []) as LeaderboardEntry[];
  } catch {
    // Supabase not configured yet — run in demo mode
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Auth header */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <HUD profile={profile} />
        <AuthButton userEmail={userEmail} />
      </div>

      {/* 3D Dice scene */}
      <div className="flex-1 relative">
        <DiceCanvas profile={profile} canDrop={canDrop} />
      </div>

      {/* Leaderboard footer */}
      <div className="p-4 flex justify-center">
        <Leaderboard elite={elite} cursed={cursed} />
      </div>
    </main>
  );
}
