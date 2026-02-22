"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Pos = { x: number; y: number };

function rnd(max: number) {
  return Math.floor(Math.random() * max);
}

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Pos[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 15, y: 10 } as Pos,
    score: 0,
    alive: true,
    started: false,
  });
  const [score, setScore] = useState(0);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const randomFood = useCallback((snake: Pos[]): Pos => {
    let f: Pos;
    do {
      f = { x: rnd(COLS), y: rnd(ROWS) };
    } while (snake.some((s) => s.x === f.x && s.y === f.y));
    return f;
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 10 }];
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(s.snake);
    s.score = 0;
    s.alive = true;
    s.started = true;
    setScore(0);
    setAlive(true);
    setStarted(true);
  }, [randomFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    // BG
    ctx.fillStyle = "#070d1a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }

    // Snake
    s.snake.forEach((seg, i) => {
      const g = ctx.createRadialGradient(
        seg.x * CELL + CELL / 2,
        seg.y * CELL + CELL / 2,
        0,
        seg.x * CELL + CELL / 2,
        seg.y * CELL + CELL / 2,
        CELL / 2
      );
      if (i === 0) {
        g.addColorStop(0, "#4ade80");
        g.addColorStop(1, "#16a34a");
      } else {
        const t = i / s.snake.length;
        g.addColorStop(0, `hsl(${140 - t * 30},70%,${55 - t * 15}%)`);
        g.addColorStop(1, `hsl(${140 - t * 30},70%,${35 - t * 10}%)`);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, 6);
      ctx.fill();
    });

    // Food
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    const gf = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL / 2);
    gf.addColorStop(0, "#f87171");
    gf.addColorStop(1, "#dc2626");
    ctx.fillStyle = gf;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    // shine
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(fx - 3, fy - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Game Over overlay
    if (!s.alive && s.started) {
      ctx.fillStyle = "rgba(7,13,26,0.82)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 32px Consolas, monospace";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 20);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 16px Consolas, monospace";
      ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 14);
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 13px Consolas, monospace";
      ctx.fillText("Press SPACE or click Restart", W / 2, H / 2 + 44);
    }

    // Start screen
    if (!s.started) {
      ctx.fillStyle = "rgba(7,13,26,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 26px Consolas, monospace";
      ctx.fillText("SNAKE", W / 2, H / 2 - 16);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 13px Consolas, monospace";
      ctx.fillText("Press SPACE or click Start", W / 2, H / 2 + 18);
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.alive || !s.started) return;

    s.dir = s.nextDir;
    const head = s.snake[0];
    let nx = head.x;
    let ny = head.y;
    if (s.dir === "UP") ny--;
    if (s.dir === "DOWN") ny++;
    if (s.dir === "LEFT") nx--;
    if (s.dir === "RIGHT") nx++;

    // Wall collision
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      s.alive = false;
      setAlive(false);
      draw();
      return;
    }
    // Self collision
    if (s.snake.some((seg) => seg.x === nx && seg.y === ny)) {
      s.alive = false;
      setAlive(false);
      draw();
      return;
    }

    const ate = nx === s.food.x && ny === s.food.y;
    s.snake = [{ x: nx, y: ny }, ...s.snake];
    if (!ate) s.snake.pop();
    else {
      s.score += 10;
      setScore(s.score);
      s.food = randomFood(s.snake);
    }

    draw();
  }, [draw, randomFood]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const speed = Math.max(80, 160 - Math.floor(score / 50) * 10);
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(tick, speed);
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [tick, score]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        if (!s.started || !s.alive) reset();
        return;
      }
      const map: Record<string, Dir> = {
        ArrowUp: "UP",
        KeyW: "UP",
        ArrowDown: "DOWN",
        KeyS: "DOWN",
        ArrowLeft: "LEFT",
        KeyA: "LEFT",
        ArrowRight: "RIGHT",
        KeyD: "RIGHT",
      };
      const d = map[e.code];
      if (!d) return;
      const opp: Record<Dir, Dir> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (opp[d] !== s.dir) s.nextDir = d;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  return (
    <main className="min-h-screen bg-[#0B1121] text-white">
      <Navbar />
      <div className="flex flex-col items-center pt-28 pb-16 px-4 gap-6">
        {/* Title Bar */}
        <div className="flex items-center gap-4 w-full max-w-[560px]">
          <Link
            href="/games"
            className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
          >
            ← Games
          </Link>
          <h1 className="text-2xl font-black text-white">🐍 Snake</h1>
          <span className="ml-auto bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-black uppercase px-3 py-0.5 rounded-full">
            Solo
          </span>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-6 w-full max-w-[560px]">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Score</span>
            <span className="text-3xl font-black text-green-400">{score}</span>
          </div>
          <button
            onClick={reset}
            className="ml-auto px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all active:scale-95"
          >
            Restart
          </button>
        </div>

        {/* Canvas */}
        <div className="rounded-2xl overflow-hidden border border-green-500/20 shadow-2xl shadow-green-900/20">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="block"
            onClick={() => {
              const s = stateRef.current;
              if (!s.started || !s.alive) reset();
            }}
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Controls */}
        <div className="text-gray-500 text-xs font-bold text-center space-y-1">
          <p>Arrow Keys / WASD to move · SPACE to start / restart</p>
        </div>
      </div>
    </main>
  );
}
