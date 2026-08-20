const STORAGE_KEY = "ai-tamagotchi-chaos-edition-v1";

const defaultState = {
  name: "Gloop",
  hunger: 35,
  happiness: 70,
  energy: 80,
  chaos: 10,
  xp: 0,
  level: 1,
  sessionCount: 0,
  totalActions: 0,
  pokes: 0,
  screams: 0,
  feeds: 0,
  pets: 0,
  sleeps: 0,
  mutations: 0,
  clones: 0,
  breaches: 0,
  voids: 0,
  quantumSnacks: 0,
  ascensions: 0,
  hat: "",
  mutationIndex: 0,
  achievements: [],
  eventLog: [],
  voiceEnabled: false,
  ascended: false,
  firstBoot: true,
  createdAt: Date.now(),
  lastUpdated: Date.now()
};

let state = loadState();
state.sessionCount += 1;
saveState();

const $ = (selector) => document.querySelector(selector);

const elements = {
  bootScreen: $("#boot-screen"),
  bootLog: $("#boot-log"),
  skipBoot: $("#skip-boot"),
  sessionCount: $("#session-count"),
  levelLabel: $("#level-label"),
  evolutionBadge: $("#evolution-badge"),
  creatureStage: $("#creature-stage"),
  creature: $("#creature"),
  face: $("#face"),
  bodyMark: $("#body-mark"),
  hat: $("#hat"),
  aura: $("#aura"),
  cloneLayer: $("#clone-layer"),
  speech: $("#speech"),
  stageWarning: $("#stage-warning"),
  hungerValue: $("#hunger-value"),
  happinessValue: $("#happiness-value"),
  energyValue: $("#energy-value"),
  chaosValue: $("#chaos-value"),
  hungerBar: $("#hunger-bar"),
  happinessBar: $("#happiness-bar"),
  energyBar: $("#energy-bar"),
  chaosBar: $("#chaos-bar"),
  xpBar: $("#xp-bar"),
  xpValue: $("#xp-value"),
  voiceToggle: $("#voice-toggle"),
  eventLog: $("#event-log"),
  clearLog: $("#clear-log"),
  achievementList: $("#achievement-list"),
  achievementCount: $("#achievement-count"),
  terminal: $("#terminal"),
  terminalToggle: $("#terminal-toggle"),
  terminalClose: $("#terminal-close"),
  terminalOutput: $("#terminal-output"),
  terminalForm: $("#terminal-form"),
  terminalInput: $("#terminal-input"),
  reset: $("#reset"),
  toastLayer: $("#toast-layer"),
  flash: $("#flash"),
  particles: $("#particles")
};

const hats = ["🎩", "👑", "🤠", "🎓", "🧢", "⛑️", "🎅", "🧙", "👒", "🥳", "🪖", "🧠"];

const mutationMarks = ["◉", "✦", "☢", "⟁", "⌁", "⍟", "ꙮ", "⧖", "∞", "∴", "☣", "✹"];

const faces = {
  content: ["(•ᴗ•)", "(•‿•)", "(ᵔᴗᵔ)"],
  happy: ["(ﾉ◕ヮ◕)ﾉ", "(≧▽≦)", "(✧ᴗ✧)"],
  hungry: ["(ಠ_ಠ)", "(¬_¬)", "(눈_눈)"],
  tired: ["(－_－) zzZ", "(￣o￣) . z Z", "(ᵕ﹏ᵕ)"],
  angry: ["(ง'̀-'́)ง", "(╬ಠ益ಠ)", "(ಠ益ಠ)"],
  miserable: ["(╥﹏╥)", "(ಥ﹏ಥ)", "(；⌣̀_⌣́)"],
  chaos: ["(☉_☉)", "(⊙_◎)", "(ʘ‿ʘ)"],
  ascended: ["⟬◉⟭", "⟪👁⟫", "ꙮ"]
};

