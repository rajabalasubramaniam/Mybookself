// A row of book spines on a shelf. Pure CSS, no images.
const SPINES = [
  [150, 26, "#245A41", 1], [185, 22, "#C8963E", 0], [165, 30, "#FBD9BE", 1], [200, 24, "#123524", 0],
  [140, 20, "#E9C46A", 1], [180, 32, "#3C7A59", 0], [160, 24, "#F4BE9A", 1], [205, 28, "#1B4332", 1],
  [150, 22, "#FFF1E6", 0], [190, 26, "#A87A2B", 1], [170, 30, "#2D6147", 0], [145, 22, "#EBA27A", 1],
];

export default function ShelfIllustration({ className = "" }) {
  return (
    <div className={`${className} min-w-0 overflow-hidden`} aria-hidden="true">
      <div className="flex items-end justify-center gap-[5px] px-3">
        {SPINES.map(([h, w, color, band], i) => (
          <div
            key={i}
            className="spine-in rounded-t-[3px] relative shadow-[inset_-3px_0_0_rgba(0,0,0,.12)]"
            style={{ height: h, width: w, background: color, animationDelay: `${i * 70}ms` }}
          >
            {band ? <span className="absolute left-0 right-0 top-5 h-[3px] bg-gold-300/90" /> : <span className="absolute left-0 right-0 top-5 h-[2px] bg-forest-900/30" />}
            <span className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[6px] h-[26px] rounded-sm bg-black/10" />
          </div>
        ))}
        {/* one book leaning */}
        <div className="spine-in rounded-[3px] origin-bottom-left" style={{ height: 175, width: 26, background: "#C8963E", transform: "rotate(9deg)", marginLeft: 8, animationDelay: "900ms" }} />
      </div>
      <div className="h-3 rounded-sm bg-gold-600 shadow-[0_8px_0_rgba(18,53,36,.35)]" />
    </div>
  );
}
