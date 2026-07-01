# Renju Alpha-Beta Lab

A static 15x15 Renju game with black forbidden-move enforcement and parallel root alpha-beta search. Root candidates are split across up to four Web Workers; each worker searches its assigned branches to depth `K` and reports candidate score, node progress, and principal variation. The board includes A-H/J-P and 1-15 coordinates, while visualization mode overlays forbidden moves and color-ranked minimax scores.

## Rules

The implementation follows the [International Rules of Renju](https://renju.se/rif/rifrules.htm): black may not play an overline, double-four, or double-three. An exact black five wins before double-three/double-four evaluation. Free-three detection verifies that an extension can legally produce a straight four. Renju edge cases have formal interpretation details; this project documents its algorithm and tests common straight and broken formations but is not a certified tournament referee.

## Run and test

```bash
node tests/rules.test.js
node tests/worker.test.js
./serve-local.sh
```

Open `http://localhost:8086`.

## Credits

See [CREDITS.md](CREDITS.md) for Renju rules and alpha-beta references.