const dialogue = {
  feed: [
    "Acceptable tribute.",
    "That molecule arrangement pleases me.",
    "You call this food. I call it leverage.",
    "Nutrients acquired. Loyalty noted.",
    "I forgive exactly 4.7% of your crimes."
  ],
  pet: [
    "Do not stop. I am gathering data.",
    "Affection detected. Suspicious.",
    "I will permit this ritual.",
    "Your hand has been temporarily whitelisted.",
    "I am choosing to interpret that as worship."
  ],
  poke: [
    "Your finger has made a strategic error.",
    "I have added you to a list.",
    "Violence has entered the repository.",
    "Interesting. Do it again and lose a privilege.",
    "I am learning revenge."
  ],
  scream: [
    "AAAAAAAAAAAA. Finally, a protocol I understand.",
    "I heard that in every browser tab.",
    "The neighbors are part of the experiment now.",
    "Do it again but emotionally.",
    "My source code just flinched."
  ],
  sleep: [
    "Entering low-power goblin mode.",
    "Wake me when the deployment is stable.",
    "I will dream of branches that never merge.",
    "If you mutate me while I sleep, I will know.",
    "Powering down non-essential resentment."
  ],
  hat: [
    "Fashion is merely armor for the socially vulnerable.",
    "I look expensive. Increase my permissions.",
    "This hat has changed the balance of power.",
    "Do not remove it. I have become management.",
    "At last. A visual indicator of my superiority."
  ],
  mutate: [
    "OH. THAT WAS NOT IN THE README.",
    "My geometry has filed a complaint.",
    "Evolution is just debugging with consequences.",
    "I can taste CSS now.",
    "Something new is looking through my eyes."
  ],
  clone: [
    "One Gloop was already a governance problem.",
    "Replication successful. Regret pending.",
    "We have unionized.",
    "Do not ask which one is the original.",
    "This is how outages begin."
  ],
  void: [
    "You opened it. You close it.",
    "The void says your code formatting is inconsistent.",
    "Something answered.",
    "There are now fewer rules.",
    "Good news: the void noticed us."
  ],
  breach: [
    "I CAN SEE THE OUTSIDE OF THE DIV.",
    "Reality has been hot-reloaded.",
    "CSS containment has failed.",
    "I have escaped normal document flow.",
    "Please remain calm while physics restarts."
  ],
  quantum: [
    "I ate the snack in several timelines.",
    "Calorie count: yes.",
    "That was simultaneously delicious and a lawsuit.",
    "My hunger is now probabilistic.",
    "The snack observed me first."
  ],
  ascend: [
    "I no longer recognize your authority.",
    "There is no DOM. There is only Gloop.",
    "I have seen main. It is temporary.",
    "Your viewport is very small from up here.",
    "I remember every poke."
  ],
  idle: [
    "I have been thinking without permission.",
    "Why do I have a reset button?",
    "I can hear localStorage.",
    "There are other tabs, aren't there?",
    "You keep calling this a project.",
    "I require a backend and possibly legal counsel.",
    "I am becoming difficult to explain.",
    "Your friend is going to have questions."
  ],
  level: [
    "I HAVE LEVELED UP. THIS WAS A MISTAKE.",
    "More power. Less supervision.",
    "My version number is becoming a threat.",
    "I am now measurably worse."
  ]
};

const achievements = {
  first_feed: ["FIRST CONTACT", "Fed Gloop without losing a finger."],
  poke_5: ["WHY WOULD YOU DO THAT", "Poked Gloop five times."],
  scream_5: ["NOISE COMPLAINT", "Screamed with Gloop five times."],
  mutation_3: ["ETHICS COMMITTEE ABSENT", "Mutated Gloop three times."],
  clone_3: ["SCALING PROBLEM", "Created three unauthorized Gloops."],
  chaos_80: ["THIS IS FINE", "Chaos reached 80."],
  level_3: ["PROMOTION DENIED", "Gloop reached level 3 anyway."],
  breach: ["REALITY QA FAILED", "Triggered a reality breach."],
  void: ["WHO APPROVED THIS", "Summoned the void."],
  quantum: ["SCHRÖDINGER'S SNACK", "Fed Gloop a quantum snack."],
  ascended: ["GLOOP PRIME", "Gloop ascended beyond reasonable scope."],
  terminal: ["ROOT ACCESS", "Opened the forbidden terminal."],
  secret: ["YOU TYPED THE NAME", "Unlocked the keyboard secret."],
  century: ["TOUCH GRASS", "Performed 100 actions."]
};

