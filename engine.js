(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RenjuRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const SIZE = 15, EMPTY = 0, BLACK = 1, WHITE = 2;
  const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const at = (board, x, y) => x < 0 || y < 0 || x >= SIZE || y >= SIZE ? -1 : board[y * SIZE + x];
  const key = (x, y) => y * SIZE + x;
  const other = (player) => player === BLACK ? WHITE : BLACK;

  function runLength(board, x, y, dx, dy, player) {
    let count = 1;
    for (const sign of [-1, 1]) for (let step = 1; at(board, x + dx * step * sign, y + dy * step * sign) === player; step += 1) count += 1;
    return count;
  }
  function lineWin(board, x, y, player) {
    return DIRECTIONS.some(([dx, dy]) => {
      const length = runLength(board, x, y, dx, dy, player);
      return player === BLACK ? length === 5 : length >= 5;
    });
  }
  function hasOverline(board, x, y) { return DIRECTIONS.some(([dx, dy]) => runLength(board, x, y, dx, dy, BLACK) > 5); }

  function fourGroups(board, x, y, onlyDirection) {
    const groups = new Map();
    DIRECTIONS.forEach(([dx, dy], direction) => {
      if (onlyDirection != null && direction !== onlyDirection) return;
      for (let start = -4; start <= 0; start += 1) {
        const cells = Array.from({ length: 5 }, (_, i) => [x + (start + i) * dx, y + (start + i) * dy]);
        if (!cells.some(([cx, cy]) => cx === x && cy === y)) continue;
        const values = cells.map(([cx, cy]) => at(board, cx, cy));
        if (values.filter((value) => value === BLACK).length !== 4 || values.filter((value) => value === EMPTY).length !== 1) continue;
        const stones = cells.filter((_, i) => values[i] === BLACK).map(([cx, cy]) => key(cx, cy)).sort((a, b) => a - b);
        const empty = cells[values.indexOf(EMPTY)]; board[key(empty[0], empty[1])] = BLACK;
        const legalCompletion = !hasOverline(board, empty[0], empty[1]) && lineWin(board, empty[0], empty[1], BLACK);
        board[key(empty[0], empty[1])] = EMPTY;
        if (legalCompletion) {
          const groupKey = direction + ":" + stones.join("-");
          if (!groups.has(groupKey)) groups.set(groupKey, { direction, stones, completions: new Set() });
          groups.get(groupKey).completions.add(key(empty[0], empty[1]));
        }
      }
    });
    return [...groups.values()];
  }

  function freeThreeDirections(board, x, y) {
    const directions = new Set();
    DIRECTIONS.forEach(([dx, dy], direction) => {
      for (let distance = -4; distance <= 4; distance += 1) {
        const ex = x + dx * distance, ey = y + dy * distance;
        if (at(board, ex, ey) !== EMPTY) continue;
        board[key(ex, ey)] = BLACK;
        const invalidExtension = hasOverline(board, ex, ey) || fourGroups(board, ex, ey).length >= 2;
        const groups = invalidExtension ? [] : fourGroups(board, x, y, direction);
        board[key(ex, ey)] = EMPTY;
        if (groups.some((group) => group.stones.includes(key(x, y)) && group.completions.size >= 2)) directions.add(direction);
      }
    });
    return directions;
  }

  function forbiddenReason(board, x, y) {
    if (at(board, x, y) !== EMPTY) return "occupied";
    board[key(x, y)] = BLACK;
    let reason = null;
    if (hasOverline(board, x, y)) reason = "overline";
    else if (lineWin(board, x, y, BLACK)) reason = null;
    else if (fourGroups(board, x, y).length >= 2) reason = "double-four";
    else if (freeThreeDirections(board, x, y).size >= 2) reason = "double-three";
    board[key(x, y)] = EMPTY;
    return reason;
  }
  function isLegal(board, x, y, player) { return at(board, x, y) === EMPTY && (player !== BLACK || !forbiddenReason(board, x, y)); }
  function winner(board, lastMove) {
    if (!lastMove) return EMPTY;
    const player = at(board, lastMove.x, lastMove.y);
    return player > 0 && lineWin(board, lastMove.x, lastMove.y, player) ? player : EMPTY;
  }
  function generateCandidates(board, player, limit = 24) {
    if (!board.some((value) => value !== EMPTY)) return [{ x: 7, y: 7, priority: 1 }];
    const candidates = [];
    for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
      if (!isLegal(board, x, y, player)) continue;
      let neighbors = 0, nearest = 9;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) if ((dx || dy) && at(board, x + dx, y + dy) > 0) { neighbors += 3 - Math.max(Math.abs(dx), Math.abs(dy)); nearest = Math.min(nearest, Math.max(Math.abs(dx), Math.abs(dy))); }
      if (!neighbors) continue;
      board[key(x, y)] = player; const win = lineWin(board, x, y, player); board[key(x, y)] = EMPTY;
      board[key(x, y)] = other(player); const block = lineWin(board, x, y, other(player)); board[key(x, y)] = EMPTY;
      candidates.push({ x, y, priority: (win ? 1000000 : 0) + (block ? 500000 : 0) + neighbors * 10 - nearest - Math.abs(x - 7) - Math.abs(y - 7) });
    }
    return candidates.sort((a, b) => b.priority - a.priority).slice(0, limit);
  }
  function lineScore(board, player) {
    let score = 0;
    for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) for (const [dx, dy] of DIRECTIONS) {
      if (at(board, x, y) !== player || at(board, x - dx, y - dy) === player) continue;
      let length = 0; while (at(board, x + dx * length, y + dy * length) === player) length += 1;
      const open = Number(at(board, x - dx, y - dy) === EMPTY) + Number(at(board, x + dx * length, y + dy * length) === EMPTY);
      if (length >= 5) score += 1000000; else score += [0, 2, 18, 180, 8000][length] * (open === 2 ? 3 : open);
    }
    return score;
  }
  function evaluate(board, player) { return lineScore(board, player) - lineScore(board, other(player)) * 1.08; }
  return { SIZE, EMPTY, BLACK, WHITE, DIRECTIONS, key, at, other, runLength, lineWin, hasOverline, fourGroups, freeThreeDirections, forbiddenReason, isLegal, winner, generateCandidates, evaluate };
});
