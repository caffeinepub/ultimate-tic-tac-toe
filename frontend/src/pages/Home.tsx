import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";

interface GameCard {
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  badge?: string;
}

const ARCADE_GAMES: GameCard[] = [
  { title: "Highway Rush", description: "Dodge traffic at high speeds in this 3D endless racer.", icon: "🏎️", path: "/highway-rush", color: "from-yellow-900/40 to-orange-800/20 border-yellow-500/40 hover:border-yellow-400", badge: "NEW" },
  { title: "Snake Arcade", description: "Classic snake — eat, grow, survive!", icon: "🐍", path: "/snake-arcade", color: "from-green-900/40 to-green-800/20 border-green-500/40 hover:border-green-400" },
  { title: "Tetris", description: "Stack tetrominoes and clear lines.", icon: "🧱", path: "/tetris", color: "from-cyan-900/40 to-cyan-800/20 border-cyan-500/40 hover:border-cyan-400" },
  { title: "Pong", description: "Two-player paddle battle to 10 points.", icon: "🏓", path: "/pong", color: "from-yellow-900/40 to-yellow-800/20 border-yellow-500/40 hover:border-yellow-400" },
  { title: "Breakout", description: "Smash bricks with a bouncing ball.", icon: "🧱", path: "/brick-breaker", color: "from-orange-900/40 to-orange-800/20 border-orange-500/40 hover:border-orange-400" },
  { title: "Flappy Bird", description: "Tap to fly through the pipes.", icon: "🐦", path: "/flappy-bird", color: "from-sky-900/40 to-sky-800/20 border-sky-500/40 hover:border-sky-400" },
  { title: "Space Invaders", description: "Defend Earth from alien waves.", icon: "👾", path: "/space-invaders", color: "from-purple-900/40 to-purple-800/20 border-purple-500/40 hover:border-purple-400" },
  { title: "Memory Match", description: "Flip cards and match all pairs.", icon: "🃏", path: "/memory-card-match", color: "from-pink-900/40 to-pink-800/20 border-pink-500/40 hover:border-pink-400" },
  { title: "Minesweeper", description: "Reveal the grid without hitting mines.", icon: "💣", path: "/minesweeper", color: "from-red-900/40 to-red-800/20 border-red-500/40 hover:border-red-400" },
  { title: "Pac-Man", description: "Eat pellets, dodge ghosts, power up!", icon: "👻", path: "/pac-man", color: "from-amber-900/40 to-amber-800/20 border-amber-500/40 hover:border-amber-400" },
  { title: "Endless Runner", description: "Dodge obstacles in a neon 3D world.", icon: "🏃", path: "/endless-runner", color: "from-teal-900/40 to-teal-800/20 border-teal-500/40 hover:border-teal-400" },
  { title: "Dark Trap Escape", description: "Navigate deadly traps and escape through challenging platformer levels.", icon: "🕳️", path: "/dark-trap-escape", color: "from-slate-900/60 to-gray-900/40 border-rose-500/40 hover:border-rose-400" },
];

const CLASSIC_GAMES: GameCard[] = [
  { title: "Tic Tac Toe", description: "Classic X vs O — single or two player.", icon: "⭕", path: "/single-player", color: "from-neon-blue/10 to-neon-purple/10 border-neon-blue/40 hover:border-neon-blue" },
  { title: "Rock Paper Scissors", description: "Beat the AI in this timeless game.", icon: "✊", path: "/rock-paper-scissors", color: "from-neon-purple/10 to-neon-blue/10 border-neon-purple/40 hover:border-neon-purple" },
  { title: "2048", description: "Merge tiles to reach 2048.", icon: "🔢", path: "/2048", color: "from-neon-blue/10 to-neon-purple/10 border-neon-blue/40 hover:border-neon-blue" },
  { title: "Connect 4", description: "Drop discs and connect four in a row.", icon: "🔴", path: "/connect4", color: "from-neon-purple/10 to-neon-blue/10 border-neon-purple/40 hover:border-neon-purple" },
  { title: "Snake", description: "Classic snake with difficulty levels.", icon: "🐍", path: "/snake", color: "from-neon-blue/10 to-neon-purple/10 border-neon-blue/40 hover:border-neon-blue" },
  { title: "Traffic Rush", description: "Dodge traffic in a fast-paced race.", icon: "🚗", path: "/traffic-car", color: "from-neon-purple/10 to-neon-blue/10 border-neon-purple/40 hover:border-neon-purple" },
  { title: "Snake & Ladder", description: "Roll dice and race to the top.", icon: "🎲", path: "/snake-and-ladder", color: "from-neon-blue/10 to-neon-purple/10 border-neon-blue/40 hover:border-neon-blue" },
];

export default function Home() {
  const navigate = useNavigate();
  const { playSound } = useSoundManager();

  const handlePlay = (path: string) => {
    playSound("click");
    navigate({ to: path });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="font-orbitron text-4xl md:text-6xl font-black text-neon-blue neon-glow-blue mb-4">
            ULTIMATE GAMING ARENA
          </h1>
          <p className="font-rajdhani text-xl text-muted-foreground mb-6">
            12 arcade classics + 7 strategy games. All in one neon-lit hub.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="px-4 py-1 rounded-full border border-neon-blue/40 text-neon-blue font-rajdhani text-sm">
              19 Games
            </span>
            <span className="px-4 py-1 rounded-full border border-neon-purple/40 text-neon-purple font-rajdhani text-sm">
              High Score Tracking
            </span>
            <span className="px-4 py-1 rounded-full border border-green-500/40 text-green-400 font-rajdhani text-sm">
              Free to Play
            </span>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <SoundToggle />
        </div>
      </section>

      {/* Arcade Games */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="font-orbitron text-2xl font-bold text-neon-blue mb-2">🕹️ Arcade Games</h2>
        <p className="font-rajdhani text-muted-foreground mb-6">12 fully playable arcade classics with high score tracking</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ARCADE_GAMES.map((game) => (
            <GameCardComponent key={game.path} game={game} onPlay={handlePlay} />
          ))}
        </div>
      </section>

      {/* Classic Games */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="font-orbitron text-2xl font-bold text-neon-purple mb-2">🎯 Classic Games</h2>
        <p className="font-rajdhani text-muted-foreground mb-6">Strategy and puzzle games with achievements</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CLASSIC_GAMES.map((game) => (
            <GameCardComponent key={game.path} game={game} onPlay={handlePlay} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 text-center">
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

function GameCardComponent({ game, onPlay }: { game: GameCard; onPlay: (path: string) => void }) {
  return (
    <div
      className={`relative bg-gradient-to-br ${game.color} border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
      onClick={() => onPlay(game.path)}
    >
      {game.badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-xs font-orbitron rounded-full">
          {game.badge}
        </span>
      )}
      <div className="text-4xl mb-3">{game.icon}</div>
      <h3 className="font-orbitron text-sm font-bold text-foreground mb-1 group-hover:text-neon-blue transition-colors">
        {game.title}
      </h3>
      <p className="font-rajdhani text-xs text-muted-foreground mb-4">{game.description}</p>
      <button className="w-full py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-orbitron text-xs hover:bg-neon-blue/20 transition-colors">
        PLAY
      </button>
    </div>
  );
}
