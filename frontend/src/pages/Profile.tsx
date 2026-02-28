import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy, Star, Gamepad2, Target, Zap, Award } from 'lucide-react';
import {
  getPlayerProfile,
  getRank,
  getRankImagePath,
  getAvatarImagePath,
  PlayerProfile,
  RankTier,
} from '../utils/playerProfile';

const RANK_COLORS: Record<RankTier, { glow: string; text: string; border: string; bg: string }> = {
  Bronze: {
    glow: '0 0 20px rgba(205,127,50,0.6), 0 0 40px rgba(205,127,50,0.3)',
    text: '#cd7f32',
    border: 'rgba(205,127,50,0.5)',
    bg: 'rgba(205,127,50,0.1)',
  },
  Silver: {
    glow: '0 0 20px rgba(192,192,192,0.6), 0 0 40px rgba(192,192,192,0.3)',
    text: '#c0c0c0',
    border: 'rgba(192,192,192,0.5)',
    bg: 'rgba(192,192,192,0.1)',
  },
  Gold: {
    glow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)',
    text: '#ffd700',
    border: 'rgba(255,215,0,0.5)',
    bg: 'rgba(255,215,0,0.1)',
  },
  Platinum: {
    glow: '0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.3)',
    text: '#00d4ff',
    border: 'rgba(0,212,255,0.5)',
    bg: 'rgba(0,212,255,0.1)',
  },
};

