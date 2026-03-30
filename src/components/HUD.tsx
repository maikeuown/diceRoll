'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types';

interface HUDProps {
  profile: Profile | null;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function HUD({ profile }: HUDProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.last_drop) {
      setCountdown(null);
      return;
    }

    const cooldownEnd = new Date(profile.last_drop).getTime() + 24 * 60 * 60 * 1000;

    const update = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCountdown(null);
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [profile?.last_drop]);

  if (!profile) return null;

  return (
    <div className="flex items-center gap-6 text-white/70">
      <div className="text-center">
        <div className="text-2xl font-black tabular-nums text-white">
          {profile.total_score.toLocaleString()}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">Total Score</div>
      </div>

      {countdown && (
        <div className="text-center">
          <div className="text-lg font-mono tabular-nums text-purple-400">
            {countdown}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/40">Next Drop</div>
        </div>
      )}
    </div>
  );
}