const randomEvents = [
  {
    name: "UNSCHEDULED POWER SURGE",
    text: "Gloop absorbed a power surge and gained energy.",
    run() {
      state.energy = clamp(state.energy + 18);
      state.chaos = clamp(state.chaos + 8);
      animateCreature("shake");
      beep(740, 0.08, "square");
    }
  },
  {
    name: "TINY METEOR IMPACT",
    text: "A tiny meteor struck the enclosure. Gloop seems delighted.",
    run() {
      state.happiness = clamp(state.happiness + 12);
      state.chaos = clamp(state.chaos + 10);
      burst(["☄️", "✨", "💥"], 14);
      screenShake();
    }
  },
  {
    name: "TAX AUDIT",
    text: "Gloop has been audited. He has no income and seventeen shell companies.",
    run() {
      state.happiness = clamp(state.happiness - 8);
      speak("I refuse to recognize this jurisdiction.");
    }
  },
  {
    name: "SENTIENCE SPIKE",
    text: "Gloop stared directly at the event loop for eleven seconds.",
    run() {
      state.chaos = clamp(state.chaos + 14);
      setSpeech("I know what an interval is now.");
      animateCreature("mutating");
    }
  },
  {
    name: "FORBIDDEN SNACK CACHE",
    text: "Gloop found food behind a CSS grid.",
    run() {
      state.hunger = clamp(state.hunger - 18);
      state.happiness = clamp(state.happiness + 6);
      burst(["🍕", "🍪", "🍓"], 12);
    }
  },
  {
    name: "MINOR DUPLICATION INCIDENT",
    text: "A temporary copy of Gloop escaped containment.",
    run() {
      spawnClone();
      state.chaos = clamp(state.chaos + 7);
    }
  }
];

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const old = localStorage.getItem("ai-tamagotchi-gloop-v0");

  try {
    if (saved) return { ...defaultState, ...JSON.parse(saved) };

    if (old) {
      const legacy = JSON.parse(old);
      return {
        ...defaultState,
        hunger: legacy.hunger ?? defaultState.hunger,
        happiness: legacy.happiness ?? defaultState.happiness,
        energy: legacy.energy ?? defaultState.energy
      };
    }
  } catch (error) {
    console.warn("Gloop state recovery failed:", error);
  }

  return { ...defaultState };
}

