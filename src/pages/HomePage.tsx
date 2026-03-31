import { useState, useCallback } from "react";

// ─── Words Data ───────────────────────────────────────────────────────────────
const words = [
    "G'iybatchi",
    "Qarzdor",
    "Blogger",
    "Hakam",
    "Egizaklar",
    "Merosxo'r",
    "Baqiroq",
    "Begona",
    "Yolg'onchi",
    "Sehrgar",
    "Josus",
    "Sotuvchi",
    "Qo'riqchi",
    "Sartarosh",
    "Hofiz",
    "Stomatolog",
    "Kelin",
    "Kuyov",
    "Qaynona",
    "Xonanda",
    "Qurt",
    "Quyruq",
    "Garmdor",
    "Sarimsoq",
    "Limon",
    "Muzqaymoq",
    "Saqich",
    "Xolva",
    "Qazi",
    "Non",
    "Somsa",
    "Shashlik",
    "Ketchup",
    "Shokolad",
    "Tuxum",
    "Asal",
    "Pista",
    "Yong'oq",
    "Kola",
    "Qahva",
    "Dazmol",
    "Pult",
    "Zaryadnik",
    "Kirsovun",
    "Vantuz",
    "Supurgi",
    "Antena",
    "Konditsioner",
    "Ventilyator",
    "Batareyka",
    "Kalit",
    "Hamyon",
    "Zontik",
    "Ko'zoynak",
    "Taroq",
    "Ayna",
    "Qaychi",
    "Pichoq",
    "Choynak",
    "Piyola",
    "Paypoq",
    "Shippak",
    "Galstuk",
    "Ro'mol",
    "Kamari",
    "Taqinchoq",
    "Parik",
    "Niqob",
    "Kostyum",
    "Shortik",
    "Mayka",
    "Krossovka",
    "Zirak",
    "Sumka",
    "Kepka",
    "Uyqu",
    "Qitiq",
    "Qarz",
    "Maosh",
    "Imtihon",
    "Bayram",
    "To'y",
    "G'alaba",
    "Xato",
    "Sirlar",
    "Omad",
    "Tush",
    "Qo'rquv",
    "Xursandchilik",
    "Hovliqma",
    "Pashsha",
    "Tarakan",
    "Chayon",
    "Maymun",
    "Tovuq",
    "Eshak",
    "Sichqon",
    "Tuyaqush",
    "Tipratikan",
    "Pingvin",
    "Yomg'ir",
    "Qor",
    "Chaqmoq",
    "Tuman",
    "Daryo",
    "Bozor",
    "Lift",
    "Kasalxona",
    "Maktab",
    "Choyxona",
    "To'yxona",
    "Stadion",
    "Metro",
    "Avtobus",
    "Samolyot",
    "Gara",
    "Hojatxona",
    "Svetofor",
    "Zinapoya",
    "Pochta"
];

// ─── Types ────────────────────────────────────────────────────────────────────
type GamePhase = "setup" | "revealing" | "finished";

interface Player {
  id: number;
  name: string;
  isImposter: boolean;
  word: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-black/10" />
      <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-black/10" />
    </div>
  );
}

interface PlayerChipProps {
  name: string;
  index: number;
  onRemove: (i: number) => void;
  canRemove: boolean;
}

