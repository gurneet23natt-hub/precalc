# Precalc Practice Room

A practice site for AP Precalculus, covering Units 1–3 (the units on the AP exam). Open `index.html` in a browser; there is no build step.

- Over 1,200 multiple-choice questions covering every topic in the AP course framework (1.1–3.15): 69 hand-written,
  the rest generated from question templates with a fixed seed, so the bank is the same on every visit
- **Hint: step by step**: every question breaks into guided steps. Students type each step's answer (checked for
  mathematical equivalence, so `x+4` and `4+x` both count) or pick from options, with hints and a reveal after wrong tries
- **Topics**: check topics to focus on them, or lock topics to leave them out until unlocked
- Filters for unit, calculator vs. no-calculator, and set length
- Sign-up / log-in screen (first name, last name, email, password). Accounts are stored in the browser with
  salted PBKDF2 password hashes; there is no server, so accounts don't sync across devices
- Progress per account with a Mastery / Accuracy toggle, and a downloadable .txt progress report
- A class board where students post progress. It only appears when the page runs as a shared Claude artifact.

## Files

- `index.html`: layout and styles
- `questions.js`: units, AP topic list, and the hand-written questions. The format is documented at the top of the file.
- `generators.js`: question templates that generate the rest of the bank
- `app.js`: quiz logic, the step checker, topic focus/lock, and sharing

## Hosting with a custom domain (GitHub Pages)

1. In the repo on GitHub: **Settings → Pages**, set Source to “Deploy from a branch”, pick your branch and `/ (root)`.
2. In the same page, enter your domain under **Custom domain** (GitHub adds a `CNAME` file).
3. At your domain registrar, add DNS records:
   - subdomain such as `practice.example.com`: a `CNAME` record pointing to `<your-github-username>.github.io`
   - apex domain such as `example.com`: `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. After DNS updates, tick **Enforce HTTPS**.
