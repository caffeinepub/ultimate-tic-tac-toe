import React, { useState, useEffect } from 'react';
import { createDefaultProfile, savePlayerProfile, getPlayerProfile, getAvatarImagePath } from '../utils/playerProfile';

const AVATARS = [1, 2, 3, 4, 5];

export default function FirstVisitModal() {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [error, setError] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const profile = getPlayerProfile();
    if (!profile) {
      setVisible(true);
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less.');
      return;
    }
    const profile = createDefaultProfile(trimmed, selectedAvatar);
    savePlayerProfile(profile);
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-neon-blue/40 bg-gray-950 p-8 shadow-2xl"
        style={{
          boxShadow: '0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(0,212,255,0.1)',
          transform: animateIn ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.95)',
          opacity: animateIn ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🎮</div>
          <h2
            className="font-orbitron text-2xl font-bold text-neon-blue"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.8)' }}
          >
            WELCOME, PLAYER
          </h2>
          <p className="mt-1 font-rajdhani text-sm text-gray-400">
            Set up your profile to track your progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="mb-2 block font-rajdhani text-sm font-semibold uppercase tracking-widest text-neon-blue">
              Choose Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter your username..."
              maxLength={20}
              className="w-full rounded-lg border border-neon-blue/30 bg-gray-900 px-4 py-3 font-rajdhani text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/20"
              style={{ caretColor: '#00d4ff' }}
              autoFocus
            />
            {error && (
              <p className="mt-1 font-rajdhani text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="mb-3 block font-rajdhani text-sm font-semibold uppercase tracking-widest text-neon-blue">
              Choose Avatar
            </label>
            <div className="flex flex-wrap justify-center gap-3">
              {AVATARS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedAvatar(id)}
                  className="relative rounded-xl border-2 p-1 transition-all duration-200"
                  style={{
                    borderColor: selectedAvatar === id ? '#00d4ff' : 'rgba(0,212,255,0.2)',
                    boxShadow: selectedAvatar === id
                      ? '0 0 16px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.2)'
                      : 'none',
                    transform: selectedAvatar === id ? 'scale(1.1)' : 'scale(1)',
                    background: selectedAvatar === id ? 'rgba(0,212,255,0.1)' : 'transparent',
                  }}
                >
                  <img
                    src={getAvatarImagePath(id)}
                    alt={`Avatar ${id}`}
                    className="h-14 w-14 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'avatar-fallback h-14 w-14 rounded-lg flex items-center justify-center text-2xl bg-gray-800';
                        fallback.textContent = ['🤖', '👾', '🦊', '🐉', '⚡'][id - 1];
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {selectedAvatar === id && (
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon-blue text-xs text-black font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="neon-btn-blue w-full rounded-xl py-3 font-orbitron text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:scale-105"
          >
            Start Playing →
          </button>
        </form>
      </div>
    </div>
  );
}
