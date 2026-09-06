# Renju conformance corpus

The normative rule source is the Renju International Federation's [International Rules of Renju](https://renju.se/rif/rifrules.htm), matching the variant already stated in this repository. The JSON positions are minimal derived board fixtures for those definitions, not records copied from tournament games.

Each position declares black and white stones, the proposed move, legality, forbidden reason, and winner. The runner applies identity, three rotations, and four reflections. The corpus includes exact-five and overline differences, positive and negative double-four/double-three cases, blocked patterns, occupied points, white behavior, and board edges.

Run `node --test tests/conformance.test.js`. Any mismatch is written separately to `build/reports/renju-conformance-mismatches.json`. Do not change engine behavior until that report and the source interpretation are reviewed.
