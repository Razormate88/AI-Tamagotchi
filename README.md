# AI-Tamagotchi // CHAOS EDITION

Gloop started as a tiny shared browser pet.

That situation has deteriorated.

## What is in this build

This is still intentionally **plain HTML, CSS, and JavaScript**. No framework and no build step.

But Gloop now has:

- Cinematic fake BIOS boot sequence
- Hunger, happiness, energy, chaos, XP, and levels
- Multiple evolution forms
- Browser persistence with `localStorage`
- Session counter
- Mood-based faces
- Random contextual dialogue
- Hats
- Mutations
- Unauthorized clones
- A summonable void
- Reality breaches
- Quantum snacks with randomized outcomes
- Ascension mode
- Web Audio sound effects
- Optional browser text-to-speech voice
- Random world events
- Achievement system
- Event log
- Background particles
- Screen shake / burst effects
- A forbidden terminal
- Secret keyboard behavior
- Basic mobile responsiveness
- `prefers-reduced-motion` support

## Run it

Open `index.html` directly, or use a local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Things to try immediately

1. Click **MUTATE** several times.
2. Click **CLONE** repeatedly.
3. Click **SUMMON VOID**.
4. Click **REALITY BREACH**.
5. Turn **VOICE** on and press **SCREAM**.
6. Open the **FORBIDDEN TERMINAL**.
7. In the terminal, type:

```text
help
```

8. Outside the terminal, simply type:

```text
gloop
```

No text box required.

## Project rule

Do not ask:

> "Do we know how to build this?"

Ask:

> "What is the smallest version of this stupid idea that would actually work?"

Then build that.

## Next cursed feature branches

- `feature/gloop-remembers-your-name`
- `feature/weather-affects-gloop`
- `feature/github-commit-reactions`
- `feature/fake-stock-market`
- `feature/gloop-cult`
- `feature/creature-dna`
- `feature/minigames`
- `feature/boss-fight`
- `feature/shared-online-state`
- `feature/real-ai-dialogue`
- `feature/gloop-dreams`
- `feature/desktop-notifications`
- `feature/gloop-website-takeover`

## Recommended Git workflow

```bash
git checkout main
git pull
git checkout -b feature/my-terrible-idea
```

Make the ridiculous thing work, then:

```bash
git add <files-you-changed>
git commit -m "feat: add terrible idea"
git push -u origin feature/my-terrible-idea
```

Open a pull request and make the other person review it.

The goal is not clean perfection.

The goal is to keep making Gloop more alarming while learning how the code works.