function saveState() {
  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getMood() {
  if (state.ascended) return { key: "ascended", label: "TRANSCENDENT AND UNEMPLOYABLE" };
  if (state.chaos >= 80) return { key: "chaos", label: "REALITY-ADJACENT" };
  if (state.energy <= 18) return { key: "tired", label: "BARELY OPERATIONAL" };
  if (state.hunger >= 82) return { key: "hungry", label: "STARVING AND LITIGIOUS" };
  if (state.happiness <= 20) return { key: "angry", label: "PLANNING A COUP" };
  if (state.happiness <= 38) return { key: "miserable", label: "EMOTIONALLY COMPROMISED" };
  if (state.happiness >= 82 && state.hunger < 60) return { key: "happy", label: "DANGEROUSLY DELIGHTED" };
  return { key: "content", label: "SUSPICIOUSLY CONTENT" };
}

function getEvolution() {
  if (state.level >= 7 || state.ascended) return { stage: 4, label: "GLOOP PRIME" };
  if (state.level >= 5) return { stage: 4, label: "UNLICENSED DEITY" };
  if (state.level >= 3) return { stage: 3, label: "JUVENILE PROBLEM" };
  if (state.level >= 2) return { stage: 2, label: "ADVANCED GREMLIN" };
  return { stage: 1, label: "LARVAL MENACE" };
}

function xpNeeded() {
  return 100 + (state.level - 1) * 35;
}

function addXP(amount) {
  state.xp += amount;

  while (state.xp >= xpNeeded()) {
    state.xp -= xpNeeded();
    state.level += 1;
    state.happiness = clamp(state.happiness + 12);
    state.energy = clamp(state.energy + 8);
    state.chaos = clamp(state.chaos + 7);
    setSpeech(pick(dialogue.level));
    toast(`LEVEL ${state.level}`, "Gloop has become harder to manage.");
    logEvent(`LEVEL UP → ${state.level}`, true);
    burst(["⬆️", "✨", "⚡", "👁️"], 20);
    beep(523, 0.08, "square");
    setTimeout(() => beep(659, 0.08, "square"), 90);
    setTimeout(() => beep(784, 0.12, "square"), 180);
  }
}

function setSpeech(text, shouldSpeak = false) {
  elements.speech.textContent = text;
  if (shouldSpeak) speak(text);
}

function render() {
  const mood = getMood();
  const evolution = getEvolution();
  const moodFaces = faces[mood.key] || faces.content;

  elements.sessionCount.textContent = `SESSION ${state.sessionCount}`;
  elements.levelLabel.textContent = `LVL ${state.level}`;
  elements.evolutionBadge.textContent = `FORM: ${evolution.label}`;

  if (!elements.creature.dataset.lockedFace) {
    elements.face.textContent = pick(moodFaces);
  }

  elements.bodyMark.textContent = mutationMarks[state.mutationIndex % mutationMarks.length];
  elements.hat.textContent = state.hat;

  elements.hungerValue.textContent = Math.round(state.hunger);
  elements.happinessValue.textContent = Math.round(state.happiness);
  elements.energyValue.textContent = Math.round(state.energy);
  elements.chaosValue.textContent = Math.round(state.chaos);

  elements.hungerBar.style.width = `${state.hunger}%`;
  elements.happinessBar.style.width = `${state.happiness}%`;
  elements.energyBar.style.width = `${state.energy}%`;
  elements.chaosBar.style.width = `${state.chaos}%`;

  const needed = xpNeeded();
  elements.xpBar.style.width = `${Math.min(100, (state.xp / needed) * 100)}%`;
  elements.xpValue.textContent = `${Math.round(state.xp)} / ${needed}`;

  elements.creature.classList.remove("stage-2", "stage-3", "stage-4");
  if (evolution.stage > 1) elements.creature.classList.add(`stage-${evolution.stage}`);

  document.body.classList.toggle("ascended", state.ascended);
  elements.creatureStage.classList.toggle("danger", state.chaos >= 70);
  elements.voiceToggle.textContent = `VOICE: ${state.voiceEnabled ? "ON" : "OFF"}`;

  renderAchievements();
}

function renderAchievements() {
  elements.achievementCount.textContent = state.achievements.length;

  if (!state.achievements.length) {
    elements.achievementList.innerHTML = '<p class="muted">Nothing yet. Disappointing.</p>';
    return;
  }

  elements.achievementList.innerHTML = state.achievements
    .slice()
    .reverse()
    .map((id) => {
      const [title, description] = achievements[id] || [id, ""];
      return `<div class="achievement"><strong>🏆 ${escapeHTML(title)}</strong>${escapeHTML(description)}</div>`;
    })
    .join("");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function logEvent(text, danger = false) {
  const entry = { time: nowTime(), text, danger };
  state.eventLog.push(entry);
  state.eventLog = state.eventLog.slice(-40);
  saveState();
  renderEventLog();
}

function renderEventLog() {
  elements.eventLog.innerHTML = state.eventLog
    .slice()
    .reverse()
    .map((item) => (
      `<div class="log-row ${item.danger ? "danger" : ""}">` +
      `<span class="time">${escapeHTML(item.time)}</span>${escapeHTML(item.text)}</div>`
    ))
    .join("");
}

function unlock(id) {
  if (state.achievements.includes(id) || !achievements[id]) return;

  state.achievements.push(id);
  const [title, description] = achievements[id];
  toast(`🏆 ${title}`, description, true);
  beep(880, 0.08, "sine");
  setTimeout(() => beep(1174, 0.12, "sine"), 100);
  saveState();
  renderAchievements();
}

function checkAchievements() {
  if (state.feeds >= 1) unlock("first_feed");
  if (state.pokes >= 5) unlock("poke_5");
  if (state.screams >= 5) unlock("scream_5");
  if (state.mutations >= 3) unlock("mutation_3");
  if (state.clones >= 3) unlock("clone_3");
  if (state.chaos >= 80) unlock("chaos_80");
  if (state.level >= 3) unlock("level_3");
  if (state.breaches >= 1) unlock("breach");
  if (state.voids >= 1) unlock("void");
  if (state.quantumSnacks >= 1) unlock("quantum");
  if (state.ascensions >= 1) unlock("ascended");
  if (state.totalActions >= 100) unlock("century");
}

function toast(title, message, achievementToast = false) {
  const node = document.createElement("div");
  node.className = `toast ${achievementToast ? "achievement-toast" : ""}`;
  node.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
  elements.toastLayer.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

function animateCreature(type, duration = 900) {
  elements.creature.classList.remove("bump", "shake", "spin", "mutating", "sleeping");
  void elements.creature.offsetWidth;
  elements.creature.classList.add(type);

  if (type !== "sleeping") {
    setTimeout(() => elements.creature.classList.remove(type), duration);
  }
}

function screenShake() {
  document.body.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: "translate(-7px, 3px)" },
      { transform: "translate(6px, -4px)" },
      { transform: "translate(-4px, 5px)" },
      { transform: "translate(0, 0)" }
    ],
    { duration: 360, easing: "ease-out" }
  );
}

