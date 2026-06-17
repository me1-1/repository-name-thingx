const words = [
  "apple",
  "brave",
  "candy",
  "delta",
  "eagle",
  "flame",
  "giant",
  "honey",
  "ivory",
  "joker",
  "knife",
  "lemon",
  "magic",
  "noble",
  "ocean",
  "piano",
  "quest",
  "river",
  "spark",
  "tiger",
  "vivid",
  "waltz",
  "xenon",
  "young",
  "zesty",
  "planet",
  "garden",
  "silver",
  "rocket",
  "bridge",
  "castle",
  "dragon",
  "forest",
  "glider",
  "harbor",
  "island",
  "jungle",
  "kernel",
  "legend",
  "marble",
  "nectar",
  "orange",
  "pirate",
  "quartz",
  "riddle",
  "sunset",
  "thrive",
  "velvet",
  "wonder",
  "zephyr",
  "alchemy",
  "balloon",
  "captain",
  "diamond",
  "emerald",
  "firefly",
  "gallery",
  "horizon",
  "lantern",
  "machine",
  "orchard",
  "picture",
  "rainbow",
  "station",
  "treetop",
  "voyager",
  "whisper",
  "compass",
  "festival",
  "notebook",
  "wildcard",
  "blueprint",
  "moonlight",
  "treasure"
];

const mysteryWord = document.querySelector("#mystery-word");
const lengthLabel = document.querySelector("#length-label");
const roundLabel = document.querySelector("#round-label");
const statusLine = document.querySelector("#status-line");
const form = document.querySelector("#guess-form");
const input = document.querySelector("#guess-input");
const board = document.querySelector("#board");
const newRoundButton = document.querySelector("#new-round");
const scoreElement = document.querySelector("#score");
const guessCountElement = document.querySelector("#guess-count");
const streakElement = document.querySelector("#streak");
const lockedLetters = document.querySelector("#locked-letters");
const warmLetters = document.querySelector("#warm-letters");
const coldLetters = document.querySelector("#cold-letters");

let answer = "";
let round = 0;
let score = 100;
let streak = Number(localStorage.getItem("guessline-streak") || 0);
let guesses = [];
let locked = Array.from({ length: 5 }, () => "");
let warm = new Set();
let cold = new Set();
let solved = false;

function pickWord() {
  const freshPool = words.filter((word) => word !== answer);
  return freshPool[Math.floor(Math.random() * freshPool.length)];
}

function startRound() {
  answer = pickWord();
  round += 1;
  score = 100;
  guesses = [];
  locked = Array.from({ length: answer.length }, () => "");
  warm = new Set();
  cold = new Set();
  solved = false;

  board.innerHTML = "";
  input.value = "";
  input.maxLength = answer.length;
  input.disabled = false;
  form.querySelector("button").disabled = false;
  lengthLabel.textContent = `${answer.length} letters`;
  roundLabel.textContent = `Round ${round}`;
  statusLine.textContent = "Start by guessing any word with the same length.";
  updateStats();
  renderMystery();
  input.focus();
}

function renderMystery() {
  mysteryWord.innerHTML = "";
  locked.forEach((letter) => {
    const slot = document.createElement("div");
    slot.className = letter ? "slot locked" : "slot";
    slot.textContent = letter || "?";
    mysteryWord.append(slot);
  });
}

function scoreGuess(guess) {
  const answerLetters = answer.split("");
  const result = Array.from({ length: answer.length }, () => "cold");

  guess.split("").forEach((letter, index) => {
    if (answer[index] === letter) {
      result[index] = "locked";
      answerLetters[index] = null;
    }
  });

  guess.split("").forEach((letter, index) => {
    if (result[index] === "locked") return;
    const foundAt = answerLetters.indexOf(letter);
    if (foundAt !== -1) {
      result[index] = "warm";
      answerLetters[foundAt] = null;
    }
  });

  return result;
}

function submitGuess(event) {
  event.preventDefault();
  if (solved) return;

  const guess = input.value.toLowerCase().replace(/[^a-z]/g, "");
  if (guess.length !== answer.length) {
    nudgeInput(`Try a ${answer.length}-letter guess.`);
    return;
  }

  const result = scoreGuess(guess);
  guesses.push({ guess, result });

  guess.split("").forEach((letter, index) => {
    if (result[index] === "locked") {
      locked[index] = letter;
      cold.delete(letter);
    } else if (result[index] === "warm") {
      warm.add(letter);
      cold.delete(letter);
    } else if (!answer.includes(letter)) {
      cold.add(letter);
    }
  });

  score = Math.max(0, score - 8 - Math.max(0, guesses.length - 3) * 2);
  input.value = "";
  renderBoard();
  renderMystery();
  updateStats();

  if (guess === answer) {
    solved = true;
    streak += 1;
    localStorage.setItem("guessline-streak", String(streak));
    statusLine.textContent = `Solved in ${guesses.length}. That was clean.`;
    input.disabled = true;
    form.querySelector("button").disabled = true;
    updateStats();
    return;
  }

  const lockedCount = locked.filter(Boolean).length;
  const warmCount = result.filter((state) => state === "warm").length;
  statusLine.textContent =
    lockedCount > 0 || warmCount > 0
      ? `${lockedCount} locked position${lockedCount === 1 ? "" : "s"}, ${warmCount} close letter${warmCount === 1 ? "" : "s"} on that guess.`
      : "Nothing hit. That guess still cleared the fog.";
}

function renderBoard() {
  board.innerHTML = "";
  guesses.forEach(({ guess, result }, guessIndex) => {
    const row = document.createElement("div");
    row.className = "guess-row";

    const number = document.createElement("div");
    number.className = "guess-number";
    number.textContent = `#${guessIndex + 1}`;

    const tiles = document.createElement("div");
    tiles.className = "tiles";
    guess.split("").forEach((letter, letterIndex) => {
      const tile = document.createElement("div");
      tile.className = `tile ${result[letterIndex]}`;
      tile.textContent = letter;
      tiles.append(tile);
    });

    row.append(number, tiles);
    board.prepend(row);
  });
}

function updateStats() {
  scoreElement.textContent = String(score);
  guessCountElement.textContent = String(guesses.length);
  streakElement.textContent = String(streak);
  lockedLetters.textContent = locked.some(Boolean) ? locked.map((letter) => letter || "_").join(" ") : "None yet";
  warmLetters.textContent = warm.size ? [...warm].sort().join(" ") : "None yet";
  coldLetters.textContent = cold.size ? [...cold].sort().join(" ") : "None yet";
}

function nudgeInput(message) {
  statusLine.textContent = message;
  input.classList.remove("shake");
  window.requestAnimationFrame(() => input.classList.add("shake"));
}

form.addEventListener("submit", submitGuess);
newRoundButton.addEventListener("click", startRound);
input.addEventListener("input", () => {
  input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, answer.length).toUpperCase();
});

startRound();
