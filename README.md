# Precalc Practice Room

A single-page practice site for AP Precalculus. Open `index.html` in any browser; there is no build step.

- 66 multiple-choice questions across Units 1–4, each with a worked explanation
- Filter by unit, calculator vs. no-calculator, and set length (10, 20, or all)
- Instant feedback, end-of-set summary, and a "retry missed" round
- Per-unit progress saved in the browser (localStorage)
- Keyboard: A–D to answer, Enter for the next question

## Adding questions

Questions live in the `BANK` array near the bottom of `index.html`. Each entry has a unit (`u`), topic (`t`),
`calc` flag, prompt (`q`), four choices (`c`, **correct answer first**; order is shuffled on screen), and an explanation (`e`).
