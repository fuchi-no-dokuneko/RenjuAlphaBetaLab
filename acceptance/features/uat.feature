@daily @uat @web
Feature: Daily acceptance of Renju Alpha-Beta Lab
  The daily laptop verifies every visible game control, coordinate rendering,
  parallel search, score overlays, replay transitions, rules, and reload recovery.

  Background:
    Given I open the web application at path "/"
    Then the web page title contains "Renju Alpha-Beta Lab"

  Scenario: Open a clean coordinate-labelled 15 by 15 game
    Then CSS "#humanColor" has value "1"
    And CSS "#depth" has value "3"
    And CSS "#timeLimit" has value "8"
    And CSS checkbox "#cheat" is unchecked
    And JavaScript expression "document.getElementById('scoreLegend').hidden === true" returns true
    And CSS "#turnLabel" contains text "Black / You"
    And CSS "#searchState" contains text "Idle"
    And CSS "#workerCount" contains text "0"
    And CSS "#nodes" contains text "0"
    And CSS "#candidateCount" contains text "0 evaluated"
    And CSS "#replayLabel" contains text "Live position"
    And CSS "#newGame" is enabled
    And CSS "#undo" is enabled
    And JavaScript expression "RenjuRules.SIZE === 15 && RenjuApp.state.board.length === 225 && RenjuApp.state.history.length === 1" returns true
    And JavaScript expression "RenjuApp.columnName(0) === 'A' && RenjuApp.columnName(7) === 'H' && RenjuApp.columnName(8) === 'J' && RenjuApp.columnName(14) === 'P'" returns true
    And JavaScript expression "Array.from(document.getElementById('board').getContext('2d').getImageData(0, 0, document.getElementById('board').width, document.getElementById('board').height).data).some((value, index) => index % 4 === 3 && value > 0)" returns true
    When I click CSS "#undo"
    Then JavaScript expression "RenjuApp.state.history.length === 1 && RenjuApp.state.board.every((value) => value === 0)" returns true
    And CSS "#status" contains text "Black moves first"

  Scenario: Play as black and inspect complete parallel search analysis
    When I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    And the numeric text in CSS "#workerCount" is greater than 0
    And the numeric text in CSS "#nodes" is greater than 0
    And CSS "#progressBar" has attribute "style" equal to "width: 100%;"
    And CSS "#candidateCount" contains text "evaluated"
    And CSS "#pv" contains text "B "
    And JavaScript expression "Array.from(document.querySelectorAll('#candidates .candidate > span')).map((item) => Number(item.textContent)).every((score, index, scores) => index === 0 || scores[index - 1] >= score)" returns true
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "That intersection is occupied."
    When I click CSS "#undo"
    Then CSS "#status" contains text "Last round removed."
    And CSS "#candidateCount" contains text "0 evaluated"
    And CSS "#pv" contains text "No principal variation."
    And JavaScript expression "RenjuApp.state.history.length === 1 && RenjuApp.state.board.every((value) => value === 0)" returns true

  Scenario: Show and hide ranked candidate colors on the live board
    When I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    When I remember the pixel checksum of CSS canvas "#board"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    And the pixel checksum of CSS canvas "#board" is different
    And JavaScript expression "RenjuApp.compactScore(12500) === '13k' && RenjuApp.scoreStyle(-10, -10, 10).fill !== RenjuApp.scoreStyle(10, -10, 10).fill" returns true
    When I set CSS checkbox "#cheat" to unchecked
    Then CSS checkbox "#cheat" is unchecked
    And JavaScript expression "document.getElementById('scoreLegend').hidden === true" returns true
    When I click CSS "#newGame"
    Then CSS "#candidateCount" contains text "0 evaluated"

  Scenario: Let the AI open as black and navigate replay history
    When I choose value "2" in CSS "#humanColor"
    Then CSS "#turnLabel" contains text "Black / You"
    When I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I click CSS "#newGame"
    Then CSS "#searchState" eventually contains text "Complete"
    And CSS "#turnLabel" contains text "White / You"
    And JavaScript expression "RenjuApp.state.history.length === 2" returns true
    When I click CSS canvas "#board" at column 1 row 1 of a 15 by 15 board
    Then JavaScript expression "RenjuApp.state.history.length === 4" eventually returns true
    And CSS "#searchState" eventually contains text "Complete"
    When I click CSS "#replayBack"
    Then CSS "#replayLabel" contains text "Move 2 of 3"
    When I click CSS "#replayBack"
    Then CSS "#replayLabel" contains text "Move 1 of 3"
    When I remember JavaScript expression "RenjuApp.state.history.length" as "history while replaying"
    And I click CSS canvas "#board" at column 2 row 1 of a 15 by 15 board
    Then JavaScript expression "RenjuApp.state.history.length" equals remembered value "history while replaying"
    When I click CSS "#replayForward"
    Then CSS "#replayLabel" contains text "Move 2 of 3"
    When I click CSS "#live"
    Then CSS "#replayLabel" contains text "Live position"
    When I click CSS "#undo"
    Then CSS "#status" contains text "Last round removed."
    And JavaScript expression "RenjuApp.state.history.length === 2" returns true

  Scenario: Cancel an active deep search with a new game
    When I replace CSS "#depth" with "6"
    And I replace CSS "#timeLimit" with "30"
    And I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" contains text "Depth 6"
    And JavaScript expression "RenjuApp.state.thinking === true && RenjuApp.state.workers.length > 0" returns true
    When I remember JavaScript expression "RenjuApp.state.history.length" as "history during search"
    And I click CSS canvas "#board" at column 7 row 8 of a 15 by 15 board
    Then JavaScript expression "RenjuApp.state.history.length" equals remembered value "history during search"
    When I click CSS "#newGame"
    Then CSS "#searchState" contains text "Idle"
    And CSS "#workerCount" contains text "0"
    And CSS "#candidateCount" contains text "0 evaluated"
    And JavaScript expression "RenjuApp.state.thinking === false && RenjuApp.state.workers.length === 0 && RenjuApp.state.history.length === 1" returns true

  Scenario: Reject a black overline and leave the board unchanged
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
      [[2,7],[3,7],[4,7],[5,7],[6,7]].forEach(([x,y]) => state.board[R.key(x,y)] = R.BLACK);
      state.history = [{ board: Array.from(state.board), turn: R.BLACK, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    Then JavaScript expression "RenjuRules.forbiddenReason(RenjuApp.state.board, 7, 7) === 'overline'" returns true
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Forbidden for black: overline."
    And JavaScript expression "RenjuApp.state.board[RenjuRules.key(7, 7)] === RenjuRules.EMPTY" returns true

  Scenario: Reject a black double-four and leave the board unchanged
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
      [[5,7],[6,7],[8,7],[7,5],[7,6],[7,8]].forEach(([x,y]) => state.board[R.key(x,y)] = R.BLACK);
      state.history = [{ board: Array.from(state.board), turn: R.BLACK, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    Then JavaScript expression "RenjuRules.forbiddenReason(RenjuApp.state.board, 7, 7) === 'double-four'" returns true
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Forbidden for black: double-four."
    And JavaScript expression "RenjuApp.state.board[RenjuRules.key(7, 7)] === RenjuRules.EMPTY" returns true

  Scenario: Visualize and reject a black double-three
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
    Then JavaScript expression "RenjuRules.forbiddenReason(RenjuApp.state.board, 7, 7) === 'double-three'" returns true
    When I remember the pixel checksum of CSS canvas "#board"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    And the pixel checksum of CSS canvas "#board" is different
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Forbidden for black: double-three."
    And JavaScript expression "RenjuApp.state.board[RenjuRules.key(7, 7)] === RenjuRules.EMPTY" returns true

  Scenario: Allow an exact black five and lock the finished game
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
      [[3,7],[4,7],[5,7],[6,7]].forEach(([x,y]) => state.board[R.key(x,y)] = R.BLACK);
      state.history = [{ board: Array.from(state.board), turn: R.BLACK, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    Then JavaScript expression "RenjuRules.forbiddenReason(RenjuApp.state.board, 7, 7) === null" returns true
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Black wins with five."
    And JavaScript expression "RenjuApp.state.over === true && RenjuApp.state.board[RenjuRules.key(7, 7)] === RenjuRules.BLACK" returns true
    When I remember JavaScript expression "Array.from(RenjuApp.state.board)" as "finished board"
    And I click CSS canvas "#board" at column 1 row 1 of a 15 by 15 board
    Then JavaScript expression "Array.from(RenjuApp.state.board)" equals remembered value "finished board"

  Scenario: Allow white to win with an overline
    When I execute JavaScript:
      """
      const R = RenjuRules;
      const state = RenjuApp.state;
      state.workers.forEach((worker) => worker.terminate());
      state.workers = [];
      state.thinking = false;
      state.over = false;
      state.human = R.WHITE;
      state.turn = R.WHITE;
      state.board.fill(R.EMPTY);
      [[2,7],[3,7],[4,7],[5,7],[6,7]].forEach(([x,y]) => state.board[R.key(x,y)] = R.WHITE);
      state.history = [{ board: Array.from(state.board), turn: R.WHITE, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "White wins with five."
    And JavaScript expression "RenjuApp.state.over === true && RenjuApp.state.board[RenjuRules.key(7, 7)] === RenjuRules.WHITE" returns true

  Scenario: Declare a draw when the final legal move fills the board
    When I execute JavaScript:
      """
      const R = RenjuRules;
      const state = RenjuApp.state;
      state.workers.forEach((worker) => worker.terminate());
      state.workers = [];
      state.thinking = false;
      state.over = false;
      state.human = R.WHITE;
      state.turn = R.WHITE;
      for (let y = 0; y < R.SIZE; y += 1) {
        for (let x = 0; x < R.SIZE; x += 1) state.board[R.key(x, y)] = (x + y) % 2 ? R.BLACK : R.WHITE;
      }
      state.board[R.key(7, 7)] = R.EMPTY;
      [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].forEach(([dx,dy]) => {
        state.board[R.key(7 + dx, 7 + dy)] = R.BLACK;
      });
      state.history = [{ board: Array.from(state.board), turn: R.WHITE, move: null }];
      state.replayIndex = 0;
      state.candidates = [];
      RenjuApp.draw();
      """
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#status" contains text "Draw: the board is full."
    And JavaScript expression "RenjuApp.state.over === true && !RenjuApp.state.board.includes(RenjuRules.EMPTY)" returns true

  Scenario: Reload cancels work and restores non-persistent defaults
    When I choose value "2" in CSS "#humanColor"
    And I replace CSS "#depth" with "6"
    And I replace CSS "#timeLimit" with "30"
    And I set CSS checkbox "#cheat" to checked
    And I click CSS "#newGame"
    And I reload the web page
    Then CSS "#humanColor" has value "1"
    And CSS "#depth" has value "3"
    And CSS "#timeLimit" has value "8"
    And CSS checkbox "#cheat" is unchecked
    And CSS "#turnLabel" contains text "Black / You"
    And CSS "#searchState" contains text "Idle"
    And CSS "#candidateCount" contains text "0 evaluated"
    And JavaScript expression "RenjuApp.state.thinking === false && RenjuApp.state.workers.length === 0 && RenjuApp.state.history.length === 1" returns true
    And JavaScript expression "localStorage.length === 0 && sessionStorage.length === 0" returns true
