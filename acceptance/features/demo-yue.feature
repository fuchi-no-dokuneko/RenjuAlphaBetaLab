@demo @cantonese @web
Feature: Renju Alpha-Beta Lab 粵語主要功能示範

  Scenario: 同平行搜尋對弈並查看候選分數
    Given I begin a recorded demo
    And I open the web application at path "/"
    When I narrate in "yue-HK" for at least 8 seconds:
      """
      Renju Alpha-Beta Lab 用十五乘十五棋盤。直行標記由 A 去到 P，但會跳過 I；橫行就由一至十五，座標會畫喺棋盤四邊。
      """
    And I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    When I narrate in "yue-HK" for at least 10 seconds:
      """
      落子之後，多個背景工作程序會平行評估合法候選步。分析區會排列步法同分數，而棋盤上唔同深淺嘅顏色會分辨較低、中等同較高分候選點。
      """
    And I click CSS "#undo"
    Then CSS "#status" eventually contains text "Last round removed."
    When I narrate in "yue-HK" for at least 5 seconds:
      """
      撤銷一局會移除上一輪雙方嘅棋子，並且清空分析結果。
      """
    Then I finish the recorded demo
