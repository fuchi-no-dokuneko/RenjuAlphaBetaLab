const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const R = require("../engine.js");

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, "conformance-corpus.json"), "utf8"));
const transforms = {
  identity: ([x, y]) => [x, y],
  rotate90: ([x, y]) => [R.SIZE - 1 - y, x],
  rotate180: ([x, y]) => [R.SIZE - 1 - x, R.SIZE - 1 - y],
  rotate270: ([x, y]) => [y, R.SIZE - 1 - x],
  reflectVertical: ([x, y]) => [R.SIZE - 1 - x, y],
  reflectHorizontal: ([x, y]) => [x, R.SIZE - 1 - y],
  reflectDiagonal: ([x, y]) => [y, x],
  reflectAntiDiagonal: ([x, y]) => [R.SIZE - 1 - y, R.SIZE - 1 - x]
};
const mismatches = [];

assert.equal(corpus.schemaVersion, "1.0.0");
assert.equal(corpus.boardSize, R.SIZE);
assert.match(corpus.source, /^https:\/\//);

for (const position of corpus.positions) {
  for (const [transformName, transform] of Object.entries(transforms)) {
    test(`${position.id} / ${transformName}`, () => {
      const board = new Int8Array(R.SIZE * R.SIZE);
      put(board, R.BLACK, position.black.map(transform));
      put(board, R.WHITE, position.white.map(transform));
      const [x, y] = transform(position.move);
      const actual = {
        legal: R.isLegal(board, x, y, position.player),
        forbidden: position.player === R.BLACK ? R.forbiddenReason(board, x, y) : null,
        winner: null
      };
      if (position.winner !== null) {
        board[R.key(x, y)] = position.player;
        actual.winner = R.winner(board, { x, y });
      }

      const expected = {
        legal: position.legal,
        forbidden: position.forbidden,
        winner: position.winner
      };
      try {
        assert.deepEqual(actual, expected);
      } catch (error) {
        mismatches.push({ position: position.id, transform: transformName, expected, actual });
        throw error;
      }
    });
  }
}

test.after(() => {
  const reportDirectory = path.join(__dirname, "..", "build", "reports");
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(path.join(reportDirectory, "renju-conformance-mismatches.json"), JSON.stringify({
    schemaVersion: "1.0.0",
    ruleVariant: corpus.ruleVariant,
    checkedPositions: corpus.positions.length * Object.keys(transforms).length,
    mismatches
  }, null, 2) + "\n");
});

function put(board, player, points) {
  for (const [x, y] of points) board[R.key(x, y)] = player;
}
