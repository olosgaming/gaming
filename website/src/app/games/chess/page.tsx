"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ── Constants ─────────────────────────────────────────────────────────────────
const SQ = 68; // square size in px
const W = SQ * 8;
const H = SQ * 8;

type Color = "w" | "b";
type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type Piece = { type: PieceType; color: Color };
type Board = (Piece | null)[][];
type Sq = [number, number]; // [row, col]

// Piece glyphs
const GLYPHS: Record<Color, Record<PieceType, string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

// ── Board helpers ─────────────────────────────────────────────────────────────
function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function initialBoard(): Board {
  const b = emptyBoard();
  const back: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: "b" };
    b[1][c] = { type: "P", color: "b" };
    b[6][c] = { type: "P", color: "w" };
    b[7][c] = { type: back[c], color: "w" };
  }
  return b;
}

function opp(c: Color): Color {
  return c === "w" ? "b" : "w";
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Generate pseudo-legal moves (no check detection for simplicity → amateur rules)
function rawMoves(board: Board, r: number, c: number): Sq[] {
  const piece = board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const moves: Sq[] = [];

  const slide = (dr: number, dc: number) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = board[nr][nc];
      if (t) {
        if (t.color !== color) moves.push([nr, nc]);
        break;
      }
      moves.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
  };

  const step = (dr: number, dc: number) => {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc]?.color !== color) moves.push([nr, nc]);
  };

  switch (type) {
    case "R":
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "B":
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "Q":
      [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "N":
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => step(dr,dc));
      break;
    case "K":
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => step(dr,dc));
      break;
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      // Forward
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
      }
      // Captures
      [-1, 1].forEach((dc) => {
        const nr = r + dir;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color === opp(color)) moves.push([nr, nc]);
      });
      break;
    }
  }
  return moves;
}

// Simple check: is the given color's king under attack?
function isInCheck(board: Board, color: Color): boolean {
  let kingR = -1, kingC = -1;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === "K" && board[r][c]?.color === color) { kingR = r; kingC = c; }
  if (kingR === -1) return true; // king captured = in "check"
  const enemy = opp(color);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === enemy)
        if (rawMoves(board, r, c).some(([mr,mc]) => mr === kingR && mc === kingC)) return true;
  return false;
}

function applyMove(board: Board, from: Sq, to: Sq): Board {
  const nb = board.map((row) => [...row]);
  const [fr, fc] = from;
  const [tr, tc] = to;
  nb[tr][tc] = nb[fr][fc];
  nb[fr][fc] = null;
  // Pawn promotion
  if (nb[tr][tc]?.type === "P") {
    if (tr === 0 && nb[tr][tc]?.color === "w") nb[tr][tc] = { type: "Q", color: "w" };
    if (tr === 7 && nb[tr][tc]?.color === "b") nb[tr][tc] = { type: "Q", color: "b" };
  }
  return nb;
}

function legalMoves(board: Board, r: number, c: number, color: Color): Sq[] {
  return rawMoves(board, r, c).filter(([tr, tc]) => {
    const nb = applyMove(board, [r, c], [tr, tc]);
    return !isInCheck(nb, color);
  });
}

function allMoves(board: Board, color: Color): [Sq, Sq][] {
  const result: [Sq, Sq][] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color)
        legalMoves(board, r, c, color).forEach((to) => result.push([[r, c], to]));
  return result;
}

// Very simple AI: score = material, pick highest-value capture; else random
const VALUES: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };

