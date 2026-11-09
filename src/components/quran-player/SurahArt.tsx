import React from "react";
import { RICH_GRADIENTS } from "@/data/quran-player-data";

export function SurahArt({ number, name, gradient, size = "normal" }: { number: number; name: string; gradient?: string; size?: string; }) {
  const richGrad = RICH_GRADIENTS[(number - 1) % RICH_GRADIENTS.length];
  const bgStyle = gradient && gradient.includes('linear-gradient') ? gradient : richGrad;

  // Thumbnails are too small for the name (it gets clipped): show the surah number instead
  if (size === "small") {
    return (
      <div className="sp-surah-art-placeholder is-small" style={{ background: bgStyle }} title={`Surah ${number}: ${name}`}>
        <span className="sp-art-small-num">{number}</span>
      </div>
    );
  }

  return (
    <div className={`sp-surah-art-placeholder`} style={{ background: bgStyle }}>
      <span className="sp-art-number">{number}</span>
      <span className="sp-art-name" style={{ fontSize: "1.05rem" }}>{name}</span>
    </div>
  );
}
