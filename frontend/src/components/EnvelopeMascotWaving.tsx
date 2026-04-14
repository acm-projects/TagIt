import React, { useEffect, useRef, useState } from "react";

/**
 * Animated envelope mascot — waving state only (Gemini-generated design).
 * Palette: #FAE9D5, #F8D9BD, limbs #F9A36E
 */

const COLORS = {
  topFlap: "#FAE9D5",
  sideTriangles: "#F8D9BD",
  bottomTriangle: "#F8D9BD",
  limbs: "#F9A36E",
  eye: "#2D3436",
  blush: "#F7B6B2",
};

const getLimbPath = (x1: number, y1: number, x2: number, y2: number, bendX: number, bendY: number) =>
  `M ${x1} ${y1} Q ${bendX} ${bendY} ${x2} ${y2}`;

const EnvelopeMascotWaving: React.FC = () => {
  const [blink, setBlink] = useState(false);
  const [frame, setFrame] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (time: number) => {
      setFrame(time * 0.005);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const blinkInterval = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 150);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  const wavingCyclePos = frame % 25;
  const waveWeight = Math.max(
    0,
    Math.min(1, wavingCyclePos < 2 ? wavingCyclePos / 2 : (15 - wavingCyclePos) / 2),
  );

  const bodyWiggle = Math.sin(frame) * 4;
  const idleHandWiggle = Math.sin(frame) * 5;

  const currentWaveHandX =
    355 + (350 - 355) * waveWeight + Math.sin(frame * 2.5) * 12 * waveWeight;
  const currentWaveHandY =
    (240 + idleHandWiggle) + (175 - (240 + idleHandWiggle)) * waveWeight;
  const currentWaveCPY = 225 + (200 - 225) * waveWeight;

  return (
    <div className="relative flex h-80 w-80 shrink-0 items-center justify-center rounded-2xl bg-transparent">
      <div
        className="absolute bottom-6 h-3 w-36 rounded-full bg-black/[0.08] blur-lg transition-all duration-100"
        style={{
          transform: `scale(${1 + Math.sin(frame) * 0.05})`,
        }}
      />

      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        style={{
          transform: `translate(0px, ${bodyWiggle}px)`,
          transition: "transform 0.1s linear",
          filter:
            "drop-shadow(0 4px 6px rgba(15, 23, 42, 0.06)) drop-shadow(0 10px 20px rgba(15, 23, 42, 0.08)) drop-shadow(0 22px 44px rgba(15, 23, 42, 0.06))",
        }}
        aria-hidden
      >
        <defs>
          <clipPath id="envelopeShapeWaving">
            <rect x="80" y="140" width="240" height="150" rx="24" />
          </clipPath>
        </defs>

        <path
          d={getLimbPath(150, 280, 150, 330, 150, 305)}
          fill="none"
          stroke={COLORS.limbs}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <ellipse cx={150} cy={330} rx="12" ry="7" fill={COLORS.limbs} />

        <path
          d={getLimbPath(250, 280, 250, 330, 250, 305)}
          fill="none"
          stroke={COLORS.limbs}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <ellipse cx={250} cy={330} rx="12" ry="7" fill={COLORS.limbs} />

        <g>
          <path
            d={getLimbPath(85, 215, 45, 240 + idleHandWiggle, 65, 225)}
            fill="none"
            stroke={COLORS.limbs}
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d={getLimbPath(315, 215, currentWaveHandX, currentWaveHandY, 335, currentWaveCPY)}
            fill="none"
            stroke={COLORS.limbs}
            strokeWidth="16"
            strokeLinecap="round"
          />
        </g>

        <g clipPath="url(#envelopeShapeWaving)">
          <path d="M80 140 L200 220 L80 290 Z" fill={COLORS.sideTriangles} />
          <path d="M320 140 L200 220 L320 290 Z" fill={COLORS.sideTriangles} />
          <path d="M80 290 L200 220 L320 290 Z" fill={COLORS.bottomTriangle} />
          <path d="M 80 140 L 200 220 L 320 140 Z" fill={COLORS.topFlap} />
        </g>

        <g>
          <ellipse
            cx="160"
            cy="200"
            rx="8"
            ry={blink ? 1 : 12}
            fill={COLORS.eye}
            style={{ transition: "ry 0.1s" }}
          />
          <ellipse
            cx="240"
            cy="200"
            rx="8"
            ry={blink ? 1 : 12}
            fill={COLORS.eye}
            style={{ transition: "ry 0.1s" }}
          />
          {!blink && (
            <>
              <circle cx="163" cy="193" r="3.5" fill="white" opacity="0.9" />
              <circle cx="243" cy="193" r="3.5" fill="white" opacity="0.9" />
            </>
          )}
        </g>

        <path
          d="M180 230 Q200 250 220 230"
          stroke={COLORS.eye}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        <ellipse cx="135" cy="230" rx="14" ry="7" fill={COLORS.blush} opacity="0.35" />
        <ellipse cx="265" cy="230" rx="14" ry="7" fill={COLORS.blush} opacity="0.35" />
      </svg>
    </div>
  );
};

export default EnvelopeMascotWaving;