function aiMove(board: Board): [Sq, Sq] | null {
  const moves = allMoves(board, "b");
  if (!moves.length) return null;
  // Score each move
  let best: [Sq, Sq] = moves[0];
  let bestScore = -Infinity;
  for (const [from, to] of moves) {
    const captured = board[to[0]][to[1]];
    const score = captured ? VALUES[captured.type] : 0;
    if (score > bestScore) { bestScore = score; best = [from, to]; }
  }
  // If no captures, random
  if (bestScore === 0) return moves[Math.floor(Math.random() * moves.length)];
  return best;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChessPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Sq | null>(null);
  const [highlights, setHighlights] = useState<Sq[]>([]);
  const [turn, setTurn] = useState<Color>("w");
  const [status, setStatus] = useState<"playing" | "checkmate" | "stalemate">("playing");
  const [winner, setWinner] = useState<Color | null>(null);
  const [inCheck, setInCheck] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const boardRef = useRef(board);
  const turnRef = useRef(turn);
  boardRef.current = board;
  turnRef.current = turn;

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    const LIGHT = "#e8d5b0";
    const DARK  = "#a0785a";
    const HLmove = "rgba(106,200,100,0.45)";
    const HLsel  = "rgba(255,220,50,0.50)";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? LIGHT : DARK;
        ctx.fillRect(c * SQ, r * SQ, SQ, SQ);

        // highlights
        if (selected && selected[0] === r && selected[1] === c) {
          ctx.fillStyle = HLsel;
          ctx.fillRect(c * SQ, r * SQ, SQ, SQ);
        }
        if (highlights.some(([hr, hc]) => hr === r && hc === c)) {
          ctx.fillStyle = HLmove;
          ctx.fillRect(c * SQ, r * SQ, SQ, SQ);
          ctx.fillStyle = "rgba(50,180,50,0.6)";
          ctx.beginPath();
          ctx.arc(c * SQ + SQ / 2, r * SQ + SQ / 2, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // piece
        const p = boardRef.current[r][c];
        if (p) {
          ctx.font = `${SQ * 0.72}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // shadow
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillText(GLYPHS[p.color][p.type], c * SQ + SQ / 2 + 2, r * SQ + SQ / 2 + 2);
          ctx.fillStyle = p.color === "w" ? "#fff" : "#111";
          ctx.fillText(GLYPHS[p.color][p.type], c * SQ + SQ / 2, r * SQ + SQ / 2);
        }

        // Rank / file labels
        ctx.fillStyle = (r + c) % 2 === 0 ? DARK : LIGHT;
        ctx.font = "bold 10px Consolas";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        if (c === 0) ctx.fillText(String(8 - r), c * SQ + 3, r * SQ + 3);
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        if (r === 7) ctx.fillText(String.fromCharCode(97 + c), c * SQ + SQ - 3, r * SQ + SQ - 3);
      }
    }
  }, [selected, highlights]);

  useEffect(() => {
    draw();
  }, [draw, board]);

  const reset = () => {
    setBoard(initialBoard());
    setSelected(null);
    setHighlights([]);
    setTurn("w");
    setStatus("playing");
    setWinner(null);
    setInCheck(false);
    setAiThinking(false);
  };

  const checkEndgame = useCallback((b: Board, color: Color) => {
    const moves = allMoves(b, color);
    const check = isInCheck(b, color);
    setInCheck(check);
    if (moves.length === 0) {
      if (check) { setStatus("checkmate"); setWinner(opp(color)); }
      else        { setStatus("stalemate"); }
      return true;
    }
    return false;
  }, []);

  // AI turn
  useEffect(() => {
    if (turn !== "b" || status !== "playing") return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const move = aiMove(boardRef.current);
      if (move) {
        const nb = applyMove(boardRef.current, move[0], move[1]);
        setBoard(nb);
        if (!checkEndgame(nb, "w")) setTurn("w");
      }
      setAiThinking(false);
    }, 400);
    return () => clearTimeout(t);
  }, [turn, status, checkEndgame]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (turn !== "w" || status !== "playing" || aiThinking) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const c = Math.floor(((e.clientX - rect.left) * scaleX) / SQ);
    const r = Math.floor(((e.clientY - rect.top) * scaleY) / SQ);
    if (!inBounds(r, c)) return;

    const b = boardRef.current;

    // If a move target is clicked
    if (selected) {
      const move = highlights.find(([hr, hc]) => hr === r && hc === c);
      if (move) {
        const nb = applyMove(b, selected, move);
        setBoard(nb);
        setSelected(null);
        setHighlights([]);
        if (!checkEndgame(nb, "b")) setTurn("b");
        return;
      }
    }

    // Select own piece
    const piece = b[r][c];
    if (piece && piece.color === "w") {
      setSelected([r, c]);
      setHighlights(legalMoves(b, r, c, "w"));
    } else {
      setSelected(null);
      setHighlights([]);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1121] text-white">
      <Navbar />
      <div className="flex flex-col items-center pt-28 pb-16 px-4 gap-6">
        {/* Title bar */}
        <div className="flex items-center gap-4 w-full max-w-[580px]">
          <Link href="/games" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">
            ← Games
          </Link>
          <h1 className="text-2xl font-black text-white">♟ Chess</h1>
          <span className="ml-auto bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase px-3 py-0.5 rounded-full">
            vs AI
          </span>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 w-full max-w-[580px]">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Turn</span>
            <span className={`text-lg font-black ${turn === "w" ? "text-white" : "text-blue-400"}`}>
              {status === "playing"
                ? turn === "w"
                  ? "Your Turn (White)"
                  : aiThinking
                  ? "AI Thinking…"
                  : "Black's Turn"
                : status === "checkmate"
                ? winner === "w"
                  ? "🎉 You Win! Checkmate!"
                  : "😞 AI Wins! Checkmate!"
                : "🤝 Stalemate — Draw"}
            </span>
            {inCheck && status === "playing" && (
              <span className="text-red-400 text-xs font-bold mt-0.5">⚠ In Check!</span>
            )}
          </div>
          <button
            onClick={reset}
            className="ml-auto px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-95"
          >
            New Game
          </button>
        </div>

        {/* Board */}
        <div
          className={`rounded-xl overflow-hidden border shadow-2xl transition-all ${
            inCheck && status === "playing"
              ? "border-red-500/60 shadow-red-900/30"
              : "border-blue-500/20 shadow-blue-900/20"
          }`}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleClick}
            className="block cursor-pointer"
            style={{ width: `${W}px`, height: `${H}px`, maxWidth: "min(544px,95vw)", aspectRatio: "1" }}
          />
        </div>

        <p className="text-gray-500 text-xs font-bold text-center">
          Click a piece to select · Click a green dot to move · Auto-promotes Pawn → Queen
        </p>
      </div>
    </main>
  );
}