function StatCard({ icon, label, value, color = '#00d4ff' }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border p-4 text-center transition-all duration-300 hover:scale-105"
      style={{
        borderColor: 'rgba(0,212,255,0.2)',
        background: 'rgba(0,212,255,0.05)',
        boxShadow: '0 0 20px rgba(0,212,255,0.05)',
      }}
    >
      <div className="mb-2" style={{ color }}>{icon}</div>
      <div className="font-orbitron text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 font-rajdhani text-xs uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [xpBarWidth, setXpBarWidth] = useState(0);

  useEffect(() => {
    const p = getPlayerProfile();
    setProfile(p);
    if (p) {
      const xpInLevel = p.totalXP % 100;
      setTimeout(() => setXpBarWidth(xpInLevel), 100);
    }
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="font-orbitron text-xl text-neon-blue">No profile found.</div>
          <Link to="/" className="mt-4 block font-rajdhani text-gray-400 hover:text-neon-blue">
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  const rank = getRank(profile.level);
  const rankColors = RANK_COLORS[rank];
  const xpInLevel = profile.totalXP % 100;
  const xpToNextLevel = 100;
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Back button */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 font-rajdhani text-sm text-gray-400 transition-colors hover:text-neon-blue"
        >
          <ArrowLeft size={16} />
          Back to Arena
        </Link>

        {/* Profile Header Card */}
        <div
          className="mb-6 rounded-2xl border p-6 sm:p-8"
          style={{
            borderColor: 'rgba(0,212,255,0.3)',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,0,0,0) 100%)',
            boxShadow: '0 0 40px rgba(0,212,255,0.1)',
          }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="h-28 w-28 overflow-hidden rounded-2xl border-2"
                style={{
                  borderColor: 'rgba(0,212,255,0.5)',
                  boxShadow: '0 0 30px rgba(0,212,255,0.4)',
                }}
              >
                <img
                  src={getAvatarImagePath(profile.avatarId)}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="h-full w-full flex items-center justify-center text-5xl bg-gray-800">${['🤖','👾','🦊','🐉','⚡'][profile.avatarId - 1] || '🎮'}</div>`;
                    }
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1
                className="font-orbitron text-3xl font-black text-white"
                style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}
              >
                {profile.username}
              </h1>

              {/* Rank Badge */}
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{
                  borderColor: rankColors.border,
                  background: rankColors.bg,
                  boxShadow: rankColors.glow,
                }}
              >
                <img
                  src={getRankImagePath(rank)}
                  alt={rank}
                  className="h-5 w-5 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="font-orbitron text-xs font-bold uppercase tracking-widest" style={{ color: rankColors.text }}>
                  {rank}
                </span>
              </div>

              {/* Level */}
              <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
                <span className="font-rajdhani text-sm uppercase tracking-widest text-gray-400">Level</span>
                <span
                  className="font-orbitron text-4xl font-black text-neon-blue"
                  style={{ textShadow: '0 0 20px rgba(0,212,255,0.8)' }}
                >
                  {profile.level}
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between font-rajdhani text-xs text-gray-400">
                  <span>XP Progress</span>
                  <span>{xpInLevel} / {xpToNextLevel} XP</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${xpBarWidth}%`,
                      background: 'linear-gradient(90deg, #00d4ff, #7b2fff)',
                      boxShadow: '0 0 10px rgba(0,212,255,0.6)',
                    }}
                  />
                </div>
                <div className="mt-1 font-rajdhani text-xs text-gray-500">
                  Total XP: {profile.totalXP}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Gamepad2 size={24} />} label="Games Played" value={profile.gamesPlayed} />
          <StatCard icon={<Trophy size={24} />} label="Wins" value={profile.wins} color="#ffd700" />
          <StatCard icon={<Target size={24} />} label="Win Rate" value={`${winRate}%`} color="#a855f7" />
          <StatCard icon={<Star size={24} />} label="Total Score" value={profile.totalScore.toLocaleString()} color="#f59e0b" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Achievements */}
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: 'rgba(168,85,247,0.3)',
              background: 'rgba(168,85,247,0.05)',
              boxShadow: '0 0 20px rgba(168,85,247,0.1)',
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Award size={20} className="text-purple-400" />
              <h3 className="font-orbitron text-sm font-bold uppercase tracking-widest text-purple-400">
                Achievements
              </h3>
            </div>
            <div className="font-orbitron text-5xl font-black text-purple-400" style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>
              {profile.achievementsUnlocked}
            </div>
            <div className="mt-1 font-rajdhani text-sm text-gray-400">Unlocked</div>
            <Link
              to="/achievements"
              className="mt-3 inline-block font-rajdhani text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {/* XP Breakdown */}
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: 'rgba(0,212,255,0.3)',
              background: 'rgba(0,212,255,0.05)',
              boxShadow: '0 0 20px rgba(0,212,255,0.1)',
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Zap size={20} className="text-neon-blue" />
              <h3 className="font-orbitron text-sm font-bold uppercase tracking-widest text-neon-blue">
                XP System
              </h3>
            </div>
            <div className="space-y-2 font-rajdhani text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Win a game</span>
                <span className="text-green-400 font-bold">+20 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lose a game</span>
                <span className="text-yellow-400 font-bold">+5 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Score milestone</span>
                <span className="text-neon-blue font-bold">+10 XP</span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-2">
                <span className="text-gray-400">Level up every</span>
                <span className="text-white font-bold">100 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rank Progression */}
        <div
          className="mt-6 rounded-2xl border p-6"
          style={{
            borderColor: 'rgba(0,212,255,0.2)',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <h3 className="mb-4 font-orbitron text-sm font-bold uppercase tracking-widest text-gray-400">
            Rank Progression
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['Bronze', 'Silver', 'Gold', 'Platinum'] as RankTier[]).map((r) => {
              const rc = RANK_COLORS[r];
              const isCurrentRank = rank === r;
              return (
                <div
                  key={r}
                  className="flex flex-col items-center rounded-xl border p-3 text-center transition-all duration-300"
                  style={{
                    borderColor: isCurrentRank ? rc.border : 'rgba(255,255,255,0.05)',
                    background: isCurrentRank ? rc.bg : 'transparent',
                    boxShadow: isCurrentRank ? rc.glow : 'none',
                    transform: isCurrentRank ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <img
                    src={getRankImagePath(r)}
                    alt={r}
                    className="mb-2 h-10 w-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="font-orbitron text-xs font-bold" style={{ color: isCurrentRank ? rc.text : '#6b7280' }}>
                    {r}
                  </div>
                  <div className="mt-1 font-rajdhani text-xs text-gray-500">
                    {r === 'Bronze' ? 'Lv 1–3' : r === 'Silver' ? 'Lv 4–6' : r === 'Gold' ? 'Lv 7–10' : 'Lv 11+'}
                  </div>
                  {isCurrentRank && (
                    <div className="mt-1 font-rajdhani text-xs font-bold" style={{ color: rc.text }}>
                      ← Current
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
