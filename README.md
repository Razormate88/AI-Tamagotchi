# AI-Tamagotchi

A shared digital creature built by two friends learning code, GitHub, and AI-assisted development.

## Creature v0

The first version is intentionally simple: plain HTML, CSS, and JavaScript.

Gloop currently has:

- Hunger
- Happiness
- Energy
- Mood-based faces
- Random dialogue
- Feed, Pet, Poke, Scream, and Sleep actions
- Browser persistence with `localStorage`
- Slowly changing stats while the page is open

No framework. No database. No AI API yet.

That is intentional. The goal is to make the basic game understandable enough that either person can open a file, change something, refresh the browser, and immediately see what happened.

## Run it

You can simply open `index.html` in a browser.

For a nicer local development setup, use a tiny local server such as VS Code Live Server or:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Suggested Git workflow

Do not both edit `main` directly.

Instead:

```bash
git checkout main
git pull
git checkout -b feature/my-ridiculous-idea
```

Make your change, then:

```bash
git add <the-files-you-changed>
git commit -m "feat: describe the ridiculous thing"
git push -u origin feature/my-ridiculous-idea
```

Open a pull request and make the other person review it.

## Excellent next features

Pick one feature per branch:

- `feature/tiny-hats`
- `feature/creature-farts`
- `feature/name-your-creature`
- `feature/achievements`
- `feature/mood-system`
- `feature/secret-buttons`
- `feature/weather`
- `feature/creature-memory`
- `feature/sound-effects`
- `feature/nightmare-mode`
- `feature/github-commit-reactions`
- `feature/ai-dialogue`

## Rule of the project

If an idea sounds funny but you do not know how to build it, that means it is probably a good feature.

Figure out the smallest working version, ask AI for help, make it work, then make it ridiculous.
