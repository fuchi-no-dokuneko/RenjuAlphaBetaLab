const assert = require("node:assert/strict");

global.importScripts = () => { global.RenjuRules = require("../engine.js"); };
const messages = [];
global.postMessage = (message) => messages.push(message);
require("../ai-worker.js");

global.onmessage({
  data: {
    type: "search",
    board: Array(225).fill(0),
    player: global.RenjuRules.BLACK,
    depth: 2,
    timeMs: 2000,
    moves: [{ x: 7, y: 7, priority: 1 }]
  }
});

const progress = messages.find((message) => message.type === "progress");
const done = messages.find((message) => message.type === "done");
assert.ok(progress, "worker reports root progress");
assert.ok(done?.best, "worker returns a best move");
assert.deepEqual(done.best.move, { x: 7, y: 7, priority: 1 });
assert.ok(done.nodes > 0, "worker searches child nodes");
console.log("PASS Renju worker search");
