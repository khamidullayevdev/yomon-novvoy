import { useState, useEffect, useCallback, useRef } from "react";
import winnerPhoto from '../assets/winners.webp'
import mafiaSigma from '../assets/mafia-sigma.jpg'
import human1 from '../assets/human1.webp'
import human2 from '../assets/human2.webp'
import human3 from '../assets/human3.webp'
import human4 from '../assets/human4.webp'
import human5 from '../assets/human5.webp'
import human6 from '../assets/human6.webp'
import human7 from '../assets/human7.webp'
import human8 from '../assets/human8.webp'
import human9 from '../assets/human9.webp'
import human10 from '../assets/human10.webp'
import human11 from '../assets/human11.webp'
import mafia1 from '../assets/mafia1.webp'
import mafia2 from '../assets/mafia2.webp'
import mafia3 from '../assets/mafia3.webp'
import mafia4 from '../assets/mafia4.webp'
import doctor1 from '../assets/doctor1.webp'
import doctor2 from '../assets/doctor2.webp'
import doctor3 from '../assets/doctor3.webp'
import sherif1 from '../assets/sherif1.webp'
import sherif2 from '../assets/sherif2.webp'
import sherif3 from '../assets/sherif3.webp'
import manyak1 from '../assets/manyak1.webp'
import manyak2 from '../assets/manyak2.webp'

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = "#4d0005";
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; label: string; photos: string[] }> = {
  mafia:    { bg: "#9f6065",  text: "#fff",     border: "#4d0005",  label: "Mafiya",    photos: [mafia1, mafia2, mafia3, mafia4] },
  doctor:   { bg: "#5d80c5",  text: "#fff",     border: "#053ba8",  label: "Do'xtir",   photos: [doctor1, doctor2, doctor3] },
  sheriff:  { bg: "#bdb385",  text: "#fff",     border: "#b19a33",  label: "Sherif",    photos: [sherif1, sherif2, sherif3] },
  manyak:   { bg: "#755248",  text: "#fff",     border: "#200e00",  label: "Manyak",    photos: [manyak1, manyak2] },
  civilian: { bg: "#fff",     text: "#111",     border: "#e5e7eb",  label: "Tinch aholi", photos: [human1, human2, human3, human4, human5, human6, human7, human8, human9, human10, human11] },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface GamePlayer {
  id: number;
  name: string;
  role: string;
  alive: boolean;
  revealed: boolean;
}

interface GameSettings {
  villageName: string;
  playerCount: number;
  mafiaCount: number;
  doctorCount: number;
  sheriffCount: number;
  hasManyak: boolean;
}

interface GameState {
  step: number;
  settings: GameSettings;
  players: GamePlayer[];
  revealIndex: number;
  revealPhase: "intro" | "cards";
  gameStartAnim: boolean;
  winner: "" | "civilians" | "mafia" | "manyak";
}

const DEFAULT_SETTINGS: GameSettings = {
  villageName: "",
  playerCount: 0,
  mafiaCount: 0,
  doctorCount: 0,
  sheriffCount: 0,
  hasManyak: false,
};

const STORAGE_KEY = "mafia_game_state";

function loadState(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: Partial<GameState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Role assignment ──────────────────────────────────────────────────────────
function assignRoles(settings: GameSettings): string[] {
  const { playerCount, mafiaCount, doctorCount, sheriffCount, hasManyak } = settings;
  const roles: string[] = [];
  for (let i = 0; i < mafiaCount; i++) roles.push("mafia");
  for (let i = 0; i < doctorCount; i++) roles.push("doctor");
  for (let i = 0; i < sheriffCount; i++) roles.push("sheriff");
  if (hasManyak) roles.push("manyak");
  const civilians = playerCount - roles.length;
  for (let i = 0; i < civilians; i++) roles.push("civilian");
  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

// ─── Reusable UI Components ───────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
  fullWidth = true,
  outline = false,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  outline?: boolean;
}) {
  if (outline) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${fullWidth ? "w-full" : ""} py-3.5 rounded-2xl border-2 font-bold text-sm tracking-wide active:scale-95 transition-all duration-200 disabled:opacity-30`}
        style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: "transparent" }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? "w-full" : ""} py-3.5 rounded-2xl font-bold text-sm text-white tracking-wide active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed`}
      style={{ backgroundColor: disabled ? "#ccc" : PRIMARY }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-full h-px bg-gray-100 my-6" />;
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-6 bg-white rounded-2xl p-6 shadow-2xl animate-slideUp border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={open ? { borderColor: PRIMARY } : {}}
      >
        <span>{value > 0 ? value : "Tanlang"}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute max-h-[200px] overflow-y-auto z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-scaleIn origin-top">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              style={value === opt ? { color: PRIMARY, fontWeight: 700 } : {}}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1 — Village Name ────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="bg-gray-50 flex justify-center w-full">
      <div className="w-full flex flex-col justify-center animate-fadeIn">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="w-full flex justify-center">
              <div className="w-[250px] mb-6">
                <img className="w-full h-auto object-cover object-bottom-left" src={mafiaSigma} alt="" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">
              Mafia
            </h1>
            <p className="text-gray-600 text-sm">Birinchi qishloqchamizga nom beraylik jigarim.</p>
          </div>
        </FadeIn>

        <FadeIn delay={120}>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Qishloq nomi
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext(name.trim())}
              placeholder="Masalan: P**n hub qishloqchasi"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-300 text-sm outline-none transition-colors duration-200 font-medium"
              style={{ ...(name ? { borderColor: PRIMARY } : {}) }}
            />
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <PrimaryButton onClick={() => onNext(name.trim())} disabled={!name.trim()}>
            Davom etish →
          </PrimaryButton>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── Step 2 — Game Setup ──────────────────────────────────────────────────────
function Step2({
  villageName,
  onStart,
}: {
  villageName: string;
  onStart: (s: Omit<GameSettings, "villageName">) => void;
}) {
  const [playerCount, setPlayerCount] = useState(0);
  const [mafiaCount, setMafiaCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [sheriffCount, setSheriffCount] = useState(0);
  const [hasManyak, setHasManyak] = useState(false);

  const maxMafia = playerCount > 0 ? Math.floor(playerCount / 3) : 0;
  const maxDoctor = playerCount > 0 ? Math.min(2, Math.floor(playerCount / 6)) || 1 : 0;
  const maxSheriff = playerCount >= 10 ? 2 : playerCount >= 4 ? 1 : 0;

  const manyakCount = hasManyak ? 1 : 0;
  const totalSpecial = mafiaCount + doctorCount + sheriffCount + manyakCount;
  const civilians = playerCount > 0 ? playerCount - totalSpecial : 0;
  const isValid = playerCount >= 4 && mafiaCount >= 1 && civilians >= 1 && totalSpecial < playerCount;

  // Reset dependents when playerCount changes
  useEffect(() => {
    setMafiaCount(0);
    setDoctorCount(0);
    setSheriffCount(0);
    setHasManyak(false);
  }, [playerCount]);

  const playerOptions = Array.from({ length: 21 }, (_, i) => i + 4);
  const mafiaOptions = Array.from({ length: maxMafia }, (_, i) => i + 1);
  const doctorOptions = Array.from({ length: maxDoctor }, (_, i) => i + 1);
  const sheriffOptions = Array.from({ length: maxSheriff }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm animate-fadeIn">
        <FadeIn>
          <div className="mb-8">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">{villageName}</p>
            <h2 className="text-2xl font-black text-gray-900">O'yinni sozlash</h2>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-5">
          <FadeIn delay={60} className="relative z-50">
            <CustomSelect
              label="O'yinchilar soni"
              value={playerCount}
              options={playerOptions}
              onChange={setPlayerCount}
            />
          </FadeIn>

          <FadeIn delay={100} className="relative z-40">
            <CustomSelect
              label="Mafiyalar soni"
              value={mafiaCount}
              options={mafiaOptions}
              onChange={setMafiaCount}
              disabled={playerCount === 0}
            />
          </FadeIn>

          <FadeIn delay={140} className="relative z-30">
            <CustomSelect
              label="Do'xtirlar soni"
              value={doctorCount}
              options={doctorOptions}
              onChange={setDoctorCount}
              disabled={playerCount === 0 || mafiaCount === 0}
            />
          </FadeIn>

          <FadeIn delay={180} className="relative z-20">
            <CustomSelect
              label="Sheriflar soni"
              value={sheriffCount}
              options={sheriffOptions}
              onChange={setSheriffCount}
              disabled={playerCount === 0 || mafiaCount === 0}
            />
          </FadeIn>

          {/* Manyak card */}
          <FadeIn delay={220} className="relative z-10">
            <div
              onClick={() => playerCount > 0 && mafiaCount > 0 && setHasManyak((h) => !h)}
              className="rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 active:scale-95"
              style={
                hasManyak
                  ? { borderColor: "#200e00", backgroundColor: "#200e00" }
                  : { borderColor: "#e5e7eb", backgroundColor: "#fff", opacity: playerCount === 0 ? 0.4 : 1 }
              }
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🪓</div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${hasManyak ? "text-white" : "text-gray-900"}`}>
                    Qassob
                  </p>
                  <p className={`text-xs mt-0.5 leading-snug ${hasManyak ? "text-white/70" : "text-gray-400"}`}>
                    Manyak ham sizlar bilan o'ynashni istaydi
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={hasManyak ? { borderColor: "#fff", backgroundColor: "#fff" } : { borderColor: "#d1d5db" }}
                >
                  {hasManyak && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#200e00" }} />}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Role summary */}
        {playerCount > 0 && (
          <FadeIn delay={260}>
            <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Rollar hisobi</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Mafiya", count: mafiaCount, color: "#4d0005" },
                  { label: "Do'xtir", count: doctorCount, color: "#053ba8" },
                  { label: "Sherif", count: sheriffCount, color: "#b19a33" },
                  { label: "Qassob", count: manyakCount, color: "#200e00" },
                  { label: "Tinch aholi", count: Math.max(0, civilians), color: "#374151" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-gray-500">{r.label}:</span>
                    <span className="text-xs font-bold text-gray-900">{r.count}</span>
                  </div>
                ))}
              </div>
              {civilians < 1 && playerCount > 0 && totalSpecial > 0 && (
                <p className="text-xs mt-3 font-medium" style={{ color: PRIMARY }}>
                  ⚠️ Kamida 1 tinch aholi kerak
                </p>
              )}
            </div>
          </FadeIn>
        )}

        <FadeIn delay={300}>
          <div className="mt-6">
            <PrimaryButton
              onClick={() => onStart({ playerCount, mafiaCount, doctorCount, sheriffCount, hasManyak })}
              disabled={!isValid}
            >
              O'yinni boshlash →
            </PrimaryButton>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── Step 3 — Role Reveal ─────────────────────────────────────────────────────
function Step3({
  players,
  revealIndex,
  revealPhase,
  onRevealCard,
  onNextPlayer,
  onDone,
}: {
  players: GamePlayer[];
  revealIndex: number;
  revealPhase: "intro" | "cards";
  onRevealCard: () => void;
  onNextPlayer: () => void;
  onDone: () => void;
}) {
  const [cardOpen, setCardOpen] = useState(false);

  // Reset card open state when revealIndex changes
  useEffect(() => { setCardOpen(false); }, [revealIndex]);

  if (revealPhase === "intro") {
    return (
      <>
        <div className="fixed w-screen h-screen top-0 left-0 bg-gray-900"></div>

        <div className="min-h-screen flex items-center fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10] justify-center animate-fadeIn">
          <div className="text-center px-8">
            <div className="text-6xl mb-6 animate-pulse">🌙</div>
            <h2 className="text-white text-3xl font-black mb-3">O'yin boshlandi</h2>
            <p className="text-white/40 text-sm">Har bir o'yinchi rolingizni ko'ring</p>
          </div>
        </div>
      </>
    );
  }

  const current = players[revealIndex];
  const role = ROLE_COLORS[current.role];
  const isLast = revealIndex === players.length - 1;

  // Derive stable photo based on player ID to avoid layout shift when rerendering
  const photoIndex = current.id % role.photos.length;
  const photoSrc = role.photos[photoIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-screen bg-gray-50 w-full max-w-sm px-5 py-10 flex flex-col animate-fadeIn">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">{revealIndex + 1} / {players.length}</span>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rol ochish</span>
          </div>
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((revealIndex) / players.length) * 100}%`, backgroundColor: PRIMARY }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">
            <span className="text-gray-900 font-bold">{revealIndex + 1}-o'yinchi</span>,
            iltimos rolingizni ko'rib oling
          </p>
          <p className="text-gray-300 text-xs mt-1">Boshqalar ko'rmasin!</p>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center">
          {!cardOpen ? (
            <button
              onClick={() => { setCardOpen(true); onRevealCard(); }}
              className="w-full min-h-56 rounded-2xl border-2 border-gray-200 bg-white flex flex-col items-center justify-center gap-4 shadow-sm active:scale-95 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl">🃏</div>
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">O'yinchi</p>
                <p className="text-gray-900 text-2xl font-black">{revealIndex + 1}</p>
              </div>
              <div className="px-5 py-2 rounded-full bg-gray-50 border border-gray-100">
                <p className="text-gray-400 text-xs font-medium">Bosing →</p>
              </div>
            </button>
          ) : (
            <div
              className="w-full rounded-2xl border-2 flex flex-col items-center justify-center gap-3 pb-[15px] shadow-md animate-scaleIn overflow-hidden"
              style={{ borderColor: role.border, backgroundColor: role.bg }}
            >
              <div className="w-full">
                <img src={photoSrc} alt={role.label} className="w-full h-auto object-cover" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: role.text, opacity: 0.7 }}>
                  Sening roling
                </p>
                <p className="text-3xl font-black" style={{ color: role.text }}>
                  {role.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Next button */}
        {cardOpen && (
          <div className="mt-8 animate-slideUp">
            <PrimaryButton onClick={isLast ? onDone : onNextPlayer}>
              {isLast ? "O'yinni boshlash ✅" : "Keyingi o'yinchiga o'tqazing →"}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4 — Gameplay ────────────────────────────────────────────────────────
function Step4({
  players,
  settings,
  gameStartAnim,
  onEliminate,
  onWin,
}: {
  players: GamePlayer[];
  settings: GameSettings;
  gameStartAnim: boolean;
  onEliminate: (id: number) => void;
  onWin: (winner: "civilians" | "mafia" | "manyak") => void;
}) {
  const [modal, setModal] = useState<number | null>(null);
  const [endGameModal, setEndGameModal] = useState(false);
  const [revealedRoles, setRevealedRoles] = useState<Record<number, boolean>>({});

  const checkWin = useCallback((updatedPlayers: GamePlayer[]) => {
    const alive = updatedPlayers.filter((p) => p.alive);
    const mafiaAlive = alive.filter((p) => p.role === "mafia").length;
    const manyakAlive = alive.filter((p) => p.role === "manyak").length;
    const civiliansAlive = alive.filter((p) => p.role === "civilian" || p.role === "doctor" || p.role === "sheriff").length;

    if (mafiaAlive === 0 && manyakAlive === 0) { onWin("civilians"); return; }
    if (mafiaAlive >= civiliansAlive && manyakAlive === 0) { onWin("mafia"); return; }
    if (manyakAlive > 0 && mafiaAlive === 0 && civiliansAlive === 0) { onWin("manyak"); return; }
  }, [onWin]);

  const handleEliminate = (id: number) => {
    onEliminate(id);
    setModal(null);
    const updated = players.map((p) => p.id === id ? { ...p, alive: false } : p);
    checkWin(updated);
  };

  if (gameStartAnim) {
    return (
      <>
        <div className="bg-gray-900 fixed w-screen h-screen top-0 left-0"></div>
        <div className="fixed min-h-screen top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10] flex items-center justify-center animate-fadeIn">
          <div className="text-center px-8">
            <div className="text-6xl mb-6">🌆</div>
            <h2 className="text-white text-3xl font-black mb-3">O'yin boshlandi</h2>
            <p className="text-white/40 text-sm">Munozara boshlaning...</p>
          </div>
        </div>
      </>
    );
  }

  const aliveCount = players.filter((p) => p.alive).length;
  const mafiaAliveCount = players.filter((p) => p.role === "mafia" && p.alive).length;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{settings.villageName}</p>
              <h2 className="text-2xl font-black text-gray-900">O'yinchilar</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400">Tirik</p>
                <p className="text-xl font-black text-gray-900">{aliveCount}</p>
              </div>
              {/* Global Eye button */}
              <button
                onClick={() => {
                  const allRevealed = players.every(p => revealedRoles[p.id]);
                  const newRevealed = players.reduce((acc, p) => ({ ...acc, [p.id]: !allRevealed }), {});
                  setRevealedRoles(newRevealed);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 bg-gray-100 hover:bg-gray-200"
              >
                <span className="text-lg">{players.every(p => revealedRoles[p.id]) ? "🙈" : "👀"}</span>
              </button>
            </div>
          </div>

          {/* Mafia pulse indicator */}
          <div className="flex gap-1.5 mt-3 mb-6">
            {Array.from({ length: settings.mafiaCount }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: i < mafiaAliveCount ? PRIMARY : "#e5e7eb" }}
              />
            ))}
          </div>
        </FadeIn>

        {/* Players list */}
        <div className="flex flex-col gap-3">
          {players.map((player, idx) => {
            const role = ROLE_COLORS[player.role];
            const showRole = revealedRoles[player.id];
            return (
              <FadeIn key={player.id} delay={idx * 40}>
                <div
                  className={`relative rounded-2xl border-2 p-4 transition-all duration-300 ${
                    !player.alive ? "opacity-40" : ""
                  }`}
                  style={
                    showRole
                      ? { borderColor: role.border, backgroundColor: role.bg }
                      : { borderColor: "#e5e7eb", backgroundColor: "#fff" }
                  }
                  onClick={() => player.alive && setModal(player.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border flex-shrink-0"
                      style={
                        showRole
                          ? { 
                              borderColor: role.text + "40", 
                              backgroundColor: role.text + "20", 
                              color: player.role !== "civilian" ? "#000" : role.text 
                            }
                          : { borderColor: "#e5e7eb", backgroundColor: "#f9fafb", color: "#374151" }
                      }
                    >
                      {player.alive ? player.id + 1 : "💀"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-sm truncate"
                        style={showRole ? { color: role.text } : { color: "#111" }}
                      >
                        {player.id + 1}-o'yinchi
                      </p>
                      {showRole && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: role.text, opacity: 0.75 }}>
                          {role.label}
                        </p>
                      )}
                    </div>

                    {!player.alive && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-300 absolute rotate-12" />
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <Divider />

        {/* Win check button */}
        <FadeIn delay={400}>
          <button
            onClick={() => checkWin(players)}
            className="w-full py-3.5 rounded-2xl border-2 font-bold text-sm tracking-wide active:scale-95 transition-all duration-200 text-gray-500 border-gray-200 mb-3"
          >
            G'olibni tekshirish 🏁
          </button>
          <button
            onClick={() => setEndGameModal(true)}
            className="w-full py-3.5 rounded-2xl border-2 font-bold text-sm tracking-wide active:scale-95 transition-all duration-200 text-red-500 border-red-200 bg-red-50 hover:bg-red-100"
          >
            O'yinni tugatish 🛑
          </button>
        </FadeIn>
      </div>

      {/* Eliminate Modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">⚖️</div>
          <h3 className="text-gray-900 text-lg font-black mb-2">Darmayitni chopamizmi?</h3>
          <p className="text-gray-500 text-sm">
            <span className="font-bold text-gray-900">{modal !== null ? modal + 1 : ""}-o'yinchi</span> O'yinni tark etdimi?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModal(null)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Bekor
          </button>
          <button
            onClick={() => modal !== null && handleEliminate(modal)}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: PRIMARY }}
          >
            Afsuski 😔
          </button>
        </div>
      </Modal>

      {/* End Game Modal */}
      <Modal open={endGameModal} onClose={() => setEndGameModal(false)}>
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm">
            <img src={human4} alt="Human" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-gray-900 text-lg font-black mb-2">Haqiqatdan ham o'yinni tugatmoqchimisiz?</h3>
          <p className="text-gray-500 text-sm">
            Barcha ma'lumotlar o'chib ketadi!
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEndGameModal(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Yo'q
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 bg-red-600 hover:bg-red-700"
          >
            Tugatish
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Step 5 — Result Screen ───────────────────────────────────────────────────
function Step5({ winner, onRestart }: { winner: "civilians" | "mafia" | "manyak"; onRestart: () => void }) {
  const config = {
    civilians: {
      emoji: "🌟",
      text: "Darmayitlar g'alaba qozondi, eee gap yo' oka",
      sub: "Qishloq yana tinch!",
      color: "#1a4331",
      bg: "#f0fdf4",
    },
    mafia: {
      emoji: "🔫",
      text: "Mafialar hammani nonga chiqarib yubordi",
      sub: "Qishloq qorong'ulikka cho'mdi...",
      color: "#4d0005",
      bg: "#fff5f5",
    },
    manyak: {
      emoji: "🪓",
      text: "Qassob akam legenda",
      sub: "Yolg'iz qolib — hammani yiqitdi!",
      color: "#200e00",
      bg: "#faf5ef",
    },
  }[winner];

  return (
    <>
      <div className="fixed w-screen h-screen top-0 left-0" style={{ backgroundColor: config.bg }}></div>

      <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full min-h-screen flex justify-center z-[10]">
        <div className="w-full max-w-sm px-5 py-16 flex flex-col items-center justify-center animate-fadeIn text-center">
          <FadeIn>
            <div className="w-[200px] h-[200px] mb-[14px]">
              <img className="w-full h-full object-cover object-center" src={winnerPhoto} alt="" />
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: config.color, opacity: 0.6 }}>
              O'yin tugadi
            </p>
            <h2 className="text-2xl font-black leading-tight mb-3" style={{ color: config.color }}>
              {config.text}
            </h2>
            <p className="text-sm" style={{ color: config.color, opacity: 0.5 }}>
              {config.sub}
            </p>
          </FadeIn>

          <Divider />

          <FadeIn delay={220} className="w-full">
            <button
              onClick={onRestart}
              className="w-full py-3.5 rounded-2xl font-black text-[15px] text-white tracking-wide active:scale-95 transition-all duration-200 shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              Yangi qishloqqa ko'chib o'tish 🏘️
            </button>
          </FadeIn>
        </div>
      </div>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function MafiaGame() {
  const saved = loadState();

  const [step, setStep] = useState<number>(saved.step ?? 1);
  const [settings, setSettings] = useState<GameSettings>(saved.settings ?? DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<GamePlayer[]>(saved.players ?? []);
  const [revealIndex, setRevealIndex] = useState<number>(saved.revealIndex ?? 0);
  const [revealPhase, setRevealPhase] = useState<"intro" | "cards">(saved.revealPhase ?? "intro");
  const [gameStartAnim, setGameStartAnim] = useState<boolean>(saved.gameStartAnim ?? false);
  const [winner, setWinner] = useState<"" | "civilians" | "mafia" | "manyak">(saved.winner ?? "");

  // Persist
  useEffect(() => {
    saveState({ step, settings, players, revealIndex, revealPhase, gameStartAnim, winner });
  }, [step, settings, players, revealIndex, revealPhase, gameStartAnim, winner]);

  // ── Step 1 handler
  const handleVillageName = useCallback((name: string) => {
    setSettings((s) => ({ ...s, villageName: name }));
    setStep(2);
  }, []);

  // ── Step 2 handler
  const handleSetupStart = useCallback((setup: Omit<GameSettings, "villageName">) => {
    const finalSettings = { ...settings, ...setup };
    setSettings(finalSettings);

    // Build players
    const roles = assignRoles(finalSettings);
    const newPlayers: GamePlayer[] = Array.from({ length: finalSettings.playerCount }, (_, i) => ({
      id: i,
      name: `${i + 1}-o'yinchi`,
      role: roles[i],
      alive: true,
      revealed: false,
    }));
    setPlayers(newPlayers);
    setRevealIndex(0);
    setRevealPhase("intro");
    setStep(3);

    // Auto-transition intro → cards after 2s
    setTimeout(() => setRevealPhase("cards"), 2000);
  }, [settings]);

  // ── Step 3 handlers
  const handleRevealCard = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === revealIndex ? { ...p, revealed: true } : p))
    );
  }, [revealIndex]);

  const handleNextPlayer = useCallback(() => {
    setRevealIndex((i) => i + 1);
  }, []);

  const handleRevealDone = useCallback(() => {
    setGameStartAnim(true);
    setStep(4);
    setTimeout(() => setGameStartAnim(false), 3000);
  }, []);

  // ── Step 4 handlers
  const handleEliminate = useCallback((id: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, alive: false } : p)));
  }, []);

  const handleWin = useCallback((w: "civilians" | "mafia" | "manyak") => {
    setWinner(w);
    setStep(5);
  }, []);

  // ── Step 5 — restart
  const handleRestart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStep(1);
    setSettings(DEFAULT_SETTINGS);
    setPlayers([]);
    setRevealIndex(0);
    setRevealPhase("intro");
    setGameStartAnim(false);
    setWinner("");
  }, []);

  // ── Render
  switch (step) {
    case 1:
      return <Step1 onNext={handleVillageName} />;
    case 2:
      return <Step2 villageName={settings.villageName} onStart={handleSetupStart} />;
    case 3:
      return (
        <Step3
          players={players}
          revealIndex={revealIndex}
          revealPhase={revealPhase}
          onRevealCard={handleRevealCard}
          onNextPlayer={handleNextPlayer}
          onDone={handleRevealDone}
        />
      );
    case 4:
      return (
        <Step4
          players={players}
          settings={settings}
          gameStartAnim={gameStartAnim}
          onEliminate={handleEliminate}
          onWin={handleWin}
        />
      );
    case 5:
      return <Step5 winner={winner as "civilians" | "mafia" | "manyak"} onRestart={handleRestart} />;
    default:
      return <Step1 onNext={handleVillageName} />;
  }
}