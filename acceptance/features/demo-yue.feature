@demo @cantonese @web
Feature: Renju Alpha-Beta Lab 粵語產品介紹

  Scenario: 對弈一輪、查看搜尋分數並重溫局面
    Given I begin a recorded demo
    And I open the web application at path "/"
    When I narrate in "yue-HK" for at least 9 seconds:
      """
      Renju Alpha-Beta Lab 係一個十五乘十五嘅連珠對弈實驗室，對手係平行 Alpha-Beta 搜尋。直行由 A 到 P 但跳過 I，橫行由一到十五，黑棋長連、四四同三三禁手都會執行。
      """
    And I replace CSS "#depth" with "1"
    And I replace CSS "#timeLimit" with "1"
    And I set CSS checkbox "#cheat" to checked
    Then CSS "#scoreLegend" is visible
    When I click CSS canvas "#board" at column 8 row 8 of a 15 by 15 board
    Then CSS "#searchState" eventually contains text "Complete"
    And at least 2 elements match CSS "#candidates .candidate"
    And CSS "#pv" contains text "B "
    When I narrate in "yue-HK" for at least 10 seconds:
      """
      你落子之後，瀏覽器工作程序會分批搜尋合法候選步。分析區會排列分數、統計節點同顯示主要變化；棋盤顏色就會比較低、中、高分候選點。
      """
    And I click CSS "#replayBack"
    Then CSS "#replayLabel" contains text "Move 1 of 2"
    When I narrate in "yue-HK" for at least 7 seconds:
      """
      上一步同下一步可以重溫記錄局面，又唔會改動實際棋局。撳 Live 會返去最新位置，而撤銷一輪就會一齊移除雙方上一輪棋子。
      """
    And I click CSS "#live"
    And I click CSS "#undo"
    Then CSS "#status" contains text "Last round removed."
    And JavaScript expression "RenjuApp.state.history.length === 1" returns true
    Then I finish the recorded demo
