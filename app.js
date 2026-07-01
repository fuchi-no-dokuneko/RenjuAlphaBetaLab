(() => {
  "use strict";
  const R = RenjuRules, $ = (id) => document.getElementById(id);
  const state = { board: new Int8Array(R.SIZE * R.SIZE), turn: R.BLACK, human: R.BLACK, over: false, thinking: false, workers: [], candidates: [], history: [], replayIndex: -1, pv: [] };
  const columnName = (x) => String.fromCharCode(65 + x + (x >= 8 ? 1 : 0));
  const moveName = (move) => columnName(move.x) + (R.SIZE - move.y);
  function compactScore(value) {
    const score = Math.round(value);
    const absolute = Math.abs(score);
    if (absolute >= 1000000) return (score / 1000000).toFixed(absolute >= 10000000 ? 0 : 1).replace(".0", "") + "m";
    if (absolute >= 1000) return (score / 1000).toFixed(absolute >= 10000 ? 0 : 1).replace(".0", "") + "k";
    return String(score);
  }
  function scoreStyle(score, minimum, maximum) {
    const ratio = maximum === minimum ? 0.5 : (score - minimum) / (maximum - minimum);
    const palette = [
      { fill: "rgba(181,68,59,.78)", text: "#ffffff" },
      { fill: "rgba(211,119,57,.78)", text: "#241c13" },
      { fill: "rgba(225,181,66,.8)", text: "#241f12" },
      { fill: "rgba(112,148,78,.8)", text: "#132017" },
      { fill: "rgba(19,112,90,.82)", text: "#ffffff" }
    ];
    return palette[Math.min(palette.length - 1, Math.floor(ratio * palette.length))];
  }
  function snapshot(move) { state.history.push({ board: Array.from(state.board), turn: state.turn, move }); state.replayIndex = state.history.length - 1; }
  function displayedBoard() { return state.replayIndex >= 0 && state.replayIndex < state.history.length - 1 ? Int8Array.from(state.history[state.replayIndex].board) : state.board; }
  function setStatus(text, error = false) { $("status").textContent = text; $("status").className = "status" + (error ? " error" : ""); }
  function newGame() {
    stopWorkers(); state.board.fill(0); state.turn = R.BLACK; state.human = Number($("humanColor").value); state.over = false; state.candidates = []; state.pv = []; state.history = []; snapshot(null); clearAnalysis(); updateTurn(); draw(); setStatus("Black moves first. Select an intersection."); if (state.human === R.WHITE) requestAi();
  }
  function place(move, player) {
    state.board[R.key(move.x, move.y)] = player; snapshot(move); draw();
    if (R.winner(state.board, move)) { state.over = true; setStatus((player === R.BLACK ? "Black" : "White") + " wins with five."); updateTurn(); return true; }
    if (!state.board.includes(R.EMPTY)) { state.over = true; setStatus("Draw: the board is full."); updateTurn(); return true; }
    state.turn = R.other(player); state.history[state.history.length - 1].turn = state.turn; updateTurn(); return false;
  }
  function humanMove(move) {
    if (state.thinking || state.over || state.turn !== state.human || state.replayIndex !== state.history.length - 1) return;
    const reason = state.human === R.BLACK ? R.forbiddenReason(state.board, move.x, move.y) : (R.at(state.board, move.x, move.y) !== R.EMPTY ? "occupied" : null);
    if (reason) { setStatus(reason === "occupied" ? "That intersection is occupied." : "Forbidden for black: " + reason + ".", true); return; }
    if (!place(move, state.human)) requestAi();
  }
  function updateTurn() { const black = state.turn === R.BLACK; $("turnStone").className = "stone " + (black ? "black" : "white"); $("turnLabel").textContent = (black ? "Black" : "White") + " / " + (state.turn === state.human ? "You" : "AI"); }
  function stopWorkers() { state.workers.forEach((worker) => { worker.postMessage({ type: "stop" }); worker.terminate(); }); state.workers = []; state.thinking = false; }
  function clearAnalysis() { $("searchState").textContent = "Idle"; $("workerCount").textContent = "0"; $("nodes").textContent = "0"; $("progressBar").style.width = "0"; $("candidateCount").textContent = "0 evaluated"; $("candidates").innerHTML = "<p>No search results.</p>"; $("pv").textContent = "No principal variation."; }
  function requestAi() {
    if (state.over || state.turn === state.human) return;
    const depth = Math.max(1, Math.min(6, Number($("depth").value) || 3)); const timeMs = Math.max(1000, Math.min(30000, Number($("timeLimit").value) * 1000 || 8000));
    const roots = R.generateCandidates(state.board, state.turn, depth >= 5 ? 16 : 28); if (!roots.length) { state.over = true; setStatus("No legal AI move. Game over."); return; }
    state.thinking = true; state.candidates = []; let finished = 0, nodes = 0, evaluated = 0; const count = Math.min(4, Math.max(1, navigator.hardwareConcurrency ? navigator.hardwareConcurrency - 1 : 2), roots.length);
    $("searchState").textContent = "Depth " + depth; $("workerCount").textContent = count; setStatus("AI is evaluating " + roots.length + " legal root moves across " + count + " workers.");
    const chunks = Array.from({ length: count }, () => []); roots.forEach((move, index) => chunks[index % count].push(move));
    chunks.forEach((moves) => { const worker = new Worker("ai-worker.js"); state.workers.push(worker); worker.onmessage = (event) => {
      if (event.data.type === "progress") { const candidate = event.data.candidate; const existing = state.candidates.findIndex((item) => item.move.x === candidate.move.x && item.move.y === candidate.move.y); existing >= 0 ? state.candidates[existing] = candidate : state.candidates.push(candidate); evaluated += 1; nodes = Math.max(nodes, candidate.nodes) + 1; renderAnalysis(evaluated, roots.length, nodes); }
      if (event.data.type === "done") { finished += 1; nodes += event.data.nodes || 0; if (finished === count) finishAi(nodes); }
    }; worker.onerror = () => { finished += 1; if (finished === count) finishAi(nodes); }; worker.postMessage({ type: "search", board: Array.from(state.board), player: state.turn, depth, timeMs, moves }); });
  }
  function finishAi(nodes) {
    stopWorkers(); $("nodes").textContent = nodes.toLocaleString(); $("progressBar").style.width = "100%"; const best = [...state.candidates].sort((a, b) => b.score - a.score)[0];
    if (!best) { state.over = true; setStatus("Search ended before a candidate completed.", true); return; }
    state.pv = best.pv; renderAnalysis(state.candidates.length, state.candidates.length, nodes); $("searchState").textContent = "Complete"; setStatus("AI selected " + moveName(best.move) + " with score " + Math.round(best.score) + "."); place(best.move, state.turn);
  }
  function renderAnalysis(done, total, nodes) {
    $("progressBar").style.width = Math.min(100, done / Math.max(1, total) * 100) + "%"; $("candidateCount").textContent = state.candidates.length + " evaluated"; $("nodes").textContent = nodes.toLocaleString();
    const sorted = [...state.candidates].sort((a, b) => b.score - a.score).slice(0, 12); const max = Math.max(1, ...sorted.map((item) => Math.abs(item.score))); const container = $("candidates"); container.replaceChildren();
    sorted.forEach((item, index) => { const row = document.createElement("div"); row.className = "candidate"; const rank = document.createElement("strong"); rank.textContent = (index + 1) + "."; const center = document.createElement("div"); center.textContent = moveName(item.move); const bar = document.createElement("div"); bar.className = "bar"; const fill = document.createElement("i"); fill.style.width = Math.min(100, Math.abs(item.score) / max * 100) + "%"; bar.appendChild(fill); center.appendChild(bar); const score = document.createElement("span"); score.textContent = Math.round(item.score); row.append(rank, center, score); container.appendChild(row); });
    const best = sorted[0]; $("pv").textContent = best ? best.pv.map((move, index) => (index % 2 ? "W " : "B ") + moveName(move)).join("  >  ") : "No principal variation.";
    if ($("cheat").checked) draw();
  }
  function undo() { if (state.thinking) stopWorkers(); if (state.history.length <= 1) return; const remove = state.history.length >= 3 ? 2 : 1; state.history.splice(-remove); const last = state.history[state.history.length - 1]; state.board = Int8Array.from(last.board); state.turn = last.turn; state.over = false; state.candidates = []; state.pv = []; state.replayIndex = state.history.length - 1; clearAnalysis(); updateTurn(); draw(); setStatus("Last round removed."); }
  function replay(delta) { state.replayIndex = Math.max(0, Math.min(state.history.length - 1, state.replayIndex + delta)); $("replayLabel").textContent = state.replayIndex === state.history.length - 1 ? "Live position" : "Move " + state.replayIndex + " of " + (state.history.length - 1); draw(); }
  function canvasMove(event) { const canvas = $("board"), rect = canvas.getBoundingClientRect(), unit = rect.width / 16, x = Math.round((event.clientX - rect.left - unit) / unit), y = Math.round((event.clientY - rect.top - unit) / unit); if (x >= 0 && y >= 0 && x < R.SIZE && y < R.SIZE) humanMove({ x, y }); }
  function draw() {
    const canvas = $("board"), ratio = devicePixelRatio || 1, width = Math.max(300, canvas.clientWidth); canvas.width = width * ratio; canvas.height = width * ratio; const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio); const unit = width / 16; ctx.fillStyle = "#d9a85e"; ctx.fillRect(0, 0, width, width); ctx.strokeStyle = "#4d3b25"; ctx.lineWidth = 1;
    for (let i = 1; i <= R.SIZE; i += 1) { ctx.beginPath(); ctx.moveTo(unit, i * unit); ctx.lineTo(15 * unit, i * unit); ctx.moveTo(i * unit, unit); ctx.lineTo(i * unit, 15 * unit); ctx.stroke(); }
    [[4,4],[12,4],[8,8],[4,12],[12,12]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x*unit,y*unit,Math.max(2,unit*.08),0,Math.PI*2);ctx.fillStyle="#382b1d";ctx.fill()});
    ctx.fillStyle = "#392b1d"; ctx.font = "700 " + Math.max(8, Math.min(13, unit * .24)) + "px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let index = 0; index < R.SIZE; index += 1) { const position = (index + 1) * unit; const column = columnName(index); const row = String(R.SIZE - index); ctx.fillText(column, position, unit * .42); ctx.fillText(column, position, width - unit * .38); ctx.fillText(row, unit * .38, position); ctx.fillText(row, width - unit * .38, position); }
    const board = displayedBoard();
    if ($("cheat").checked && state.replayIndex === state.history.length - 1 && state.candidates.length) {
      const scores = state.candidates.map((candidate) => candidate.score); const minimum = Math.min(...scores); const maximum = Math.max(...scores);
      state.candidates.forEach((candidate) => { const cx = (candidate.move.x + 1) * unit, cy = (candidate.move.y + 1) * unit, style = scoreStyle(candidate.score, minimum, maximum); ctx.beginPath(); ctx.arc(cx, cy, unit * .34, 0, Math.PI * 2); ctx.fillStyle = style.fill; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = style.text; ctx.font = "700 " + Math.max(7, Math.min(11, unit * .2)) + "px ui-monospace, monospace"; ctx.fillText(compactScore(candidate.score), cx, cy); });
    }
    for (let y = 0; y < R.SIZE; y += 1) for (let x = 0; x < R.SIZE; x += 1) { const value = board[R.key(x,y)]; if (!value) continue; const cx=(x+1)*unit,cy=(y+1)*unit,r=unit*.4; const gradient=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r); if(value===R.BLACK){gradient.addColorStop(0,"#555");gradient.addColorStop(1,"#111")}else{gradient.addColorStop(0,"#fff");gradient.addColorStop(1,"#c9c9c3")}ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=value===R.BLACK?"#000":"#888";ctx.stroke(); }
    if ($("cheat").checked && state.replayIndex === state.history.length - 1) for (let y=0;y<R.SIZE;y+=1) for(let x=0;x<R.SIZE;x+=1){const reason=R.forbiddenReason(state.board,x,y);if(reason&&reason!=="occupied"){const cx=(x+1)*unit,cy=(y+1)*unit,d=unit*.18;ctx.strokeStyle="#bd483d";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-d,cy-d);ctx.lineTo(cx+d,cy+d);ctx.moveTo(cx+d,cy-d);ctx.lineTo(cx-d,cy+d);ctx.stroke()}}
  }
  $("board").addEventListener("click", canvasMove); $("newGame").addEventListener("click", newGame); $("undo").addEventListener("click", undo); $("cheat").addEventListener("change", () => { $("scoreLegend").hidden = !$("cheat").checked; draw(); }); $("replayBack").addEventListener("click",()=>replay(-1)); $("replayForward").addEventListener("click",()=>replay(1)); $("live").addEventListener("click",()=>{state.replayIndex=state.history.length-1;replay(0)}); window.addEventListener("resize", draw);
  window.RenjuApp = { state, newGame, humanMove, draw, columnName, compactScore, scoreStyle }; newGame();
})();
