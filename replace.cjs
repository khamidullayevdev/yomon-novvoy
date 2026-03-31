const fs = require('fs');
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

// GoldDivider
content = content.replace(
  /function GoldDivider\(\) \{[\s\S]*?return \([\s\S]*?<\/div>\);\n\}/,
`function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-black/10" />
      <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-black/10" />
    </div>
  );
}`
);

// PlayerChip
content = content.replace(
  /function PlayerChip\(\{ name, index, onRemove, canRemove \}: PlayerChipProps\) \{[\s\S]*?return \([\s\S]*?<\/div>\);\n\}/,
`function PlayerChip({ name, index, onRemove, canRemove }: PlayerChipProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm animate-fadeIn"
      style={{ animationDelay: \`\${index * 60}ms\` }}
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
}`
);

// AddPlayerModal
content = content.replace(
  /function AddPlayerModal\(\{ onAdd, onClose \}: AddPlayerModalProps\) \{[\s\S]*?return \([\s\S]*?<\/div>\);\n\}/,
`function AddPlayerModal({ onAdd, onClose }: AddPlayerModalProps) {
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
}`
);

// RevealCard
content = content.replace(
  /function RevealCard\(\{ player, isRevealed, onReveal \}: RevealCardProps\) \{[\s\S]*?return \([\s\S]*?<\/div>\);\n\}/,
`function RevealCard({ player, isRevealed, onReveal }: RevealCardProps) {
  return (
    <div className="w-full animate-fadeIn" style={{ perspective: "1000px" }}>
      <div
        className={\`relative w-full transition-all duration-500 \${isRevealed ? "animate-scaleIn" : ""}\`}
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
            className={\`w-full min-h-52 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 shadow-md relative overflow-hidden \${
              player.isImposter
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-white"
            }\`}
          >
            <p
              className={\`text-xs font-semibold uppercase tracking-[0.2em] \${
                player.isImposter ? "text-red-500" : "text-gray-400"
              }\`}
            >
              {player.name}
            </p>

            <div
              className={\`w-16 h-16 rounded-full flex items-center justify-center text-3xl border \${
                player.isImposter ? "border-red-200 bg-red-100" : "border-gray-200 bg-gray-50"
              }\`}
            >
              {player.isImposter ? "😈" : "🍞"}
            </div>

            <p
              className={\`text-3xl font-bold text-center px-6 leading-tight \${
                player.isImposter ? "text-red-600" : "text-black"
              }\`}
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
}`
);

fs.writeFileSync('src/pages/HomePage.tsx', content);
