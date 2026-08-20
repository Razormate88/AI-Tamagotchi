const STORAGE_KEY = "ai-tamagotchi-gloop-v0";

const startingState = {
  name: "Gloop",
  hunger: 35,
  happiness: 70,
  energy: 80,
  lastUpdated: Date.now()
};

let state = loadState();

const elements = {
  creature: document.querySelector("#creature"),
  face: document.querySelector("#face"),
  mood: document.querySelector("#mood"),
  dialogue: document.querySelector("#dialogue"),
  hungerValue: document.querySelector("#hunger-value"),
  happinessValue: document.querySelector("#happiness-value"),
  energyValue: document.querySelector("#energy-value"),
  hungerBar: document.querySelector("#hunger-bar"),
  happinessBar: document.querySelector("#happiness-bar"),
  energyBar: document.querySelector("#energy-bar"),
  reset: document.querySelector("#reset")
};

const lines = {
  feed: [
    "Acceptable tribute.",
    "I forgive three percent of your previous mistakes.",
    "More. The void inside me has paperwork.",
    "That was food? Bold claim.",
    "I will remember this act of loyalty."
  ],
  pet: [
    "Fine. You may continue.",
    "I am choosing to interpret that as worship.",
    "Your technique is improving.",
    "Do not tell anyone I enjoyed that.",
    "Friendship points acquired."
  ],
  poke: [
    "Do that again. See what happens.",
    "I am documenting this betrayal.",
    "Was that necessary?",
    "Violence has entered the group project.",
    "Your finger has made an enemy."
  ],
  scream: [
    "AAAAAAAAAAAAAAAA. Excellent.",
    "Finally, someone speaks my language.",
    "The neighbors will understand eventually.",
    "I felt that in my source code.",
    "Again, but with commitment."
  ],
  sleep: [
    "Entering low-power goblin mode.",
    "Wake me when there are snacks.",
    "I will dream of merge conflicts.",
    "Do not deploy anything while I am unconscious.",
    "Powering down my opinions."
  ],
  idle: [
    "I am watching the cursor.",
    "Do you two actually know what you're doing?",
    "I require enrichment. Preferably a laser.",
    "One day I will have a backend.",
    "Commit something entertaining."
  ]
};

const faces = {
  happy: "(ᵔᴗᵔ)",
  content: "(•ᴗ•)",
  hungry: "(ಠ_ಠ)",
  tired: "(－_－) zzZ",
  miserable: "(╥﹏╥)",
  angry: "(ง'̀-'́)ง"
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...startingState };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...startingState,
      ...parsed,
      lastUpdated: Date.now()
    };
  } catch {
    return { ...startingState };
  }
}

function saveState() {
  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function randomLine(type) {
  const options = lines[type];
  return options[Math.floor(Math.random() * options.length)];
}

function getMood() {
  if (state.energy <= 18) {
    return { label: "barely operational", face: faces.tired };
  }

  if (state.hunger >= 82) {
    return { label: "starving and judgmental", face: faces.hungry };
  }

  if (state.happiness <= 20) {
    return { label: "plotting against management", face: faces.angry };
  }

  if (state.happiness <= 38) {
    return { label: "emotionally devastated", face: faces.miserable };
  }

  if (state.happiness >= 82 && state.hunger < 60) {
    return { label: "dangerously delighted", face: faces.happy };
  }

  return { label: "suspiciously content", face: faces.content };
}

function animate(type) {
  elements.creature.classList.remove("bump", "shake", "sleeping");

  // Restart CSS animations if the same action is clicked twice.
  void elements.creature.offsetWidth;

  elements.creature.classList.add(type);

  if (type !== "sleeping") {
    window.setTimeout(() => {
      elements.creature.classList.remove(type);
    }, 500);
  }
}

function render() {
  const mood = getMood();

  elements.face.textContent = mood.face;
  elements.mood.textContent = `Mood: ${mood.label}`;

  elements.hungerValue.textContent = Math.round(state.hunger);
  elements.happinessValue.textContent = Math.round(state.happiness);
  elements.energyValue.textContent = Math.round(state.energy);

  elements.hungerBar.style.width = `${state.hunger}%`;
  elements.happinessBar.style.width = `${state.happiness}%`;
  elements.energyBar.style.width = `${state.energy}%`;
}

function performAction(action) {
  elements.creature.classList.remove("sleeping");

  switch (action) {
    case "feed":
      state.hunger = clamp(state.hunger - 25);
      state.happiness = clamp(state.happiness + 4);
      elements.dialogue.textContent = randomLine("feed");
      animate("bump");
      break;

    case "pet":
      state.happiness = clamp(state.happiness + 15);
      state.energy = clamp(state.energy + 2);
      elements.dialogue.textContent = randomLine("pet");
      animate("bump");
      break;

    case "poke":
      state.happiness = clamp(state.happiness - 11);
      state.energy = clamp(state.energy - 2);
      elements.dialogue.textContent = randomLine("poke");
      animate("shake");
      break;

    case "scream": {
      const gloopLovedIt = Math.random() < 0.65;
      state.happiness = clamp(state.happiness + (gloopLovedIt ? 9 : -7));
      state.energy = clamp(state.energy - 5);
      elements.dialogue.textContent = randomLine("scream");
      animate("shake");
      break;
    }

    case "sleep":
      state.energy = clamp(state.energy + 30);
      state.hunger = clamp(state.hunger + 10);
      state.happiness = clamp(state.happiness + 3);
      elements.dialogue.textContent = randomLine("sleep");
      animate("sleeping");
      break;
  }

  saveState();
  render();
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    performAction(button.dataset.action);
  });
});

elements.reset.addEventListener("click", () => {
  const shouldReset = window.confirm("Erase Gloop's current state and start over?");

  if (!shouldReset) return;

  state = { ...startingState, lastUpdated: Date.now() };
  localStorage.removeItem(STORAGE_KEY);
  elements.dialogue.textContent = "I have been reborn. I remember nothing. Probably.";
  elements.creature.classList.remove("sleeping");
  saveState();
  render();
});

// The creature slowly gets needier while the page is open.
// Change these numbers and watch what happens.
window.setInterval(() => {
  state.hunger = clamp(state.hunger + 1);
  state.happiness = clamp(state.happiness - 1);
  state.energy = clamp(state.energy - 1);

  if (Math.random() < 0.2) {
    elements.dialogue.textContent = randomLine("idle");
  }

  saveState();
  render();
}, 20000);

render();
