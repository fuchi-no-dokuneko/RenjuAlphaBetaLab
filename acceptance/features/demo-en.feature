@demo @english @web
Feature: English key-feature demonstration of Renju Alpha-Beta Lab

  Scenario: Play against parallel search and inspect candidate scores
    Given I begin a recorded demo
    And I open the web application at path "/"
    When I narrate in "en-US" for at least 8 seconds:
      """
      Renju Alpha-Beta Lab presents a fifteen by fifteen board. Columns use A through P while skipping I, and rows use one through fifteen around the board edge.
      """
    And I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    When I narrate in "en-US" for at least 10 seconds:
      """
      After the move, parallel workers evaluate legal root candidates. The analysis panel ranks moves and scores, while colored score markers on the board distinguish lower, middle, and higher candidate values.
      """
    And I click CSS "#undo"
    Then CSS "#status" eventually contains text "Last round removed."
    When I narrate in "en-US" for at least 5 seconds:
      """
      Undo round removes both sides of the last completed round and resets the analysis panel.
      """
    Then I finish the recorded demo
