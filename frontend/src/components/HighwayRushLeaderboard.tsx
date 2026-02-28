import React from 'react';

interface LeaderboardEntry {
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  carType?: string;
  date: string;
  timestamp: number;
}

interface HighwayRushLeaderboardProps {
  currentScore?: number;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const HighwayRushLeaderboard: React.FC<HighwayRushLeaderboardProps> = ({
  currentScore,
  onClose,
}) => {
  const raw = localStorage.getItem('highway_rush_leaderboard');
  const entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
  const top10 = entries.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-neon-blue/30 bg-gray-950/98 p-6 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron text-xl font-bold text-neon-blue">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Current score highlight */}
        {currentScore !== undefined && currentScore > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-900/20 border border-yellow-500/30 text-center">
            <span className="font-rajdhani text-gray-400 text-sm">Your score: </span>
            <span className="font-orbitron text-yellow-400 font-bold text-lg">
              {currentScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* Table */}
        {top10.length === 0 ? (
          <div className="text-center py-12 text-gray-600 font-rajdhani">
            No scores yet. Start playing!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-2 text-left font-rajdhani text-gray-500 text-xs uppercase w-10">#</th>
                  <th className="pb-2 text-right font-rajdhani text-gray-500 text-xs uppercase">Score</th>
                  <th className="pb-2 text-center font-rajdhani text-gray-500 text-xs uppercase">Car</th>
                  <th className="pb-2 text-center font-rajdhani text-gray-500 text-xs uppercase">Diff</th>
                  <th className="pb-2 text-right font-rajdhani text-gray-500 text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((entry, i) => {
                  const isCurrentScore =
                    currentScore !== undefined && entry.score === currentScore;
                  return (
                    <tr
                      key={entry.timestamp}
                      className={`border-b border-gray-900 ${
                        isCurrentScore ? 'bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="py-2 font-orbitron text-sm">
                        {i < 3 ? (
                          <span>{RANK_MEDALS[i]}</span>
                        ) : (
                          <span className="text-gray-600">{i + 1}</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-orbitron font-bold text-white">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-2 text-center font-rajdhani text-gray-300 text-xs">
                        {entry.carType ?? '—'}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className={`font-rajdhani text-xs capitalize ${
                            DIFFICULTY_COLORS[entry.difficulty] ?? 'text-gray-400'
                          }`}
                        >
                          {entry.difficulty}
                        </span>
                      </td>
                      <td className="py-2 text-right font-rajdhani text-gray-500 text-xs">
                        {entry.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl font-orbitron font-bold text-black bg-neon-blue hover:bg-cyan-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HighwayRushLeaderboard;
