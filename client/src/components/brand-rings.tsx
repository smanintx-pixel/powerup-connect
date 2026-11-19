import powerButton from "@/assets/power-button.png";

/** Three overlapping brand rings around the power button. Decorative. */
export function BrandRings({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 160 130" className="w-full h-auto" fill="none">
        <circle cx="58" cy="58" r="40" stroke="#FFC933" strokeWidth="12" />
        <circle cx="104" cy="52" r="32" stroke="#02AFEF" strokeWidth="10" opacity="0.9" />
        <circle cx="88" cy="88" r="28" stroke="#70C040" strokeWidth="9" opacity="0.9" />
      </svg>
      <img
        src={powerButton}
        alt=""
        className="absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
      />
    </div>
  );
}
