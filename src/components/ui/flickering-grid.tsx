"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/* Miltillovchi kataklar foni — canvas'da mayda kvadratlar, har biri
   tasodifiy vaqtda shaffofligini almashtiradi.

   Loyihaga moslash:
   · `color` CSS oʻzgaruvchisi ham boʻlishi mumkin (`var(--muted-foreground)`)
     — canvas `var()` ni tushunmaydi, shuning uchun hisoblangan qiymat
     olinadi. Dark mode uchun alohida kod kerak emas: token oʻzi almashadi.
   · `prefers-reduced-motion` yoqilgan boʻlsa bir marta chiziladi, animatsiya
     yoʻq.
   · Ekrandan tashqarida (IntersectionObserver) animatsiya toʻxtaydi. */

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
}

function resolveColor(color: string): string {
  const match = color.match(/^var\((--[^)]+)\)$/);
  if (!match) return color;
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || "rgb(0, 0, 0)";
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [themeKey, setThemeKey] = useState(0);

  // Mavzu (light/dark) almashganda rangni qayta hisoblash uchun
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey((k) => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const memoizedColor = useMemo(() => {
    if (typeof window === "undefined") return "rgba(0, 0, 0,";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "rgba(0, 0, 0,";
    ctx.fillStyle = resolveColor(color);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgba(${r}, ${g}, ${b},`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, themeKey]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));

      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.fillStyle = `${memoizedColor}${squares[i * rows + j]})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    },
    [memoizedColor, squareSize, gridGap],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!canvas || !container || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrameId: number | null = null;
    let gridParams: ReturnType<typeof setupCanvas> | null = null;

    const drawOnce = () => {
      if (!gridParams) return;
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
    };

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
      drawOnce();
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView || !gridParams) return;
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(gridParams.squares, deltaTime);
      drawOnce();
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0,
    });
    intersectionObserver.observe(canvas);

    if (isInView && !reduceMotion) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div ref={containerRef} className={cn("size-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
};
