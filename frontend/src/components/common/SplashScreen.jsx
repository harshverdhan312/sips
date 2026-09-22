import React, { useState, useEffect } from "react";

export function SplashScreen({ minDuration = 1100, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, minDuration);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, minDuration + 300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="SIPS Loading Splash"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center px-4">
        <img
          src="/branding/sips-logo-full.png"
          alt="SIPS - Skill Intelligence Placement System"
          className="h-16 sm:h-20 w-auto max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-xs"
        />

        {/* Minimal loading bar */}
        <div className="mt-8 w-36 sm:w-44 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
