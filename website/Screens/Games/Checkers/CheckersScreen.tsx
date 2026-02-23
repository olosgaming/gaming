"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ── Constants ────────────────────────────────────────────────────────────────
const SQ = 72;
const W  = SQ * 8;
const H  = SQ * 8;

type Color = "red" | "black";
type PieceType = "man" | "king";
type Piece = { color: Color; type: PieceType };
type Board = (Piece | null)[][];
type Sq = [number, number];

function oppColor(c: Color): Color { return c === "red" ? "black" : "red"; }

// ── Board setup ──────────────────────────────────────────────────────────────
function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = { color: "black", type: "man" };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = { color: "red", type: "man" };
  return b;
}

function copyBoard(b: Board): Board { return b.map(row => row.map(p => p ? { ...p } : null)); }
function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// ── Move generation ──────────────────────────────────────────────────────────
function jumpDirs(): [number,number][] { return [[-1,-1],[-1,1],[1,-1],[1,1]]; }
function moveDirs(piece: Piece): [number,number][] {
  if (piece.type === "king") return [[-1,-1],[-1,1],[1,-1],[1,1]];
  return piece.color === "red" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
}

type Move = { from: Sq; to: Sq; captured: Sq[]; promotes: boolean };

function exploreCaptures(b: Board, r: number, c: number, piece: Piece, capSoFar: Sq[]): Move[] {
  const results: Move[] = [];
  let foundAny = false;
  for (const [dr,dc] of jumpDirs()) {
    const jr = r+dr, jc = c+dc, lr = r+2*dr, lc = c+2*dc;
    if (!inBounds(jr,jc) || !inBounds(lr,lc)) continue;
    if (capSoFar.some(([a,b]) => a===jr && b===jc)) continue;
    const jumped = b[jr][jc];
    if (!jumped || jumped.color === piece.color || b[lr][lc]) continue;
    foundAny = true;
    const newCap = [...capSoFar, [jr,jc] as Sq];
    const sub = exploreCaptures(b, lr, lc, piece, newCap);
    if (sub.length) { results.push(...sub); }
    else {
      const promotes = (piece.type === "man") && (piece.color === "red" ? lr===0 : lr===7);
      results.push({ from: [r,c], to: [lr,lc], captured: newCap, promotes });
    }
  }
  if (!foundAny && capSoFar.length) {
    const promotes = (piece.type === "man") && (piece.color === "red" ? r===0 : r===7);
    results.push({ from: [r,c], to: [r,c], captured: capSoFar, promotes });
  }
  return results;
}

function normalMoves(b: Board, r: number, c: number, piece: Piece): Move[] {
  return moveDirs(piece)
    .map(([dr,dc]) => [r+dr, c+dc] as Sq)
    .filter(([nr,nc]) => inBounds(nr,nc) && !b[nr][nc])
    .map(([nr,nc]) => {
      const promotes = (piece.type==="man") && (piece.color==="red" ? nr===0 : nr===7);
      return { from:[r,c] as Sq, to:[nr,nc] as Sq, captured:[] as Sq[], promotes };
    });
}

function movesForPiece(b: Board, r: number, c: number): Move[] {
  const piece = b[r][c];
  if (!piece) return [];
  const caps = exploreCaptures(b, r, c, piece, []);
  return caps.length ? caps : normalMoves(b, r, c, piece);
}

function allMovesFor(b: Board, color: Color): Move[] {
  const caps: Move[] = [], norms: Move[] = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++)
    if (b[r][c]?.color===color) {
      caps.push(...exploreCaptures(b,r,c,b[r][c]!,[]));
      norms.push(...normalMoves(b,r,c,b[r][c]!));
    }
  return caps.length ? caps : norms;
}

function applyMove(b: Board, move: Move): Board {
  const nb = copyBoard(b);
  const p = { ...nb[move.from[0]][move.from[1]]! };
  nb[move.from[0]][move.from[1]] = null;
  for (const [jr,jc] of move.captured) nb[jr][jc] = null;
  if (move.promotes) p.type = "king";
  nb[move.to[0]][move.to[1]] = p;
  return nb;
}

