# Local Gherkin pipelines

This repository has three executable Cucumber-based pipelines:

- `run-uat.sh` performs the daily black-box acceptance checklist.
- `run-demo-en.sh` records the key-feature walkthrough with English narration cues.
- `run-demo-yue.sh` records the same walkthrough with Traditional Chinese Cantonese narration cues.

Only `uat.feature` is a test suite. The two demo feature files are timed recording scripts; they are not coverage, are not submitted to SonarQube, and must not be used to decide whether the product passed acceptance.

Nothing in these pipelines calls GitHub. Browser scenarios use Selenium with a real Chrome session. Android repositories use the selected ADB device and UIAutomator-visible controls.

## Setup and execution

```bash
sh acceptance/bootstrap.sh
acceptance/run-uat.sh
acceptance/run-demo-en.sh
acceptance/run-demo-yue.sh
```

Node.js 20 or newer is required. Use `--headless` only when a visible browser is unnecessary. Override a deployed web target with `--base-url http://127.0.0.1:8080/`. Validate Gherkin and step bindings without opening an app with `--dry-run`.

Use `--tags` to run a focused slice, for example `acceptance/run-uat.sh --tags "not @requires-youtube-api"`. A normal daily run omits this option and executes every main UAT scenario, including explicitly tagged credential or device-integration checks.

The runner uses `/usr/bin/chromedriver` when present, avoiding network-based driver discovery. The driver selects its matching browser; set `CHROMEDRIVER_PATH` or `CHROME_BINARY` only when local binaries live elsewhere. Application and configured API hosts are resolved with DNS A records and pinned to IPv4 in Chromium.

## Coverage boundaries

A complete daily result requires every main UAT scenario to execute. A dry run proves only that Gherkin parses and every step has an implementation; it is not a product pass.

- `@requires-youtube-api` needs live credentials and a reachable YouTube API. Excluding it produces a useful local result, but not complete acceptance.
- `@android` needs one authorized ADB device. `@requires-system-picker` also exercises the device's document picker rather than a mocked replacement.
- `@creates-temporary-*` scenarios create isolated test data or media and include cleanup or state restoration steps. Do not point them at irreplaceable production data.
- Browser UAT covers observable end-to-end workflows and failure states. Exhaustive input combinations, statistical correctness, and low-level algorithm invariants belong in unit or instrumentation tests.

## Feature-to-scenario coverage

| Product surface | Daily UAT scenarios | Expected contract |
| --- | --- | --- |
| Defaults, coordinates, board | Open a clean coordinate-labelled 15 by 15 game | The board, A-H/J-P and 1-15 coordinate model, controls, metrics, replay state, and no-op undo initialize cleanly. |
| Human turn and parallel AI | Play as black and inspect complete parallel search analysis | A legal move transitions through worker search to ranked candidates, nodes, full progress, principal variation, occupied-point rejection, and round undo. |
| Score visualization | Show and hide ranked candidate colors on the live board | The checkbox controls the legend and canvas overlay; candidate colors and compact labels represent relative scores. |
| Player color and replay | Let the AI open as black and navigate replay history | White selection takes effect on New game; AI opens, replay is read-only, Previous/Next/Live navigate, and undo restores the prior round. |
| Search cancellation | Cancel an active deep search with a new game | While thinking, extra board input is ignored; New game terminates workers and clears board and analysis state. |
| Black overline | Reject a black overline and leave the board unchanged | The forbidden move reports `overline` and is not placed. |
| Black double-four | Reject a black double-four and leave the board unchanged | The forbidden move reports `double-four` and is not placed. |
| Black double-three and overlay | Visualize and reject a black double-three | The overlay marks forbidden points and the attempted move reports `double-three` without changing the board. |
| Black exact-five win | Allow an exact black five and lock the finished game | Exact five is legal for black, declares a win, and blocks later board input. |
| White overline win | Allow white to win with an overline | Five or more is legal for white and declares a win. |
| Full-board draw | Declare a draw when the final legal move fills the board | A non-winning final move fills the board, declares a draw, and ends input. |
| Session recovery | Reload cancels work and restores non-persistent defaults | Reload terminates active work and restores default color, limits, visualization, board, analysis, and storage state. |

Every scenario receives a new Chromium session and the `After` hook closes it, including worker and browser cleanup after failures.

## Daily result and SonarQube

Every real run writes these local files under `build/reports/acceptance/<suite>/`:

- `checklist.json` contains one boolean for the run, each scenario, and each step.
- `sonar-test-execution.xml` uses Sonar's generic test execution format.
- `summary.md`, `cucumber.json`, screenshots, and downloaded evidence support diagnosis.

The laptop should invoke the scanner after UAT rather than calling a test-result HTTP API:

```bash
SONAR_TOKEN=... SONAR_SCANNER_BIN=sonar-scanner acceptance/run-uat.sh --sonar
```

CI-based analysis must be selected in SonarQube Cloud and automatic analysis must be disabled before using `--sonar`. The token stays on the executing laptop.

## Narration and recording contract

Demo narration always waits until the local TTS command finishes and then waits any remaining minimum duration declared by the Gherkin step. Configure executable wrapper paths; each wrapper receives its parameters through environment variables:

- `DEMO_TTS_COMMAND`: receives `DEMO_TTS_LANGUAGE`, `DEMO_TTS_TEXT`, and `DEMO_TTS_MIN_SECONDS`.
- `DEMO_RECORD_START_COMMAND`: starts local screen recording and returns immediately.
- `DEMO_RECORD_STOP_COMMAND`: stops and finalizes the recording.

When no wrappers are configured, narration is printed and timed, while recording hooks are no-ops. MP4 storage and publishing remain the local agent's responsibility.
