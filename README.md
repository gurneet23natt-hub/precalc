# Precalc Practice Room

A practice site for AP Precalculus, covering Units 1–3 (the units on the AP exam). Open `index.html` in a browser; there is no build step.

- Over 1,200 multiple-choice questions covering every topic in the AP course framework (1.1–3.15): 69 hand-written,
  the rest generated from question templates with a fixed seed, so the bank is the same on every visit
- **Hint: step by step**: every question breaks into guided steps. Students type each step's answer (checked for
  mathematical equivalence, so `x+4` and `4+x` both count) or pick from options, with hints and a reveal after wrong tries
- **Topics**: check topics to focus on them, or lock topics to leave them out until unlocked
- Filters for unit, calculator vs. no-calculator, and set length
- Sign-up / log-in screen (first name, last name, email, password). With Firebase set up (below), accounts and
  progress work on any device and students can reset forgotten passwords. Without it, accounts are stored in the
  browser only, with salted PBKDF2 password hashes
- Progress per account with a Mastery / Accuracy toggle, and a downloadable .txt progress report
- A class board where students post progress. It only appears when the page runs as a shared Claude artifact.

## Files

- `index.html`: layout and styles
- `questions.js`: units, AP topic list, and the hand-written questions. The format is documented at the top of the file.
- `generators.js`: question templates that generate the rest of the bank
- `app.js`: quiz logic, the step checker, topic focus/lock, accounts, and sharing
- `firebase-config.js`: Firebase settings for cross-device accounts (`null` = browser-only accounts)
- `firestore.rules`: database rules that keep each student's data private

## Hosting with a custom domain (GitHub Pages)

1. In the repo on GitHub: **Settings → Pages**, set Source to “Deploy from a branch”, pick your branch and `/ (root)`.
2. In the same page, enter your domain under **Custom domain** (GitHub adds a `CNAME` file).
3. At your domain registrar, add DNS records:
   - subdomain such as `practice.example.com`: a `CNAME` record pointing to `<your-github-username>.github.io`
   - apex domain such as `example.com`: `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. After DNS updates, tick **Enforce HTTPS**.

## Accounts on any device (Firebase)

1. Go to https://console.firebase.google.com, click **Create a project**, and follow the prompts (Google Analytics is optional).
2. **Build → Authentication → Get started → Sign-in method**: enable **Email/Password**.
3. **Build → Firestore Database → Create database**: pick a location, start in **production mode**.
   Then open the **Rules** tab, replace everything with the contents of `firestore.rules`, and click **Publish**.
4. **Project settings** (gear icon) **→ Your apps → Web (`</>`)**: register an app (no hosting needed).
   Copy the `firebaseConfig` object it shows.
5. In `firebase-config.js`, replace `null` with that object and commit.
6. **Authentication → Settings → Authorized domains**: add `aprecalc.com` and `gurneet23natt-hub.github.io`.

Students who already made a browser-only account should sign up again with the same email; their progress on that
device carries over automatically the first time they log in.
