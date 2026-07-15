"use client";

/* Fikr-mulohaza turʼi — ovoz berish tugmasini bosish va sanoq oshishini
   koʻrsatuvchi mini illyustratsiya (CSS animatsiya, tokenlangan). */

export function FeedbackUpvoteMock() {
  return (
    <div className="relative flex w-full max-w-xs flex-col items-center gap-3 text-xs">
      <style>{`
        @keyframes fb-upvote-press {
          0%, 10%   { transform: scale(1); }
          20%       { transform: scale(0.92); }
          30%, 85%  { transform: scale(1); }
          100%      { transform: scale(1); }
        }
        @keyframes fb-upvote-fill {
          0%, 18%   { background-color: transparent; border-color: var(--border); color: var(--muted-foreground); }
          28%, 85%  { background-color: var(--primary); border-color: var(--primary); color: var(--primary-foreground); }
          95%, 100% { background-color: transparent; border-color: var(--border); color: var(--muted-foreground); }
        }
        @keyframes fb-upvote-count {
          0%, 24%   { opacity: 0; transform: translateY(3px); }
          32%, 85%  { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(3px); }
        }
      `}</style>

      <div className="w-full rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm">
        <div className="h-1.5 w-3/4 rounded-full bg-muted" />
        <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-muted" />
      </div>

      <button
        type="button"
        tabIndex={-1}
        className="pointer-events-none flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold tabular-nums"
        style={{ animation: "fb-upvote-press 3s ease-in-out infinite, fb-upvote-fill 3s ease-in-out infinite" }}
      >
        <svg viewBox="0 0 12 12" className="size-3" fill="none">
          <path d="M6 2.5 9.5 8H2.5L6 2.5Z" fill="currentColor" />
        </svg>
        <span className="relative">
          12
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "fb-upvote-count 3s ease-in-out infinite" }}
          >
            13
          </span>
        </span>
      </button>
    </div>
  );
}
