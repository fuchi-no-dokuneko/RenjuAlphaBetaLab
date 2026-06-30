const assert = require("node:assert/strict");
const R = require("../engine.js");
const board = () => new Int8Array(R.SIZE * R.SIZE);
function put(b, player, points) { points.forEach(([x,y]) => b[R.key(x,y)] = player); }
{
  const b=board(); put(b,R.BLACK,[[3,7],[4,7],[5,7],[6,7],[8,7]]); assert.equal(R.forbiddenReason(b,7,7),"overline");
}
{
  const b=board(); put(b,R.BLACK,[[5,7],[6,7],[8,7],[7,5],[7,6],[7,8]]); assert.equal(R.forbiddenReason(b,7,7),"double-four");
}
{
  const b=board(); put(b,R.BLACK,[[6,7],[8,7],[7,6],[7,8]]); assert.equal(R.forbiddenReason(b,7,7),"double-three");
}
{
  const b=board(); put(b,R.BLACK,[[3,7],[4,7],[5,7],[6,7]]); assert.equal(R.forbiddenReason(b,7,7),null); b[R.key(7,7)]=R.BLACK; assert.equal(R.lineWin(b,7,7,R.BLACK),true);
}
{
  const b=board(); put(b,R.WHITE,[[2,2],[3,2],[4,2],[5,2],[6,2]]); assert.equal(R.lineWin(b,6,2,R.WHITE),true);
}
console.log("PASS Renju rules");
