const QUESTION_TIME = 15;
const START_HP = 100;
const highScoreKey = "math_battle_high_score";

const state = {
  round: 1,
  score: 0,
  streak: 0,
  playerHp: START_HP,
  aiHp: START_HP,
  inProgress: false,
  timerId: null,
  timeLeft: QUESTION_TIME,
  currentQuestion: null,
  answered: false
};

const el = {
  question: document.getElementById("question"),
  answerForm: document.getElementById("answer-form"),
  answerInput: document.getElementById("answer-input"),
  submitBtn: document.getElementById("submit-btn"),
  startBtn: document.getElementById("start-btn"),
  nextBtn: document.getElementById("next-btn"),
  restartBtn: document.getElementById("restart-btn"),
  feedback: document.getElementById("feedback"),
  difficultyTag: document.getElementById("difficulty-tag"),
  round: document.getElementById("round"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  highScore: document.getElementById("high-score"),
  timeLeft: document.getElementById("time-left"),
  playerHp: document.getElementById("player-hp"),
  aiHp: document.getElementById("ai-hp"),
  playerHpText: document.getElementById("player-hp-text"),
  aiHpText: document.getElementById("ai-hp-text")
};

function getDifficulty(round) {
  if (round <= 3) return "Easy";
  if (round <= 7) return "Medium";
  return "Hard";
}

function buildQuestion(round) {
  const difficulty = getDifficulty(round);
  let a;
  let b;
  let operator;
  let answer;

  if (difficulty === "Easy") {
    operator = Math.random() > 0.45 ? "+" : "-";
    a = randomInt(3, 40);
    b = randomInt(2, 25);
    if (operator === "-" && b > a) [a, b] = [b, a];
    answer = operator === "+" ? a + b : a - b;
  } else if (difficulty === "Medium") {
    operator = Math.random() > 0.4 ? "×" : "+";
    a = randomInt(6, 25);
    b = randomInt(4, 15);
    answer = operator === "×" ? a * b : a + b;
  } else {
    const types = ["÷", "×", "^"];
    operator = types[randomInt(0, types.length - 1)];
    if (operator === "÷") {
      b = randomInt(2, 12);
      answer = randomInt(2, 15);
      a = b * answer;
    } else if (operator === "^") {
      a = randomInt(2, 9);
      b = 2;
      answer = a ** b;
    } else {
      a = randomInt(11, 35);
      b = randomInt(7, 18);
      answer = a * b;
    }
  }

  return {
    difficulty,
    text: `${a} ${operator} ${b} = ?`,
    answer
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setFeedback(message, tone = "neutral") {
  el.feedback.textContent = message;
  if (tone === "good") el.feedback.style.color = "#58f29c";
  else if (tone === "bad") el.feedback.style.color = "#ff8399";
  else el.feedback.style.color = "#ffffff";
}

function render() {
  el.round.textContent = String(state.round);
  el.score.textContent = String(state.score);
  el.streak.textContent = String(state.streak);
  el.timeLeft.textContent = String(state.timeLeft);
  el.playerHpText.textContent = String(state.playerHp);
  el.aiHpText.textContent = String(state.aiHp);
  el.playerHp.style.width = `${state.playerHp}%`;
  el.aiHp.style.width = `${state.aiHp}%`;
  el.highScore.textContent = String(getHighScore());

  if (state.currentQuestion) {
    el.question.textContent = state.currentQuestion.text;
    el.difficultyTag.textContent = state.currentQuestion.difficulty;
  }
}

function getHighScore() {
  return Number(localStorage.getItem(highScoreKey) || 0);
}

function setHighScoreIfNeeded() {
  if (state.score > getHighScore()) {
    localStorage.setItem(highScoreKey, String(state.score));
  }
}

function startBattle() {
  state.round = 1;
  state.score = 0;
  state.streak = 0;
  state.playerHp = START_HP;
  state.aiHp = START_HP;
  state.inProgress = true;
  state.answered = false;
  el.startBtn.disabled = true;
  el.restartBtn.disabled = false;
  nextRound();
}

function nextRound() {
  clearTimer();
  state.answered = false;
  state.timeLeft = QUESTION_TIME;
  state.currentQuestion = buildQuestion(state.round);

  el.answerInput.disabled = false;
  el.submitBtn.disabled = false;
  el.nextBtn.disabled = true;
  el.answerInput.value = "";
  el.answerInput.focus();

  setFeedback("Solve quickly to deal max damage!");
  render();
  startTimer();
}

function startTimer() {
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      render();
      handleTimeout();
      return;
    }
    render();
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function calculateDamageOnCorrect() {
  const speedBonus = Math.ceil(state.timeLeft / 2);
  const streakBonus = Math.min(10, state.streak * 2);
  return 10 + speedBonus + streakBonus;
}

function calculateAiDamage() {
  const base = 8 + Math.floor(state.round * 0.8);
  return Math.min(26, base + randomInt(0, 8));
}

function lockQuestion() {
  el.answerInput.disabled = true;
  el.submitBtn.disabled = true;
  el.nextBtn.disabled = false;
  clearTimer();
}

function handleCorrect() {
  const damage = calculateDamageOnCorrect();
  state.streak += 1;
  state.score += 10 + state.timeLeft + state.streak;
  state.aiHp = Math.max(0, state.aiHp - damage);

  setFeedback(`Direct hit! You dealt ${damage} damage.`, "good");
  endTurn();
}

function handleWrong() {
  state.streak = 0;
  const damage = calculateAiDamage();
  state.playerHp = Math.max(0, state.playerHp - damage);

  setFeedback(`Wrong answer. AI hit you for ${damage}.`, "bad");
  endTurn();
}

function handleTimeout() {
  state.streak = 0;
  const damage = calculateAiDamage() + 4;
  state.playerHp = Math.max(0, state.playerHp - damage);
  setFeedback(`Time up! AI punished you for ${damage}.`, "bad");
  endTurn();
}

function endTurn() {
  if (state.answered) return;
  state.answered = true;
  lockQuestion();
  render();

  if (state.aiHp <= 0 || state.playerHp <= 0) {
    finishBattle();
    return;
  }

  state.round += 1;
}

function finishBattle() {
  state.inProgress = false;
  setHighScoreIfNeeded();
  el.nextBtn.disabled = true;
  el.answerInput.disabled = true;
  el.submitBtn.disabled = true;
  clearTimer();

  if (state.aiHp <= 0) {
    setFeedback("🏆 Victory! You defeated the AI rival.", "good");
  } else {
    setFeedback("💥 Defeat! Train and try again.", "bad");
  }

  render();
}

function onSubmit(event) {
  event.preventDefault();
  if (!state.inProgress || state.answered || !state.currentQuestion) return;

  const raw = el.answerInput.value.trim();
  if (!raw) {
    setFeedback("Type an answer first.", "bad");
    return;
  }

  const guess = Number(raw);
  if (!Number.isFinite(guess)) {
    setFeedback("Please enter a valid number.", "bad");
    return;
  }

  if (guess === state.currentQuestion.answer) handleCorrect();
  else handleWrong();
}

function restart() {
  clearTimer();
  state.inProgress = false;
  state.round = 1;
  state.score = 0;
  state.streak = 0;
  state.playerHp = START_HP;
  state.aiHp = START_HP;
  state.timeLeft = QUESTION_TIME;
  state.currentQuestion = null;
  state.answered = false;

  el.question.textContent = "Press Start to begin!";
  el.difficultyTag.textContent = "Easy";
  el.answerInput.value = "";
  el.answerInput.disabled = true;
  el.submitBtn.disabled = true;
  el.startBtn.disabled = false;
  el.nextBtn.disabled = true;
  setFeedback("Get ready for battle.");
  render();
}

el.startBtn.addEventListener("click", startBattle);
el.nextBtn.addEventListener("click", () => {
  if (!state.inProgress) return;
  nextRound();
});
el.restartBtn.addEventListener("click", restart);
el.answerForm.addEventListener("submit", onSubmit);

render();