function aiMove(b: Board): Move | null {
  const moves = allMovesFor(b, "black");
  if (!moves.length) return null;
  const captures = moves.filter(m => m.captured.length);
  if (captures.length) return captures[Math.floor(Math.random()*captures.length)];
  return moves[Math.floor(Math.random()*moves.length)];
}

function drawCanvas(canvas: HTMLCanvasElement, board: Board, selected: Sq | null, highlights: Move[]) {
  const ctx = canvas.getContext("2d")!;
  const LIGHT = "#f0d9b5";
  const DARK  = "#b58863";

  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      ctx.fillStyle = (r+c)%2===0 ? LIGHT : DARK;
      ctx.fillRect(c*SQ, r*SQ, SQ, SQ);
      if (selected?.[0]===r && selected?.[1]===c) {
        ctx.fillStyle = "rgba(255,220,50,0.45)";
        ctx.fillRect(c*SQ, r*SQ, SQ, SQ);
      }
      const hl = highlights.find(m => m.to[0]===r && m.to[1]===c);
      if (hl) {
        ctx.fillStyle = "rgba(80,200,80,0.40)";
        ctx.fillRect(c*SQ, r*SQ, SQ, SQ);
        ctx.fillStyle = "rgba(50,180,50,0.7)";
        ctx.beginPath();
        ctx.arc(c*SQ+SQ/2, r*SQ+SQ/2, 10, 0, Math.PI*2);
        ctx.fill();
      }
      const piece = board[r][c];
      if (!piece) continue;
      const x = c*SQ+SQ/2, y = r*SQ+SQ/2, rad = SQ/2-8;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath(); ctx.arc(x+3,y+3,rad,0,Math.PI*2); ctx.fill();
      const g = ctx.createRadialGradient(x-rad/3,y-rad/3,2,x,y,rad);
      if (piece.color==="red") {
        g.addColorStop(0,"#f87171"); g.addColorStop(1,"#b91c1c");
      } else {
        g.addColorStop(0,"#44475a"); g.addColorStop(1,"#1a1b23");
      }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = piece.color==="red" ? "#fca5a5" : "#6272a4";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.stroke();
      if (piece.type==="king") {
        ctx.font = `${SQ*0.4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde68a";
        ctx.fillText("♛", x, y);
      }
    }
  }
}

export default function CheckersScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(initialBoard);
  const boardRef = useRef(board);
  boardRef.current = board;
  const [selected, setSelected] = useState<Sq | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [highlights, setHighlights] = useState<Move[]>([]);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const [turn, setTurn] = useState<Color>("red");
  const turnRef = useRef(turn);
  turnRef.current = turn;
  const [status, setStatus] = useState<"playing"|"finished">("playing");
  const [winner, setWinner] = useState<Color|null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [mustContinue, setMustContinue] = useState<Sq|null>(null); 
  const mustContinueRef = useRef(mustContinue);
  mustContinueRef.current = mustContinue;

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, board, selected, highlights);
  }, [board, selected, highlights]);

  const checkEnd = useCallback((b: Board, color: Color) => {
    const moves = allMovesFor(b, color);
    if (!moves.length) {
      setStatus("finished");
      setWinner(oppColor(color));
      return true;
    }
    return false;
  }, []);

  const reset = () => {
    setBoard(initialBoard());
    setSelected(null);
    setHighlights([]);
    setTurn("red");
    setStatus("playing");
    setWinner(null);
    setMoveCount(0);
    setAiThinking(false);
    setMustContinue(null);
  };

  useEffect(() => {
    if (turn !== "black" || status !== "playing") return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const move = aiMove(boardRef.current);
      if (move) {
        const nb = applyMove(boardRef.current, move);
        setBoard(nb);
        setMoveCount(m => m + 1);
        const followUp = move.captured.length ? exploreCaptures(nb, move.to[0], move.to[1], nb[move.to[0]][move.to[1]]!, []) : [];
        if (followUp.length) {
          setMustContinue(move.to);
          setTurn("black");
        } else {
          setMustContinue(null);
          if (!checkEnd(nb, "red")) setTurn("red");
        }
      }
      setAiThinking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [turn, status, checkEnd]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (turnRef.current !== "red" || status !== "playing" || aiThinking) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const c = Math.floor(((e.clientX - rect.left) * scaleX) / SQ);
    const r = Math.floor(((e.clientY - rect.top) * scaleY) / SQ);
    if (!inBounds(r,c)) return;

    const b = boardRef.current;
    const allPlayerMoves = allMovesFor(b, "red");
    const globalCaptures = allPlayerMoves.filter(m => m.captured.length > 0);

    const chain = mustContinueRef.current;
    if (chain) {
      const chainMoves = highlightsRef.current;
      const move = chainMoves.find(m => m.to[0]===r && m.to[1]===c);
      if (move) {
        const nb = applyMove(b, move);
        setBoard(nb);
        setMoveCount(m => m + 1);
        setSelected(null);
        const followUp = exploreCaptures(nb, r, c, nb[r][c]!, []);
        if (followUp.length) {
          setMustContinue([r,c]);
          setSelected([r,c]);
          setHighlights(followUp);
        } else {
          setMustContinue(null);
          setHighlights([]);
          if (!checkEnd(nb, "black")) setTurn("black");
        }
      }
      return;
    }

    if (selectedRef.current) {
      const move = highlightsRef.current.find(m => m.to[0]===r && m.to[1]===c);
      if (move) {
        const nb = applyMove(b, move);
        setBoard(nb);
        setMoveCount(m => m + 1);
        setSelected(null);
        const followUp = move.captured.length ? exploreCaptures(nb, r, c, nb[r][c]!, []) : [];
        if (followUp.length) {
          setMustContinue([r,c]);
          setSelected([r,c]);
          setHighlights(followUp);
        } else {
          setMustContinue(null);
          setHighlights([]);
          if (!checkEnd(nb, "black")) setTurn("black");
        }
        return;
      }
    }

    const piece = b[r][c];
    if (piece?.color === "red") {
      let pieceMoves = movesForPiece(b, r, c);
      if (globalCaptures.length) pieceMoves = pieceMoves.filter(m => m.captured.length > 0);
      setSelected(pieceMoves.length ? [r,c] : null);
      setHighlights(pieceMoves);
    } else {
      setSelected(null);
      setHighlights([]);
    }
  }, [status, aiThinking, checkEnd]);

  return (
    <div className="min-h-screen bg-[#0B1121] text-white">
      <Navbar />
      <div className="flex flex-col items-center pt-28 pb-16 px-4 gap-6">
        <div className="flex items-center gap-4 w-full max-w-[600px]">
          <Link href="/games" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">
            ← Games
          </Link>
          <h1 className="text-2xl font-black text-white">🔴 Checkers</h1>
          <span className="ml-auto bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-black uppercase px-3 py-0.5 rounded-full">
            vs AI
          </span>
        </div>

        <div className="flex items-center gap-4 w-full max-w-[600px]">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Status</span>
            <span className={`text-lg font-black ${
              status==="finished" ? (winner==="red" ? "text-red-400" : "text-blue-400") :
              turn==="red" ? "text-red-400" : "text-blue-400"
            }`}>
              {status === "finished"
                ? winner === "red" ? "🎉 You Win!" : "😞 AI Wins!"
                : turn === "red"
                ? mustContinue ? "⚡ Continue Capture!" : "Your Turn (Red)"
                : aiThinking ? "AI Thinking…" : "AI's Turn (Black)"}
            </span>
          </div>
          <div className="flex flex-col ml-4">
            <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Moves</span>
            <span className="text-lg font-black text-white">{moveCount}</span>
          </div>
          <button
            onClick={reset}
            className="ml-auto px-5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-all active:scale-95"
          >
            New Game
          </button>
        </div>

        <div className="rounded-xl overflow-hidden border border-red-500/20 shadow-2xl shadow-red-900/20">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleClick}
            className="block cursor-pointer"
            style={{ width: `${W}px`, height: `${H}px`, maxWidth: "min(576px,95vw)", aspectRatio: "1" }}
          />
        </div>

        {status === "finished" && (
          <div className="flex gap-3">
            <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all active:scale-95">
              Play Again
            </button>
            <Link href="/games" className="px-6 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white font-bold transition-all">
              Back to Games
            </Link>
          </div>
        )}

        <p className="text-gray-500 text-xs font-bold text-center">
          Click a red piece · Green dots = valid moves · Captures are mandatory · Kings can move backwards
        </p>
      </div>
    </div>
  );
}
