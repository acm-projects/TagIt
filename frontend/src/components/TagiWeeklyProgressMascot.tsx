import React, { useEffect, useId, useRef, useState } from "react";

/**
 * Tagi sitting on the weekly progress bar — sitting pose from the full mascot set.
 * Envelope body bottom (SVG y=290) sits 2px above the track; wood bar omitted in SVG.
 */

const COLORS = {
  mainBody: "#FAE9D5",
  topFlap: "#FAE9D5",
  sideTriangles: "#F8D9BD",
  bottomTriangle: "#F8D9BD",
  limbs: "#F9A36E",
  eye: "#2D3436",
  blush: "#F7B6B2",
};

const getLimbPath = (x1: number, y1: number, x2: number, y2: number, bendX: number, bendY: number) =>
  `M ${x1} ${y1} Q ${bendX} ${bendY} ${x2} ${y2}`;

export type TagiWeeklyProgressMascotProps = {
  progressPercentage: number;
  /** Shown in the speech bubble; wire to your AI / copy layer later. Empty string hides the bubble. */
  message?: string;
};

const TagiWeeklyProgressMascot: React.FC<TagiWeeklyProgressMascotProps> = ({
  progressPercentage,
  message = "Hello there!",
}) => {
  const clipPathId = `tagi-weekly-env-${useId().replace(/:/g, "")}`;
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

  const idleHandWiggle = Math.sin(frame) * 5;

  /** h-2 bar (8px); envelope bottom = 2px above bar top → pin SVG box bottom at 10px. */
  const BAR_H_PX = 8;
  const GAP_ENVELOPE_TO_BAR_PX = 2;
  /** viewBox y=290 (envelope bottom) … y=360: shift art down so rect bottom aligns with SVG box bottom. */
  const ENVELOPE_BOTTOM_SHIFT = "translateY(calc(70 * 100% / 235))";
  const trimmedMessage = message.trim();
  const showBubble = trimmedMessage.length > 0;

  return (
    <div className="w-full overflow-visible">
      <div className="relative w-full overflow-visible">
        <div
          className="pointer-events-none absolute right-1 left-24 z-10 flex flex-col items-end gap-1 overflow-visible sm:right-2 sm:left-[28%]"
          style={{ bottom: `${BAR_H_PX + GAP_ENVELOPE_TO_BAR_PX}px` }}
        >
          {showBubble && (
            <div
              className="relative inline-flex min-h-0 min-w-0 w-max max-w-full translate-y-2 flex-col rounded-2xl border border-[#EFE7DC] bg-white px-3 py-1.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.06)] sm:translate-y-2.5"
              role="status"
              aria-live="polite"
            >
              <p className="min-w-0 max-w-full whitespace-pre-wrap break-words text-[11px] font-medium leading-snug text-[#1F2933] sm:text-xs">
                {trimmedMessage}
              </p>
              <span
                className="absolute -bottom-1.5 right-3 block h-2.5 w-2.5 rotate-45 border border-[#EFE7DC] border-t-0 border-l-0 bg-white sm:right-3.5"
                aria-hidden
              />
            </div>
          )}
          <div
            className="relative h-[47px] w-20 shrink-0 sm:h-[51px] sm:w-[87px]"
            style={{ transform: ENVELOPE_BOTTOM_SHIFT }}
          >
            <div
              className="absolute bottom-0 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/[0.07] blur-sm"
              aria-hidden
            />
            <svg
              viewBox="0 125 400 235"
              className="h-full w-full"
              preserveAspectRatio="xMidYMax meet"
              style={{
                display: "block",
                filter:
                  "drop-shadow(0 1px 2px rgba(15, 23, 42, 0.06)) drop-shadow(0 3px 6px rgba(15, 23, 42, 0.05))",
              }}
              aria-hidden
            >
          <defs>
            <clipPath id={clipPathId}>
              <rect x="80" y="140" width="240" height="150" rx="24" />
            </clipPath>
          </defs>

          <g>
            <path
              d={getLimbPath(85, 215, 45, 240 + idleHandWiggle, 65, 225)}
              fill="none"
              stroke={COLORS.limbs}
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d={getLimbPath(315, 215, 355, 240 + idleHandWiggle, 335, 225)}
              fill="none"
              stroke={COLORS.limbs}
              strokeWidth="16"
              strokeLinecap="round"
            />
          </g>

          <g clipPath={`url(#${clipPathId})`}>
            <rect x="80" y="140" width="240" height="150" fill={COLORS.mainBody} />
            <path d="M80 140 L200 220 L80 290 Z" fill={COLORS.sideTriangles} />
            <path d="M320 140 L200 220 L320 290 Z" fill={COLORS.sideTriangles} />
            <path d="M80 290 L200 220 L320 290 Z" fill={COLORS.bottomTriangle} />
            <path d="M 80 140 L 200 220 L 320 140 Z" fill={COLORS.topFlap} />
          </g>

          <g>
            <path
              d="M 160 290 Q 140 265 140 340"
              fill="none"
              stroke={COLORS.limbs}
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx={140} cy={340} rx="12" ry="7" fill={COLORS.limbs} />
            <path
              d="M 240 290 Q 260 265 260 340"
              fill="none"
              stroke={COLORS.limbs}
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx={260} cy={340} rx="12" ry="7" fill={COLORS.limbs} />
          </g>

          <g>
            <rect
              x="152"
              y="188"
              width="16"
              height="26"
              rx="8"
              fill={COLORS.eye}
              style={{
                transform: `scaleY(${blink ? 0.05 : 1})`,
                transformOrigin: "160px 200px",
                transition: "transform 0.1s",
              }}
            />
            <rect
              x="232"
              y="188"
              width="16"
              height="26"
              rx="8"
              fill={COLORS.eye}
              style={{
                transform: `scaleY(${blink ? 0.05 : 1})`,
                transformOrigin: "240px 200px",
                transition: "transform 0.1s",
              }}
            />
            {!blink && (
              <>
                <circle cx={156} cy={196} r="5" fill="white" opacity="0.95" />
                <circle cx={236} cy={196} r="5" fill="white" opacity="0.95" />
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
        </div>

        <div
          className="relative z-0 h-2 w-full overflow-hidden rounded-full bg-[#fde6d7]"
          role="progressbar"
          aria-valuenow={Math.round(progressPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-2 rounded-full bg-[#f9ab7b] transition-[width] duration-200 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TagiWeeklyProgressMascot;
