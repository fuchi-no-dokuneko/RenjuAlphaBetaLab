@daily @uat @web
Feature: Daily acceptance of Renju Alpha-Beta Lab
  The daily laptop verifies board coordinates, both player colors, parallel search,
  score visualization, replay, undo, and visible forbidden-move enforcement.

  Background:
    Given I open the web application at path "/"
    Then the web page title contains "Renju Alpha-Beta Lab"
    When I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"

  Scenario: Initialize a coordinate-labelled 15 by 15 board
    Then JavaScript expression "RenjuRules.SIZE === 15 && RenjuApp.state.board.length === 225" returns true
    And JavaScript expression "RenjuApp.columnName(0) === 'A' && RenjuApp.columnName(7) === 'H' && RenjuApp.columnName(8) === 'J' && RenjuApp.columnName(14) === 'P'" returns true
    And JavaScript expression "RenjuApp.compactScore(12500) === '13k' && RenjuApp.scoreStyle(-10,-10,10).fill !== RenjuApp.scoreStyle(10,-10,10).fill" returns true
    And CSS "#turnLabel" contains text "Black / You"
    And CSS "#searchState" contains text "Idle"
    And CSS "#candidateCount" contains text "0 evaluated"
    When I set CSS checkbox "#cheat" to checked
    Then CSS checkbox "#cheat" is checked
    And CSS "#scoreLegend" is visible
    When I click CSS "#newGame"
    Then CSS "#status" contains text "Black moves first"
    And JavaScript expression "RenjuApp.state.history.length === 1 && RenjuApp.state.board.every((value) => value === 0)" returns true

  Scenario: Play as black and inspect ranked AI candidates
    When I set CSS checkbox "#cheat" to checked
    And I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    And the numeric text in CSS "#nodes" is greater than 0
    And CSS "#pv" contains text "B "
    When I remember the pixel checksum of CSS canvas "#board"
    And I set CSS checkbox "#cheat" to unchecked
    Then the pixel checksum of CSS canvas "#board" is different
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "That intersection is occupied."
    When I click CSS "#undo"
    Then CSS "#status" eventually contains text "Last round removed."
    And CSS "#candidateCount" contains text "0 evaluated"
    And JavaScript expression "RenjuApp.state.history.length === 1" returns true

  Scenario: Let the AI open when the user plays white and replay the round
    When I choose value "2" in CSS "#humanColor"
    And I click CSS "#newGame"
    Then CSS "#searchState" eventually contains text "Complete"
    And CSS "#turnLabel" contains text "White / You"
    And JavaScript expression "RenjuApp.state.history.length === 2" returns true
    When I click CSS canvas "#board" at column 1 row 1 of a 15 by 15 board
    Then JavaScript expression "RenjuApp.state.history.length === 4" eventually returns true
    And CSS "#searchState" eventually contains text "Complete"
    When I click CSS "#replayBack"
    Then CSS "#replayLabel" contains text "Move 2 of 3"
    When I click CSS canvas "#board" at column 2 row 1 of a 15 by 15 board
    Then JavaScript expression "RenjuApp.state.history.length === 4" returns true
    When I click CSS "#live"
    Then CSS "#replayLabel" contains text "Live position"
    When I click CSS "#undo"
    Then CSS "#status" contains text "Last round removed."
    And JavaScript expression "RenjuApp.state.history.length === 2" returns true

  Scenario: Reject a visible black double-three point
    When I execute JavaScript:
      """
      const R = RenjuRules;
      const state = RenjuApp.state;
      state.workers.forEach((worker) => worker.terminate());
      state.workers = [];
      state.thinking = false;
      state.over = false;
      state.human = R.BLACK;
      state.turn = R.BLACK;
      state.board.fill(R.EMPTY);
      [[6,7],[8,7],[7,6],[7,8]].forEach(([x,y]) => state.board[R.key(x,y)] = R.BLACK);
      state.history = [{ board: Array.from(state.board), turn: R.BLACK, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    And I set CSS checkbox "#cheat" to checked
    Then JavaScript expression "RenjuRules.forbiddenReason(RenjuApp.state.board, 7, 7) === 'double-three'" returns true
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Forbidden for black: double-three."
    And JavaScript expression "RenjuApp.state.board[RenjuRules.key(7,7)] === RenjuRules.EMPTY" returns true