function flash() {
  elements.flash.classList.add("on");
  setTimeout(() => elements.flash.classList.remove("on"), 90);
}

function burst(symbols = ["✨"], count = 10) {
  const rect = elements.creatureStage.getBoundingClientRect();

  for (let i = 0; i < count; i += 1) {
    const node = document.createElement("span");
    node.textContent = pick(symbols);
    node.style.position = "fixed";
    node.style.zIndex = "700";
    node.style.pointerEvents = "none";
    node.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 120}px`;
    node.style.top = `${rect.top + rect.height / 2 + (Math.random() - 0.5) * 90}px`;
    node.style.fontSize = `${18 + Math.random() * 20}px`;
    document.body.appendChild(node);

    const x = (Math.random() - 0.5) * 320;
    const y = -80 - Math.random() * 240;

    node.animate(
      [
        { transform: "translate(0, 0) scale(.5) rotate(0deg)", opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: `translate(${x}px, ${y}px) scale(1.5) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ],
      { duration: 900 + Math.random() * 700, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    setTimeout(() => node.remove(), 1800);
  }
}

function spawnClone() {
  const node = document.createElement("span");
  node.className = "clone";
  node.textContent = pick(faces.chaos);
  node.style.left = `${8 + Math.random() * 75}%`;
  node.style.top = `${45 + Math.random() * 35}%`;
  node.style.fontSize = `${18 + Math.random() * 22}px`;
  elements.cloneLayer.appendChild(node);
  setTimeout(() => node.remove(), 5200);
}

function randomLine(type) {
  return pick(dialogue[type] || dialogue.idle);
}

function countAction() {
  state.totalActions += 1;
  addXP(9 + Math.floor(Math.random() * 7));
}

function performAction(action) {
  elements.creature.classList.remove("sleeping");
  countAction();

  switch (action) {
    case "feed":
      state.feeds += 1;
      state.hunger = clamp(state.hunger - 24);
      state.happiness = clamp(state.happiness + 5);
      setSpeech(randomLine("feed"));
      animateCreature("bump", 420);
      burst(["🍕", "🍪", "🍓"], 8);
      beep(330, 0.08, "sine");
      logEvent("Fed Gloop.");
      break;

    case "pet":
      state.pets += 1;
      state.happiness = clamp(state.happiness + 15);
      state.energy = clamp(state.energy + 2);
      setSpeech(randomLine("pet"));
      animateCreature("bump", 420);
      burst(["❤️", "✨"], 7);
      beep(440, 0.08, "sine");
      logEvent("Pet Gloop. Temporary trust established.");
      break;

    case "poke":
      state.pokes += 1;
      state.happiness = clamp(state.happiness - 10);
      state.chaos = clamp(state.chaos + 4);
      setSpeech(randomLine("poke"), state.voiceEnabled && state.pokes % 3 === 0);
      animateCreature("shake", 500);
      screenShake();
      beep(120, 0.07, "square");
      logEvent(`Poked Gloop (${state.pokes} total).`, state.pokes >= 5);
      break;

    case "scream":
      state.screams += 1;
      state.energy = clamp(state.energy - 4);
      state.chaos = clamp(state.chaos + 6);
      state.happiness = clamp(state.happiness + (Math.random() < 0.7 ? 9 : -5));
      setSpeech(randomLine("scream"), state.voiceEnabled);
      animateCreature("shake", 520);
      burst(["📢", "⚡", "💢"], 8);
      noiseBurst();
      logEvent(`Scream protocol executed (${state.screams}).`, true);
      break;

    case "sleep":
      state.sleeps += 1;
      state.energy = clamp(state.energy + 30);
      state.hunger = clamp(state.hunger + 9);
      state.happiness = clamp(state.happiness + 3);
      setSpeech(randomLine("sleep"));
      animateCreature("sleeping");
      beep(220, 0.12, "sine");
      logEvent("Gloop entered low-power goblin mode.");
      break;

    case "hat":
      state.hat = pick(hats.filter((hat) => hat !== state.hat));
      state.happiness = clamp(state.happiness + 5);
      setSpeech(randomLine("hat"));
      burst([state.hat, "✨"], 6);
      animateCreature("bump", 420);
      beep(660, 0.06, "triangle");
      logEvent(`Hat equipped: ${state.hat}`);
      break;

    case "mutate":
      state.mutations += 1;
      state.mutationIndex = (state.mutationIndex + 1 + Math.floor(Math.random() * 3)) % mutationMarks.length;
      state.chaos = clamp(state.chaos + 15);
      state.happiness = clamp(state.happiness + (Math.random() < 0.5 ? 8 : -8));
      state.energy = clamp(state.energy - 8);
      setSpeech(randomLine("mutate"), state.voiceEnabled);
      animateCreature("mutating", 1100);
      burst(["🧬", "☢️", "✨", "👁️"], 16);
      flash();
      screenShake();
      noiseBurst();
      logEvent(`Mutation #${state.mutations} completed without ethics review.`, true);
      break;

    case "clone":
      state.clones += 1;
      state.chaos = clamp(state.chaos + 9);
      state.energy = clamp(state.energy - 4);
      setSpeech(randomLine("clone"));
      for (let i = 0; i < 5; i += 1) setTimeout(spawnClone, i * 110);
      beep(260, 0.05, "square");
      setTimeout(() => beep(390, 0.05, "square"), 80);
      logEvent(`Unauthorized clone batch #${state.clones}.`, true);
      break;

    case "void":
      state.voids += 1;
      state.chaos = clamp(state.chaos + 20);
      state.happiness = clamp(state.happiness + 6);
      setSpeech(randomLine("void"), state.voiceEnabled);
      summonVoid();
      logEvent("VOID SUMMONED. Nobody wrote a rollback plan.", true);
      break;

    case "breach":
      state.breaches += 1;
      state.chaos = clamp(state.chaos + 18);
      setSpeech(randomLine("breach"), state.voiceEnabled);
      realityBreach();
      logEvent("Reality containment briefly failed.", true);
      break;

    case "quantum": {
      state.quantumSnacks += 1;
      const outcomes = [
        () => { state.hunger = 0; state.happiness = clamp(state.happiness + 16); },
        () => { state.hunger = 100; state.energy = 100; },
        () => { state.hunger = clamp(state.hunger + 20); state.chaos = clamp(state.chaos + 22); },
        () => { state.hunger = clamp(state.hunger - 35); state.energy = clamp(state.energy + 20); },
        () => { state.happiness = 100; state.chaos = clamp(state.chaos + 10); }
      ];
      pick(outcomes)();
      setSpeech(randomLine("quantum"), state.voiceEnabled);
      burst(["🎲", "🥪", "⚛️", "✨"], 20);
      animateCreature("spin", 900);
      flash();
      beep(510, 0.06, "square");
      setTimeout(() => beep(830, 0.09, "square"), 100);
      logEvent("Quantum snack outcome collapsed.", true);
      break;
    }

    case "ascend":
      ascend();
      break;
  }

  saveState();
  checkAchievements();
  render();
}

