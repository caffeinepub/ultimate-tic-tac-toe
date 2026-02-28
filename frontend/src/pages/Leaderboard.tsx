import { useNavigate } from "@tanstack/react-router";
import SoundToggle from "../components/SoundToggle";

interface GameScore {
  title: string;
  icon: string;
  key: string;
  unit?: string;
  lowerIsBetter?: boolean;
}

const GAMES: GameScore[] = [
  { title: "Snake Arcade", icon: "🐍", key: "snake_highscore" },
  { title: "Tetris", icon: "🧱", key: "tetris_highscore" },
  { title: "Pong", icon: "🏓", key: "pong_highscore" },
  { title: "Breakout", icon: "🎯", key: "breakout_highscore" },
  { title: "Flappy Bird", icon: "🐦", key: "flappybird_highscore" },
  { title: "Space Invaders", icon: "👾", key: "spaceinvaders_highscore" },
  { title: "Memory Match", icon: "🃏", key: "memorymatch_highscore", unit: "moves", lowerIsBetter: true },
  { title: "Minesweeper", icon: "💣", key: "minesweeper_highscore", unit: "sec", lowerIsBetter: true },
  { title: "Pac-Man", icon: "👻", key: "pacman_highscore" },
  { title: "Endless Runner", icon: "🏃", key: "endless_runner_highscore" },
  { title: "Snake (Classic)", icon: "🐍", key: "snake_highscore_classic" },
  { title: "2048", icon: "🔢", key: "2048_highscore" },
];

function getScore(key: string): string {
  const val = localStorage.getItem(key);
  if (!val || val === "0") return "No score yet";
  return val;
}

export default function Leaderboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-muted-foreground hover:text-neon-blue transition-colors text-sm">← Back</button>
          <h1 className="font-orbitron text-3xl font-black text-neon-blue neon-glow-blue">LEADERBOARD</h1>
          <SoundToggle />
        </div>

        <p className="font-rajdhani text-muted-foreground text-center mb-8">Your personal best scores across all games</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game, idx) => {
            const raw = localStorage.getItem(game.key);
            const hasScore = raw && raw !== "0";
            const displayScore = hasScore ? `${raw}${game.unit ? ` ${game.unit}` : ""}` : "No score yet";

            return (
              <div
                key={game.key}
                className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-all ${hasScore ? "border-neon-blue/30 hover:border-neon-blue/60" : "border-border/30 opacity-60"}`}
              >
                <div className="text-3xl">{game.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-orbitron text-sm font-bold text-foreground truncate">{game.title}</div>
                  <div className={`font-rajdhani text-lg font-bold ${hasScore ? "text-neon-blue" : "text-muted-foreground"}`}>
                    {displayScore}
                  </div>
                  {game.lowerIsBetter && hasScore && (
                    <div className="font-rajdhani text-xs text-muted-foreground">Lower is better</div>
                  )}
                </div>
                <div className={`font-orbitron text-xs px-2 py-1 rounded-full border ${hasScore ? "border-neon-blue/40 text-neon-blue bg-neon-blue/10" : "border-border/30 text-muted-foreground"}`}>
                  #{idx + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("Clear all high scores?")) {
                GAMES.forEach(g => localStorage.removeItem(g.key));
                window.location.reload();
              }
            }}
            className="px-6 py-2 border border-red-500/30 text-red-400 font-rajdhani text-sm rounded-lg hover:bg-red-900/20 transition-colors"
          >
            Reset All Scores
          </button>
        </div>
      </div>

      <footer className="border-t border-border/30 py-6 text-center">
        <p className="font-rajdhani text-muted-foreground text-sm">
          © {new Date().getFullYear()} Ultimate Gaming Arena — Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "ultimate-gaming-arena")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
