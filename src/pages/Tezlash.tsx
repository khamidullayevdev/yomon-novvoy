import { useState, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Player {
  id: number;
  name: string;
  color: string;
  accentColor: string;
  textColor: string;
  timeLeft: number;
  isEliminated: boolean;
}

// ── Luxury Palettes ───────────────────────────────────────────────────────────
const PALETTES = [
  { color: "#0d3320", accentColor: "#22c55e", textColor: "#86efac", label: "Deep Emerald" },
  { color: "#1a1200", accentColor: "#d4af37", textColor: "#fde68a", label: "Midnight Gold" },
  { color: "#1a0a2e", accentColor: "#a855f7", textColor: "#d8b4fe", label: "Royal Amethyst" },
  { color: "#2d0f00", accentColor: "#ea580c", textColor: "#fed7aa", label: "Burnt Sienna" },
  { color: "#001a2e", accentColor: "#0ea5e9", textColor: "#bae6fd", label: "Ocean Sapphire" },
  { color: "#1a0011", accentColor: "#ec4899", textColor: "#fbcfe8", label: "Crimson Rose" },
  { color: "#0a1a00", accentColor: "#84cc16", textColor: "#d9f99d", label: "Lime Citrine" },
  { color: "#001818", accentColor: "#14b8a6", textColor: "#99f6e4", label: "Arctic Teal" },
  { color: "#1a0a00", accentColor: "#f59e0b", textColor: "#fde68a", label: "Amber Dusk" },
  { color: "#10001a", accentColor: "#8b5cf6", textColor: "#ede9fe", label: "Velvet Indigo" },
  { color: "#001a0a", accentColor: "#10b981", textColor: "#a7f3d0", label: "Jade Mist" },
  { color: "#1a1010", accentColor: "#f87171", textColor: "#fecaca", label: "Ruby Flame" },
];

const formatTime = (s: number) => {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// ── Clockwise Perimeter Layout ────────────────────────────────────────────────
//
// Players are placed clockwise around the PERIMETER of a cols×rows grid:
//   Top row left→right, right col top→bottom, bottom row right→left, left col bottom→top.
// Interior cells stay empty (dark). Turn order follows this same ring.
//
// Grid sizing: find smallest cols×rows where perimeter = 2*(cols+rows-2) >= n.

function getGridDims(n: number): { cols: number; rows: number } {
  if (n <= 2) return { cols: 2, rows: 1 };
  // Try compact grids: favour wider over taller for mobile (portrait)
  for (let rows = 2; rows <= 10; rows++) {
    for (let cols = 2; cols <= 10; cols++) {
      const perim = 2 * (cols - 1) + 2 * (rows - 1);
      if (perim >= n) return { cols, rows };
    }
  }
  return { cols: 4, rows: 4 };
}

// Returns clockwise perimeter [row, col] positions for a cols×rows grid
function perimeterCells(cols: number, rows: number): [number, number][] {
  if (rows === 1) return Array.from({ length: cols }, (_, i) => [0, i] as [number, number]);
  const cells: [number, number][] = [];
  for (let c = 0; c < cols; c++) cells.push([0, c]);           // top L→R
  for (let r = 1; r < rows; r++) cells.push([r, cols - 1]);    // right T→B
  for (let c = cols - 2; c >= 0; c--) cells.push([rows - 1, c]); // bottom R→L
  for (let r = rows - 2; r >= 1; r--) cells.push([r, 0]);      // left B→T
  return cells;
}

function buildLayout(n: number) {
  const { cols, rows } = getGridDims(n);
  const perimeter = perimeterCells(cols, rows);
  const playerPositions = perimeter.slice(0, n);

  // Mark which cells are used
  const usedSet = new Set(playerPositions.map(([r, c]) => `${r},${c}`));

  // Build grid-template-areas: named areas for players, "empty" for interior
  // CSS grid doesn't allow duplicate "empty" names in different cells without
  // individual names, so we name each empty cell uniquely.
  const grid: string[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const key = `${r},${c}`;
      if (usedSet.has(key)) {
        const pIdx = playerPositions.findIndex(([pr, pc]) => pr === r && pc === c);
        return `p${pIdx}`;
      }
      return `e${r}x${c}`; // unique empty cell name
    })
  );

  const areas = grid.map((row) => `"${row.join(" ")}"`).join(" ");
  const colsStr = Array(cols).fill("1fr").join(" ");
  const rowsStr = Array(rows).fill("1fr").join(" ");

  // Interior (empty) cells
  const interiorCells: { row: number; col: number; areaName: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!usedSet.has(`${r},${c}`)) {
        interiorCells.push({ row: r, col: c, areaName: `e${r}x${c}` });
      }
    }
  }

  return { cols, rows, areas, colsStr, rowsStr, playerPositions, interiorCells };
}