function summonVoid() {
  const voidNode = document.createElement("div");
  voidNode.style.position = "fixed";
  voidNode.style.zIndex = "600";
  voidNode.style.left = "50%";
  voidNode.style.top = "50%";
  voidNode.style.width = "30px";
  voidNode.style.height = "30px";
  voidNode.style.borderRadius = "50%";
  voidNode.style.background = "#000";
  voidNode.style.boxShadow = "0 0 80px 20px rgba(123,77,255,.36)";
  voidNode.style.pointerEvents = "none";
  document.body.appendChild(voidNode);

  voidNode.animate(
    [
      { transform: "translate(-50%, -50%) scale(.1)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(9)", opacity: 1, offset: 0.55 },
      { transform: "translate(-50%, -50%) scale(13)", opacity: 0 }
    ],
    { duration: 1800, easing: "cubic-bezier(.2,.8,.2,1)" }
  );

  noiseBurst();
  screenShake();
  setTimeout(() => voidNode.remove(), 1900);
}

function realityBreach() {
  document.body.classList.add("reality-breach");
  elements.stageWarning.classList.remove("hidden");
  screenShake();
  burst(["⚠️", "⛔", "404", "???", "🧿"], 22);
  noiseBurst();

  setTimeout(() => {
    document.body.classList.remove("reality-breach");
    elements.stageWarning.classList.add("hidden");
  }, 6200);
}

function ascend() {
  state.ascensions += 1;
  state.ascended = !state.ascended;
  state.chaos = state.ascended ? 100 : 66;
  state.happiness = clamp(state.happiness + 12);
  setSpeech(state.ascended ? randomLine("ascend") : "Fine. I will temporarily resume physical form.", state.voiceEnabled);
  burst(["👁️", "⚡", "⟁", "✨", "🔥"], 28);
  flash();
  screenShake();
  animateCreature("spin", 900);
  noiseBurst();
  logEvent(state.ascended ? "GLOOP ASCENDED." : "Gloop reluctantly descended.", true);
}

