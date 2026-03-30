'use client';

import type { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  elite: LeaderboardEntry[];
  cursed: LeaderboardEntry[];
}

function LeaderboardCard({
  title,
  entries,
  colorClass,
  emptyText,
}: {
  title: string;
  entries: LeaderboardEntry[];
  colorClass: string;
  emptyText: string;
}) {
  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex-1 min-w-[200px]">
      <h3 className={`text-sm font-bold uppercase tracking-[0.15em] mb-3 ${colorClass}`}>
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-white/30 text-xs">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={entry.username} className="flex items-center gap-3">
              <span
                className="text-lg font-black w-6 text-center"
                style={{ color: medals[i] ?? '#666' }}
              >
                {i + 1}
              </span>
              <span className="text-white/80 text-sm font-medium truncate flex-1">
                {entry.username}
              </span>
              <span className={`text-sm font-bold tabular-nums ${colorClass}`}>
                {entry.total_score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Leaderboard({ elite, cursed }: LeaderboardProps) {
  return (
    <div className="flex gap-3 w-full max-w-xl">
      <LeaderboardCard
        title="The Elite"
        entries={elite}
        colorClass="text-yellow-400"
        emptyText="No scores yet"
      />
      <LeaderboardCard
        title="The Cursed"
        entries={cursed}
        colorClass="text-purple-400"
        emptyText="No scores yet"
      />
    </div>
  );
}
