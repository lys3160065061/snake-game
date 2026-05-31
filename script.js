const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const overlay = document.querySelector("#overlay");
const statusTitle = document.querySelector("#statusTitle");
const statusHint = document.querySelector("#statusHint");
const restartBtn = document.querySelector("#restartBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const directionButtons = document.querySelectorAll("[data-dir]");

const gridSize = 20;
const cell = canvas.width / gridSize;
const initialSnake = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

const vectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let speed;
let timer;
let running;
let paused;
let ended;

function resetGame() {
  snake = initialSnake.map((segment) => ({ ...segment }));
  direction = vectors.right;
  nextDirection = vectors.right;
  score = 0;
  speed = 145;
  running = false;
  paused = false;
  ended = false;
  pauseBtn.textContent = "暂停";
  scoreEl.textContent = score;
  food = createFood();
  stopLoop();
  showOverlay("轻触开始", "准备好刷新纪录");
  draw();
}

function startGame() {
  if (ended) {
    resetGame();
  }

  if (running) {
    return;
  }

  running = true;
  paused = false;
  pauseBtn.textContent = "暂停";
  hideOverlay();
  tickLoop();
}

function tickLoop() {
  stopLoop();
  timer = window.setInterval(step, speed);
}

function stopLoop() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

function step() {
  direction = nextDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
  const willEat = nextHead.x === food.x && nextHead.y === food.y;

  if (hitWall(nextHead) || hitSelf(nextHead, willEat)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (willEat) {
    score += 1;
    scoreEl.textContent = score;
    food = createFood();
    if (speed > 72 && score % 3 === 0) {
      speed -= 8;
      tickLoop();
    }
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  ended = true;
  running = false;
  paused = false;
  pauseBtn.textContent = "暂停";
  stopLoop();
  showOverlay("游戏结束", `得分 ${score}，轻触重开`);
  draw();
}

function togglePause() {
  if (!running && !paused) {
    startGame();
    return;
  }

  paused = !paused;
  running = !paused;
  pauseBtn.textContent = paused ? "继续" : "暂停";

  if (paused) {
    stopLoop();
    showOverlay("已暂停", "轻触继续");
  } else {
    hideOverlay();
    tickLoop();
  }
}

function changeDirection(name) {
  const next = vectors[name];
  if (!next) {
    return;
  }

  const reversing = next.x + direction.x === 0 && next.y + direction.y === 0;
  if (!reversing) {
    nextDirection = next;
  }

  startGame();
}

function createFood() {
  let point;
  do {
    point = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (snake.some((segment) => segment.x === point.x && segment.y === point.y));

  return point;
}

function hitWall(point) {
  return point.x < 0 || point.y < 0 || point.x >= gridSize || point.y >= gridSize;
}

function hitSelf(point, willEat) {
  const body = willEat ? snake : snake.slice(0, -1);
  return body.some((segment) => segment.x === point.x && segment.y === point.y);
}

function showOverlay(title, hint) {
  statusTitle.textContent = title;
  statusHint.textContent = hint;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawFood();
  drawSnake();
}

function drawBoard() {
  ctx.fillStyle = "#fbfbfd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(23, 24, 28, 0.045)";
  ctx.lineWidth = 1;

  for (let i = 1; i < gridSize; i += 1) {
    const pos = i * cell;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 4 : 5;
    const radius = index === 0 ? 10 : 8;
    const x = segment.x * cell + inset;
    const y = segment.y * cell + inset;
    const size = cell - inset * 2;

    ctx.fillStyle = index === 0 ? "#007aff" : "#2f8cff";
    roundRect(x, y, size, size, radius);
    ctx.fill();

    if (index === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      const eyeOffsetX = direction.x === 0 ? 7 : direction.x > 0 ? 13 : 6;
      const eyeOffsetY = direction.y === 0 ? 7 : direction.y > 0 ? 13 : 6;
      ctx.beginPath();
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, 2.2, 0, Math.PI * 2);
      ctx.arc(x + size - eyeOffsetX, y + eyeOffsetY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  const centerX = food.x * cell + cell / 2;
  const centerY = food.y * cell + cell / 2;

  ctx.fillStyle = "#ff453a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, cell * 0.31, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(centerX - cell * 0.09, centerY - cell * 0.1, cell * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

window.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const next = keys[event.key];
  if (next) {
    event.preventDefault();
    changeDirection(next);
  }
});

directionButtons.forEach((button) => {
  button.addEventListener("click", () => changeDirection(button.dataset.dir));
});

overlay.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

canvas.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
pauseBtn.addEventListener("click", togglePause);

resetGame();