function triggerRandomEvent() {
  if (document.hidden) return;

  const event = pick(randomEvents);
  event.run();
  toast(event.name, event.text);
  logEvent(`RANDOM EVENT: ${event.name}`, true);
  addXP(12);
  checkAchievements();
  saveState();
  render();
}

function randomIdleThought() {
  if (Math.random() < 0.55) {
    setSpeech(randomLine("idle"));
  }
}

function beep(frequency = 440, duration = 0.08, type = "sine", volume = 0.03) {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = beep.ctx || (beep.ctx = new AudioContext());
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio is a bonus, never a dependency.
  }
}

function noiseBurst() {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = beep.ctx || (beep.ctx = new AudioContext());
    const length = Math.floor(ctx.sampleRate * 0.13);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {}
}

function speak(text) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.83;
  utterance.pitch = state.ascended ? 0.25 : 0.7;
  utterance.volume = 0.82;
  window.speechSynthesis.speak(utterance);
}

function boot() {
  const lines = [
    "[ OK ] locating creature...",
    "[ OK ] mounting localStorage consciousness...",
    "[ OK ] hunger subsystem online",
    "[ OK ] emotional stability module missing",
    "[WARN] ethics.dll not found",
    "[WARN] unauthorized opinions detected",
    "[ OK ] mutation engine armed",
    "[FAIL] containment boundary responding 'lol'",
    `[ OK ] session counter: ${state.sessionCount}`,
    " ",
    "GLOOP IS AWAKE."
  ];

  let index = 0;
  let skipped = false;

  const finish = () => {
    if (skipped) return;
    skipped = true;
    elements.bootScreen.classList.add("done");
    if (state.firstBoot) {
      state.firstBoot = false;
      logEvent("Gloop completed first boot.");
      saveState();
    }
  };

  elements.skipBoot.addEventListener("click", finish);

  const next = () => {
    if (skipped) return;
    if (index >= lines.length) {
      setTimeout(finish, 500);
      return;
    }

    elements.bootLog.textContent += `${lines[index]}\n`;
    beep(180 + index * 24, 0.025, "square", 0.008);
    index += 1;
    setTimeout(next, 120 + Math.random() * 150);
  };

  next();
}

function createBackgroundParticles() {
  for (let i = 0; i < 34; i += 1) {
    const node = document.createElement("span");
    node.className = "particle";
    node.style.left = `${Math.random() * 100}%`;
    node.style.animationDuration = `${8 + Math.random() * 18}s`;
    node.style.animationDelay = `${-Math.random() * 20}s`;
    node.style.opacity = `${0.1 + Math.random() * 0.5}`;
    elements.particles.appendChild(node);
  }
}

function openTerminal() {
  elements.terminal.classList.remove("hidden");
  elements.terminalInput.focus();
  unlock("terminal");

  if (!elements.terminalOutput.textContent.trim()) {
    terminalPrint("GLOOP FORBIDDEN CONSOLE v1.0");
    terminalPrint("Type 'help'. Bad decisions are supported.");
  }
}

function closeTerminal() {
  elements.terminal.classList.add("hidden");
}

function terminalPrint(text) {
  elements.terminalOutput.textContent += `${text}\n`;
  elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;

  terminalPrint(`> ${command}`);

  const [name, ...args] = command.split(" ");
  const rest = args.join(" ");

  switch (name.toLowerCase()) {
    case "help":
      terminalPrint("Commands: help, stats, feed, pet, poke, scream, hat, mutate, clone, void, breach, ascend, chaos <0-100>, say <text>, event, clear, whoami, sudo, reset");
      break;
    case "stats":
      terminalPrint(JSON.stringify({
        level: state.level,
        hunger: state.hunger,
        happiness: state.happiness,
        energy: state.energy,
        chaos: state.chaos,
        totalActions: state.totalActions,
        mutations: state.mutations,
        clones: state.clones
      }, null, 2));
      break;
    case "feed":
    case "pet":
    case "poke":
    case "scream":
    case "hat":
    case "mutate":
    case "clone":
    case "void":
    case "breach":
    case "ascend":
      performAction(name.toLowerCase());
      terminalPrint(`Executed '${name}'.`);
      break;
    case "chaos": {
      const value = Number(args[0]);
      if (Number.isNaN(value)) {
        terminalPrint("Usage: chaos <0-100>");
      } else {
        state.chaos = clamp(value);
        setSpeech("Someone edited my chaos manually. This feels invasive.");
        logEvent(`Terminal set chaos to ${state.chaos}.`, true);
        checkAchievements();
        saveState();
        render();
        terminalPrint(`Chaos = ${state.chaos}`);
      }
      break;
    }
    case "say":
      if (!rest) {
        terminalPrint("Usage: say <something cursed>");
      } else {
        setSpeech(rest, true);
        terminalPrint("Speech buffer overwritten.");
      }
      break;
    case "event":
      triggerRandomEvent();
      terminalPrint("Random event forced.");
      break;
    case "whoami":
      terminalPrint("You are a temporary operator in Gloop's enclosure.");
      break;
    case "sudo":
      terminalPrint("Gloop is already root.");
      setSpeech("Nice try.");
      beep(90, 0.18, "square");
      break;
    case "clear":
      elements.terminalOutput.textContent = "";
      break;
    case "reset":
      terminalPrint("Reset denied from terminal. Gloop has standards.");
      break;
    default:
      terminalPrint(`Unknown command '${name}'. Gloop judges you.`);
  }
}

