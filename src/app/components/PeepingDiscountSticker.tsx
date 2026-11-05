"use client";

import { useEffect, useState, type MouseEvent } from "react";

/**
 * PeepingDiscountSticker
 * 
 * Modular Next.js Client Component docked on the left edge of the screen.
 * Features a dynamic peeping CSS animation loop, hover pause, and 1-click copy.
 */
export default function PeepingDiscountSticker() {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyStatus === "idle") return;

    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const handleCopyCode = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText("SOUNDSINDIAN10");
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <aside
      className="peep-sticker-animated fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center group cursor-pointer transition-all duration-300 select-none"
      aria-label="Promotional Discount Code"
    >
      {/* Main Red Discount Banner */}
      <div className="bg-red-600 border-4 border-l-0 border-amber-400 text-white rounded-r-2xl p-4 sm:p-5 max-w-[270px] sm:max-w-[310px] shadow-2xl flex flex-col gap-2 relative border-solid">
        
        {/* Header Tag */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-amber-300 text-red-950 font-black text-[10px] sm:text-xs uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
            ⚡ Special Offer
          </span>
          <span className="text-[10px] text-amber-200 font-medium italic">Limited Time</span>
        </div>

        {/* Promo Message */}
        <p className="text-xs sm:text-sm font-bold leading-snug tracking-tight text-white drop-shadow-sm">
          Avail <span className="text-amber-300 font-black text-sm sm:text-base underline underline-offset-2">10% discount</span> on any product by using{" "}
          <span className="bg-red-900 text-amber-300 px-1.5 py-0.5 rounded font-mono font-black border border-amber-400/40">
            SOUNDSINDIAN10
          </span>{" "}
          code!!!
        </p>

        {/* Copy Button Container */}
        <div className="mt-1 flex items-center gap-2 bg-red-950/80 p-1.5 rounded-xl border border-amber-400/50">
          <div className="flex-1 text-center font-mono font-extrabold text-amber-300 text-xs sm:text-sm tracking-wider">
            SOUNDSINDIAN10
          </div>
          <button
            onClick={handleCopyCode}
            type="button"
            aria-live="polite"
            className={`font-black text-xs px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 shrink-0 active:scale-95 shadow-md ${
              copyStatus === "copied"
                ? "bg-emerald-500 text-white"
                : "bg-amber-400 hover:bg-amber-300 text-red-950"
            }`}
          >
            {copyStatus === "copied" ? (
              <>
                <span>✓</span>
                <span>COPIED!</span>
              </>
            ) : copyStatus === "error" ? (
              <>
                <span>!</span>
                <span>FAILED</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>COPY</span>
              </>
            )}
          </button>
        </div>

        {/* Hover Cue */}
        <div className="text-[9px] text-amber-100/80 text-center font-medium">
          💡 Hover to pause animation
        </div>
      </div>

      {/* Right Edge 'Peep' Tab (Visually remains on screen when folded) */}
      <div className="bg-amber-400 text-red-950 border-2 border-l-0 border-amber-500 rounded-r-xl py-6 px-1.5 flex flex-col items-center justify-center gap-2 shadow-xl hover:bg-amber-300 transition-colors">
        <span className="text-xs">🏷️</span>
        <span className="[writing-mode:vertical-lr] text-[10px] font-black tracking-widest uppercase text-red-950">
          10% OFF
        </span>
        <span className="text-[9px] text-red-900 font-bold group-hover:translate-x-0.5 transition-transform">
          ▶
        </span>
      </div>
    </aside>
  );
}