function PlayerChip({ name, index, onRemove, canRemove }: PlayerChipProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm animate-fadeIn"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
          {index + 1}
        </div>
        <span className="text-gray-900 text-sm font-medium tracking-wide">{name}</span>
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface AddPlayerModalProps {
  onAdd: (name: string) => void;
  onClose: () => void;
}

function AddPlayerModal({ onAdd, onClose }: AddPlayerModalProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-8 bg-white border border-gray-200 rounded-2xl p-6 animate-slideUp shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-[0.2em] mb-1">
          Yangi novvoy
        </p>
        <h3 className="text-black text-xl font-bold mb-6">Ismni kiriting</h3>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Novvoy ismi..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-black placeholder-gray-400 text-sm outline-none focus:border-black transition-colors duration-200 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-all duration-200"
          >
            Bekor
          </button>
          <button
            onClick={handleAdd}
            disabled={!value.trim()}
            className="flex-1 py-3 rounded-xl bg-gold text-black text-sm font-bold disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

interface RevealCardProps {
  player: Player;
  isRevealed: boolean;
  onReveal: () => void;
}

function RevealCard({ player, isRevealed, onReveal }: RevealCardProps) {
  return (
    <div className="w-full animate-fadeIn" style={{ perspective: "1000px" }}>
      <div
        className={`relative w-full transition-all duration-500 ${isRevealed ? "animate-scaleIn" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {!isRevealed ? (
          /* Front – hidden */
          <button
            onClick={onReveal}
            className="w-full min-h-52 rounded-2xl border border-gray-200 bg-white flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-2xl">
              🍞
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] text-center mb-1">
                Novvoy
              </p>
              <p className="text-black text-2xl font-bold text-center">{player.name}</p>
            </div>
            <div className="mt-2 px-5 py-2 rounded-full border border-gray-200 bg-gray-50">
              <p className="text-gray-500 text-xs font-medium tracking-wider">Bosing →</p>
            </div>
          </button>
        ) : (
          /* Back – revealed */
          <div
            className={`w-full min-h-52 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 shadow-md relative overflow-hidden ${
              player.isImposter
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                player.isImposter ? "text-red-500" : "text-gray-400"
              }`}
            >
              {player.name}
            </p>

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border ${
                player.isImposter ? "border-red-200 bg-red-100" : "border-gray-200 bg-gray-50"
              }`}
            >
              {player.isImposter ? "😈" : "🍞"}
            </div>

            <p
              className={`text-3xl font-bold text-center px-6 leading-tight ${
                player.isImposter ? "text-red-600" : "text-black"
              }`}
            >
              {player.word}
            </p>

            {player.isImposter && (
              <p className="text-red-500 text-xs text-center px-6 font-medium">
                Sen yomon novvoysiz!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [playerNames, setPlayerNames] = useState<string[]>(["novvoy 1", "novvoy 2", "novvoy 3"]);
  const [showModal, setShowModal] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleAddPlayer = useCallback((name: string) => {
    setPlayerNames((prev) => [...prev, name]);
  }, []);

  const handleRemovePlayer = useCallback((index: number) => {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStartGame = useCallback(() => {
    const imposterIndex = Math.floor(Math.random() * playerNames.length);
    const chosenWord = words[Math.floor(Math.random() * words.length)];

    const newPlayers: Player[] = playerNames.map((name, i) => ({
      id: i,
      name,
      isImposter: i === imposterIndex,
      word: i === imposterIndex ? "Yomon novvoy" : chosenWord,
    }));

    // Shuffle order for secrecy
    const shuffled = [...newPlayers].sort(() => Math.random() - 0.5);

    setPlayers(shuffled);
    setCurrentIndex(0);
    setIsRevealed(false);
    setPhase("revealing");
  }, [playerNames]);

  const handleNext = useCallback(() => {
    if (currentIndex < players.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsRevealed(false);
    } else {
      setPhase("finished");
    }
  }, [currentIndex, players.length]);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setPlayers([]);
    setCurrentIndex(0);
    setIsRevealed(false);
  }, []);

  const isLastPlayer = currentIndex === players.length - 1;

  // ── Setup Phase ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-sm px-5 py-10 animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-gray-200 text-3xl mb-5 shadow-sm">
              🍞
            </div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-[0.3em] mb-2">
              O'yin
            </p>
            <h1 className="text-black text-3xl font-black leading-tight">
              Yomon novvoyni
              <br />
              <span className="text-gold">top</span>
            </h1>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">
              Har bir novvoy o'z so'zini ko'radi.
              <br />
              Lekin biri yomon novvoy...
            </p>
          </div>

          <GoldDivider />

          {/* Players */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-[0.15em]">
                Novvoylar · {playerNames.length}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-black text-xs font-semibold hover:brightness-110 active:scale-95 transition-all duration-200"
              >
                <span className="text-base leading-none">+</span> Qo'shish
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {playerNames.map((name, i) => (
                <PlayerChip
                  key={i}
                  name={name}
                  index={i}
                  onRemove={handleRemovePlayer}
                  canRemove={playerNames.length > 3}
                />
              ))}
            </div>
          </div>

          <GoldDivider />

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={playerNames.length < 3}
            className="w-full py-4 rounded-2xl bg-gold text-black font-black text-lg tracking-wide shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Non yopishni boshlash 🔥
          </button>

          {playerNames.length < 3 && (
            <p className="text-gray-400 text-xs text-center mt-3">
              Kamida 3 novvoy kerak
            </p>
          )}
        </div>

        {showModal && (
          <AddPlayerModal onAdd={handleAddPlayer} onClose={() => setShowModal(false)} />
        )}
      </div>
    );
  }

  // ── Revealing Phase ──────────────────────────────────────────────────────
  if (phase === "revealing") {
    const current = players[currentIndex];
    const progress = ((currentIndex) / players.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-sm px-5 py-10 flex flex-col animate-fadeIn">
          {/* Progress header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium">
                {currentIndex + 1} / {players.length}
              </p>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                Karta ochish
              </p>
            </div>
            <div className="w-full h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Instruction */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              <span className="text-black font-semibold">{current.name}</span>, kartangizni oching.
              <br />
              <span className="text-gray-400 text-xs">Boshqalar ko'rmasin!</span>
            </p>
          </div>

          {/* Card */}
          <div className="flex-1 flex items-center">
            <RevealCard
              player={current}
              isRevealed={isRevealed}
              onReveal={() => setIsRevealed(true)}
            />
          </div>

          {/* Next Button */}
          {isRevealed && (
            <div className="mt-8 animate-slideUp">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gold text-black font-black text-base tracking-wide shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200"
              >
                {isLastPlayer ? "Hammasi tayyor! ✅" : "Keyingi novvoy →"}
              </button>
              {!isLastPlayer && (
                <p className="text-gray-400 text-xs text-center mt-3">
                  Navbatni {players[currentIndex + 1]?.name}ga bering
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Finished Phase ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm px-5 py-14 flex flex-col items-center justify-center animate-fadeIn">
        {/* Emoji burst */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-white border border-gray-200 flex items-center justify-center text-5xl shadow-sm">
            🔥
          </div>
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🍞</div>
        </div>

        <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.3em] mb-3 text-center">
          Munozara vaqti
        </p>

        <h2 className="text-black text-3xl font-black text-center leading-tight mb-4">
          Nonni kim
          <br />
          <span className="text-black">kuydurgan</span>
          <br />
          ekan?
        </h2>

        <p className="text-gray-500 text-sm text-center leading-relaxed mb-2 max-w-xs">
          Endi ovoz bering — kim yomon novvoy? Muhokama qiling va taxmin qiling!
        </p>

        <GoldDivider />

        {/* Players reminder */}
        <div className="w-full mb-8">
          <p className="text-gray-400 text-xs text-center uppercase tracking-widest mb-4">
            O'yinchilar
          </p>
          <div className="grid grid-cols-3 gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center py-3 px-2 rounded-xl bg-white border border-gray-200 shadow-sm"
              >
                <div className="text-lg mb-1">🧑‍🍳</div>
                <p className="text-gray-700 text-xs text-center font-medium leading-tight">
                  {p.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="w-full py-4 rounded-2xl bg-gold text-black font-black text-base tracking-wide shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          Yana non yopish 🍞
        </button>
      </div>
    </div>
  );
}
