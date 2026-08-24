@demo @english @web
Feature: English product introduction to Renju Alpha-Beta Lab

  Scenario: Play a round inspect search scores and review the position
    Given I begin a recorded demo
    And I open the web application at path "/"
    When I narrate in "en-US" for at least 9 seconds:
      """
      Renju Alpha-Beta Lab is a fifteen-by-fifteen game against parallel alpha-beta search. Board columns run from A to P while skipping I, rows run from one to fifteen, and black's overline, double-four, and double-three restrictions are enforced.
      """
    And I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    And CSS "#pv" contains text "B "
    When I narrate in "en-US" for at least 10 seconds:
      """
      After your move, browser workers divide the legal root moves. The analysis panel ranks candidate scores, counts searched nodes, and shows the principal variation. Colored board markers compare low, middle, and high candidate values.
      """
    And I click CSS "#replayBack"
    Then CSS "#replayLabel" contains text "Move 1 of 2"
    When I narrate in "en-US" for at least 7 seconds:
      """
      Previous and next let you inspect recorded positions without changing the live game. Live returns to the current board, and Undo round removes both completed moves together.
      """
    And I click CSS "#live"
    And I click CSS "#undo"
    Then CSS "#status" contains text "Last round removed."
    And JavaScript expression "RenjuApp.state.history.length === 1" returns true
    Then I finish the recorded demo