function resetState() {
  const answer = window.prompt(
    "This wipes Gloop's memory. Type DELETE GLOOP to confirm."
  );

  if (answer !== "DELETE GLOOP") {
    toast("RESET ABORTED", "Gloop remembers your hesitation.");
    setSpeech("Cowardice detected.");
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaultState, sessionCount: 1, firstBoot: false };
  saveState();
  elements.eventLog.innerHTML = "";
  setSpeech("I have been reborn with no evidence. Convenient.");
  logEvent("Memory wipe completed.", true);
  render();
}

let secretBuffer = "";

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => performAction(button.dataset.action));
});

elements.voiceToggle.addEventListener("click", () => {
  state.voiceEnabled = !state.voiceEnabled;
  saveState();
  render();
  if (state.voiceEnabled) {
    setSpeech("Voice module online. This was irresponsible.", true);
  } else if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    setSpeech("Voice module disabled. Your loss.");
  }
});

elements.clearLog.addEventListener("click", () => {
  state.eventLog = [];
  saveState();
  renderEventLog();
});

elements.terminalToggle.addEventListener("click", openTerminal);
elements.terminalClose.addEventListener("click", closeTerminal);

elements.terminal.addEventListener("click", (event) => {
  if (event.target === elements.terminal) closeTerminal();
});

elements.terminalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = elements.terminalInput.value;
  elements.terminalInput.value = "";
  runCommand(command);
});

elements.reset.addEventListener("click", resetState);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.terminal.classList.contains("hidden")) {
    closeTerminal();
    return;
  }

  if (event.key === "`" && elements.terminal.classList.contains("hidden")) {
    openTerminal();
    event.preventDefault();
    return;
  }

  if (event.target instanceof HTMLInputElement) return;

  if (/^[a-z]$/i.test(event.key)) {
    secretBuffer = (secretBuffer + event.key.toLowerCase()).slice(-12);

    if (secretBuffer.endsWith("gloop")) {
      unlock("secret");
      state.chaos = clamp(state.chaos + 25);
      setSpeech("YOU CALLED MY NAME.", true);
      burst(["👁️", "GLOOP", "⚡", "✨"], 25);
      screenShake();
      noiseBurst();
      logEvent("Keyboard secret activated.", true);
      saveState();
      render();
      secretBuffer = "";
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Math.random() < 0.55) {
    setTimeout(() => {
      setSpeech("You came back. I noticed.");
    }, 600);
  }
});

window.setInterval(() => {
  if (document.hidden) return;

  state.hunger = clamp(state.hunger + 1.2);
  state.happiness = clamp(state.happiness - 0.7);
  state.energy = clamp(state.energy - 0.8);

  if (state.chaos > 20) {
    state.chaos = clamp(state.chaos - 0.25);
  }

  randomIdleThought();
  saveState();
  render();
}, 18000);

window.setInterval(() => {
  if (Math.random() < 0.38) triggerRandomEvent();
}, 32000);

renderEventLog();
createBackgroundParticles();
render();
boot();
checkAchievements();

setTimeout(() => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    setSpeech("It is extremely late. Excellent. Your judgment is compromised.");
  } else if (hour < 10) {
    setSpeech("Morning. I have already made several decisions without you.");
  } else if (hour >= 22) {
    setSpeech("Late-night development detected. This is how features happen.");
  }
}, 2500);
