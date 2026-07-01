# Credits and References

The game, rule engine, canvas renderer, and Web Worker search are maintained in this repository. Rules and algorithmic background were checked against:

- Renju International Federation, [*International Rules of Renju*](https://www.renju.net/rifrules/) - board definition, five, overline, four, and forbidden-move terminology.
- Donald E. Knuth and Ronald W. Moore, [*An Analysis of Alpha-Beta Pruning*](https://doi.org/10.1016/0004-3702(75)90019-3), Artificial Intelligence 6(4), 1975 - foundational alpha-beta search analysis.

The implementation uses no third-party game engine. Forbidden-move detection and parallel root search are local implementations and are not certified tournament-referee software.
