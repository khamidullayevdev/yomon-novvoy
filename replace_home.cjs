const fs = require('fs');
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

const replacement = `// ── Setup Phase ──────────────────────────────────────────────────────────
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
                style={{ width: \`\${progress}%\` }}
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
}`;

content = content.replace(/\/\/ ── Setup Phase ──────────────────────────────────────────────────────────[\s\S]*\}\n$/, replacement + "\n}\n");

fs.writeFileSync('src/pages/HomePage.tsx', content);
