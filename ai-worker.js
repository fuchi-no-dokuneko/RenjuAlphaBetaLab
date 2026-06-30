importScripts("engine.js");
const R = RenjuRules;
let nodes = 0, deadline = Infinity, stopped = false, rootPlayer = R.WHITE;
function negamax(board, player, depth, alpha, beta, lastMove, ply) {
  nodes += 1;
  if ((nodes & 511) === 0 && (Date.now() > deadline || stopped)) return { score: R.evaluate(board, player), pv: [] };
  if (R.winner(board, lastMove)) return { score: -10000000 + ply, pv: [] };
  if (depth <= 0) return { score: R.evaluate(board, player), pv: [] };
  const limit = depth >= 4 ? 12 : depth >= 2 ? 18 : 24;
  const moves = R.generateCandidates(board, player, limit);
  if (!moves.length) return { score: 0, pv: [] };
  let best = -Infinity, bestPv = [];
  for (const move of moves) {
    board[R.key(move.x, move.y)] = player;
    const child = negamax(board, R.other(player), depth - 1, -beta, -alpha, move, ply + 1);
    const score = -child.score;
    board[R.key(move.x, move.y)] = R.EMPTY;
    if (score > best) { best = score; bestPv = [move, ...child.pv]; }
    alpha = Math.max(alpha, score); if (alpha >= beta || Date.now() > deadline || stopped) break;
  }
  return { score: best, pv: bestPv };
}
onmessage = (event) => {
  if (event.data.type === "stop") { stopped = true; return; }
  if (event.data.type !== "search") return;
  stopped = false; nodes = 0; deadline = Date.now() + event.data.timeMs; rootPlayer = event.data.player;
  const board = Int8Array.from(event.data.board); const moves = event.data.moves;
  let best = null;
  for (let index = 0; index < moves.length && !stopped && Date.now() <= deadline; index += 1) {
    const move = moves[index]; board[R.key(move.x, move.y)] = rootPlayer;
    const result = negamax(board, R.other(rootPlayer), event.data.depth - 1, -Infinity, Infinity, move, 1);
    board[R.key(move.x, move.y)] = R.EMPTY;
    const candidate = { move, score: -result.score, pv: [move, ...result.pv], nodes };
    if (!best || candidate.score > best.score) best = candidate;
    postMessage({ type: "progress", candidate, completed: index + 1, total: moves.length });
  }
  postMessage({ type: "done", best, nodes });
};