// Only draw borders on inner edges (not touching window boundary)
function getCellBorder(row: number, col: number, cols: number, rows: number): React.CSSProperties {
  const B = "1px solid rgba(255,255,255,0.08)";
  const s: React.CSSProperties = {};
  if (col < cols - 1) s.borderRight = B;
  if (row < rows - 1) s.borderBottom = B;
  return s;
}

// ── GoldDivider ───────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <div className="w-1 h-1 rounded-full" style={{ background: "#d4af37" }} />
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ── PlayerCell ────────────────────────────────────────────────────────────────
function PlayerCell({
  player, isActive, onClick, row, col, cols, rows,
}: {
  player: Player; isActive: boolean; onClick: () => void;
  row: number; col: number; cols: number; rows: number;
}) {
  const isLow = player.timeLeft > 0 && player.timeLeft <= 10;
  const isDead = player.timeLeft <= 0;
  const borders = getCellBorder(row, col, cols, rows);

  const timerColor = isDead ? "#ef4444" : isLow ? "#f97316" : isActive ? "#ffffff" : "rgba(255,255,255,0.18)";

  return (
    <div
      onClick={isActive && !player.isEliminated ? onClick : undefined}
      style={{
        gridArea: `p${player.id}`,
        background: player.isEliminated
          ? "#080808"
          : isActive
          ? `radial-gradient(ellipse at center, ${player.color}e0 0%, #000 100%)`
          : "#0c0c0c",
        cursor: isActive && !player.isEliminated ? "pointer" : "default",
        transition: "background 0.45s ease",
        position: "relative",
        overflow: "hidden",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        ...borders,
      }}
      className="flex flex-col items-center justify-center"
    >
      {/* Glow */}
      {isActive && !player.isEliminated && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${player.accentColor}1e 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {player.isEliminated ? (
        <div className="flex flex-col items-center gap-1 opacity-20">
          <span style={{ fontSize: "clamp(1rem, 4vw, 1.8rem)" }}>💀</span>
          <p style={{ color: "#fff", fontSize: "clamp(7px, 1.8vw, 10px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            {player.name}
          </p>
        </div>
      ) : (
        <>
          <p style={{
            color: isActive ? player.textColor : "rgba(255,255,255,0.18)",
            fontSize: "clamp(7px, 2vw, 11px)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "0.25rem",
            transition: "color 0.3s",
          }}>
            {player.name}
          </p>

          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "clamp(1.2rem, 6vw, 3.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: timerColor,
            transition: "color 0.3s",
          }}>
            {formatTime(player.timeLeft)}
          </p>

          {isActive && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: player.accentColor }} />
              <span style={{ color: player.accentColor, fontSize: "clamp(6px, 1.6vw, 9px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Tering
              </span>
            </div>
          )}

          {isActive && (
            <p className="absolute bottom-2 text-center" style={{
              color: "rgba(255,255,255,0.1)",
              fontSize: "clamp(5px, 1.3vw, 8px)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}>
              Bosing → navbat o'tadi
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tezlash() {
  const [phase, setPhase] = useState<"setup" | "game" | "finished">("setup");
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [playerNames, setPlayerNames] = useState(["Alibek", "Zulfiya", "Jasur"]);
  const [newName, setNewName] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  // clockwiseOrder: array of player ids in clockwise perimeter order
  const [clockwiseOrder, setClockwiseOrder] = useState<number[]>([]);
  // turnIdx: index into clockwiseOrder
  const [turnIdx, setTurnIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnIdxRef = useRef(0);
  const clockwiseOrderRef = useRef<number[]>([]);
  const playersRef = useRef<Player[]>([]);

  // Keep refs in sync
  useEffect(() => { turnIdxRef.current = turnIdx; }, [turnIdx]);
  useEffect(() => { clockwiseOrderRef.current = clockwiseOrder; }, [clockwiseOrder]);
  useEffect(() => { playersRef.current = players; }, [players]);

  const activeId = clockwiseOrder[turnIdx] ?? -1;

  // Advance turn clockwise, skipping eliminated
  const getNextTurnIdx = (currentIdx: number, order: number[], playerList: Player[]): number => {
    let next = (currentIdx + 1) % order.length;
    for (let i = 0; i < order.length; i++) {
      if (!playerList.find((p) => p.id === order[next])?.isEliminated) return next;
      next = (next + 1) % order.length;
    }
    return -1;
  };

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current!);
    if (phase !== "game" || isPaused) return;

    intervalRef.current = setInterval(() => {
      const order = clockwiseOrderRef.current;
      const tIdx = turnIdxRef.current;
      const currentActiveId = order[tIdx];

      setPlayers((prev) => {
        const next = prev.map((p) =>
          p.id === currentActiveId && !p.isEliminated
            ? { ...p, timeLeft: p.timeLeft - 1 }
            : p
        );
        const active = next.find((p) => p.id === currentActiveId);
        if (active && active.timeLeft <= 0) {
          const eliminated = next.map((p) =>
            p.id === currentActiveId ? { ...p, isEliminated: true, timeLeft: 0 } : p
          );
          const remaining = eliminated.filter((p) => !p.isEliminated);
          if (remaining.length <= 1) {
            setPhase("finished");
            clearInterval(intervalRef.current!);
            return eliminated;
          }
          const nextIdx = getNextTurnIdx(tIdx, order, eliminated);
          setTurnIdx(nextIdx);
          return eliminated;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [phase, isPaused]);

  // ── Tap to pass turn ────────────────────────────────────────────────────────
  const handleCellClick = (playerId: number) => {
    if (playerId !== activeId) return;
    setPlayers((prev) => {
      const remaining = prev.filter((p) => !p.isEliminated);
      if (remaining.length <= 1) { setPhase("finished"); return prev; }
      const nextIdx = getNextTurnIdx(turnIdxRef.current, clockwiseOrderRef.current, prev);
      setTurnIdx(nextIdx);
      return prev;
    });
  };

  // ── Start ───────────────────────────────────────────────────────────────────
  const handleStartGame = () => {
    const totalSec = minutes * 60 + seconds;
    const built: Player[] = playerNames.map((name, i) => ({
      id: i, name,
      ...PALETTES[i % PALETTES.length],
      timeLeft: totalSec,
      isEliminated: false,
    }));
    const layout = buildLayout(playerNames.length);
    // Clockwise order = indices 0..n-1 since playerPositions is already clockwise
    const order = layout.playerPositions.map((_, i) => i);
    setPlayers(built);
    setClockwiseOrder(order);
    setTurnIdx(0);
    setIsPaused(false);
    setPhase("game");
  };

  const handleRestart = () => {
    clearInterval(intervalRef.current!);
    setPhase("setup");
    setPlayers([]);
    setClockwiseOrder([]);
    setTurnIdx(0);
  };

  const addPlayer = () => {
    const t = newName.trim();
    if (!t) return;
    setPlayerNames((p) => [...p, t]);
    setNewName("");
  };

  const removePlayer = (i: number) => {
    if (playerNames.length <= 2) return;
    setPlayerNames((p) => p.filter((_, idx) => idx !== i));
  };

  const eliminatedPlayers = players.filter((p) => p.isEliminated);
  const activePlayers = players.filter((p) => !p.isEliminated);
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;
  const layout = players.length > 0 ? buildLayout(players.length) : null;

  // ── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex justify-center" style={{ background: "#f9fafb" }}>
        <div className="w-full max-w-sm px-5 py-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl"
              style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              ⏱️
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-1" style={{ color: "#9ca3af" }}>
              O'yin
            </p>
            <h1 className="text-3xl font-black leading-tight text-black">
              Vaqtni <span style={{ color: "#d4af37" }}>boshqar</span>
            </h1>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "#9ca3af" }}>
              Har bir o'yinchi o'z vaqtiga ega.
              <br />Soat yo'nalishi bo'yicha navbat o'tadi.
            </p>
          </div>

          {/* Timer config */}
          <div className="rounded-2xl p-4 mb-4"
            style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: "#9ca3af" }}>
              Vaqt sozlamalari
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>Daqiqa</label>
                <input type="number" min={0} max={99} value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full py-2.5 px-3 rounded-xl text-black font-black text-lg text-center focus:outline-none"
                  style={{ border: "1px solid #e5e7eb" }} />
              </div>
              <span className="text-2xl font-black mt-5" style={{ color: "#d1d5db" }}>:</span>
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>Soniya</label>
                <input type="number" min={0} max={59} value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full py-2.5 px-3 rounded-xl text-black font-black text-lg text-center focus:outline-none"
                  style={{ border: "1px solid #e5e7eb" }} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ l: "1 min", m: 1, s: 0 }, { l: "3 min", m: 3, s: 0 }, { l: "5 min", m: 5, s: 0 }, { l: "10 min", m: 10, s: 0 }].map((p) => {
                const a = minutes === p.m && seconds === p.s;
                return (
                  <button key={p.l} onClick={() => { setMinutes(p.m); setSeconds(p.s); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ border: a ? "1px solid #d4af37" : "1px solid #e5e7eb", color: a ? "#d4af37" : "#6b7280", background: a ? "#fefce8" : "#fff" }}>
                    {p.l}
                  </button>
                );
              })}
            </div>
          </div>

          <GoldDivider />

          {/* Players */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "#9ca3af" }}>
                O'yinchilar · {playerNames.length}
              </p>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                  style={{ background: "#fff", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PALETTES[i % PALETTES.length].accentColor }} />
                  <span className="text-xs font-mono w-4 flex-shrink-0" style={{ color: "#9ca3af" }}>{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{name}</span>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: PALETTES[i % PALETTES.length].color, color: PALETTES[i % PALETTES.length].textColor }}>
                    {PALETTES[i % PALETTES.length].label}
                  </span>
                  {playerNames.length > 2 && (
                    <button onClick={() => removePlayer(i)}
                      className="text-lg leading-none ml-1" style={{ color: "#d1d5db" }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Ism kiriting..."
                className="flex-1 py-2.5 px-3 rounded-xl text-sm text-black placeholder-gray-300 focus:outline-none"
                style={{ border: "1px solid #e5e7eb" }} />
              <button onClick={addPlayer} disabled={!newName.trim()}
                className="px-4 py-2.5 rounded-xl text-black text-sm font-bold active:scale-95 transition-all disabled:opacity-30"
                style={{ backgroundColor: "#d4af37" }}>
                + Qo'sh
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="min-h-[90px] w-full rounded-2xl mb-5 flex items-center justify-center"
            style={{ border: "1.5px dashed #d4af3750", background: "linear-gradient(135deg, #fefce8, #fffbeb)" }}>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#d4af37" }}>
                Soat yo'nalishi ↻
              </p>
              <div className="flex gap-1.5 justify-center flex-wrap max-w-[200px] mx-auto">
                {playerNames.map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg opacity-70"
                    style={{ background: PALETTES[i % PALETTES.length].color, border: `1px solid ${PALETTES[i % PALETTES.length].accentColor}` }} />
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleStartGame}
            disabled={playerNames.length < 2 || (minutes === 0 && seconds === 0)}
            className="w-full py-4 rounded-2xl text-black font-black text-lg tracking-wide active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#d4af37" }}>
            O'yinni boshlash ⏱️
          </button>
          {minutes === 0 && seconds === 0 && (
            <p className="text-xs text-center mt-2" style={{ color: "#9ca3af" }}>Kamida 1 soniya kerak</p>
          )}
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #1a1200 0%, #000 100%)" }}>
        <div className="w-full max-w-xs px-8 py-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}>
            🏆
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "#d4af37" }}>O'yin tugadi</p>
          <h2 className="text-white text-3xl font-black leading-tight mb-6">
            {winner
              ? <><span style={{ color: winner.accentColor }}>{winner.name}</span><br />g'olib!</>
              : "Hamma chiqdi!"}
          </h2>
          {eliminatedPlayers.length > 0 && (
            <div className="w-full mb-7">
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Chiqarilganlar
              </p>
              <div className="flex flex-col gap-2">
                {eliminatedPlayers.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-1.5 h-1.5 rounded-full opacity-30" style={{ background: p.accentColor }} />
                    <span className="text-sm line-through" style={{ color: "#6b7280" }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleRestart}
            className="w-full py-4 rounded-2xl text-black font-black text-base tracking-wide active:scale-95 transition-all"
            style={{ backgroundColor: "#d4af37" }}>
            Qaytadan boshlash 🔄
          </button>
        </div>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────────────
  if (!layout) return null;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#000", touchAction: "none" }}>
      <div style={{
        display: "grid",
        gridTemplateAreas: layout.areas,
        gridTemplateColumns: layout.colsStr,
        gridTemplateRows: layout.rowsStr,
        width: "100%",
        height: "100%",
      }}>
        {/* Player cells — placed clockwise around perimeter */}
        {players.map((player, i) => {
          const [row, col] = layout.playerPositions[i];
          return (
            <PlayerCell
              key={player.id}
              player={player}
              isActive={player.id === activeId && !player.isEliminated}
              onClick={() => handleCellClick(player.id)}
              row={row} col={col} cols={layout.cols} rows={layout.rows}
            />
          );
        })}

        {/* Empty interior cells */}
        {layout.interiorCells.map(({ row, col, areaName }) => {
          const borders = getCellBorder(row, col, layout.cols, layout.rows);
          return (
            <div key={areaName}
              style={{ gridArea: areaName, background: "#050505", ...borders }} />
          );
        })}
      </div>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
          Tezlash
        </p>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setIsPaused((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: isPaused ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.07)",
              color: isPaused ? "#d4af37" : "rgba(255,255,255,0.35)",
              border: isPaused ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(255,255,255,0.09)",
            }}>
            {isPaused ? "▶ Davom" : "⏸ Pauza"}
          </button>
          <button onClick={() => { setIsPaused(true); setShowExitModal(true); }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.07)" }}>
            ✕ Chiqish
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && !showExitModal && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-40"
          style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.55)" }}
          onClick={() => setIsPaused(false)}>
          <div className="px-10 py-8 rounded-3xl text-center"
            style={{ background: "rgba(18,18,18,0.92)", border: "1px solid rgba(212,175,55,0.18)", backdropFilter: "blur(20px)" }}
            onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl font-black mb-2" style={{ color: "#d4af37" }}>⏸</p>
            <p className="text-white font-black text-xl tracking-widest uppercase mb-4">To'xtatildi</p>
            <button onClick={() => setIsPaused(false)}
              className="px-6 py-3 rounded-xl text-black font-black text-sm tracking-wide active:scale-95 transition-all"
              style={{ backgroundColor: "#d4af37" }}>
              Davom etish ▶
            </button>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm mx-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="text-black text-xl font-bold mb-6 text-center">O'yinni rostan to'xtatmoqchimisiz?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowExitModal(false); setIsPaused(false); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-all duration-200"
              >
                Yo'q
              </button>
              <button
                onClick={() => { setShowExitModal(false); handleRestart(); }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-95 transition-all duration-200"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}