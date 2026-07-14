const canvas = document.getElementById("heartGame");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("gameOverlay");
const startButton = document.getElementById("startGame");
const popup = document.getElementById("lovePopup");

const messages = [
  "i luv u more than bad days can reach",
  "i adore u, always",
  "you are my favorite person",
  "ten more reasons to kiss your forehead",
  "i am so proud of you",
  "you make the world softer",
  "i choose you, again and again",
  "you are safe with me"
];

const keys = new Set();
const player = {
  x: canvas.width / 2,
  y: canvas.height - 58,
  width: 96,
  height: 42,
  speed: 8
};

let hearts = [];
let score = 0;
let running = false;
let lastSpawn = 0;
let lastFrame = 0;
let popupTimer = 0;

function resizeCanvasForDisplay() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  player.y = rect.height - 58;
  player.x = Math.min(player.x, rect.width - player.width / 2);
}

function drawHeart(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-22, -8, -12, -27, 0, -16);
  ctx.bezierCurveTo(12, -27, 22, -8, 0, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
  ctx.beginPath();
  ctx.ellipse(-6, -10, 4, 7, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#bfe9ff");
  sky.addColorStop(0.62, "#ffe8ef");
  sky.addColorStop(1, "#fff9f7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 173) % width) + 20;
    const y = 42 + ((i * 47) % 105);
    ctx.beginPath();
    ctx.ellipse(x, y, 54, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 42, y + 4, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(31, 111, 120, 0.14)";
  ctx.fillRect(0, height - 28, width, 28);
}

function drawPlayer(width) {
  player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x));

  ctx.fillStyle = "rgba(48, 40, 58, 0.14)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 34, 58, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  const gradient = ctx.createLinearGradient(player.x - 60, player.y, player.x + 60, player.y);
  gradient.addColorStop(0, "#ff6f91");
  gradient.addColorStop(1, "#ff9671");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(player.x - player.width / 2, player.y, player.width, player.height, 16);
  ctx.fill();

  ctx.fillStyle = "#fff9f7";
  ctx.font = "900 24px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2665", player.x, player.y + player.height / 2 + 1);
}

function spawnHeart(width) {
  const size = 16 + Math.random() * 15;
  hearts.push({
    x: 24 + Math.random() * (width - 48),
    y: -30,
    size,
    speed: 1.7 + Math.random() * 2.2 + Math.min(score / 70, 1.3),
    sway: Math.random() * Math.PI * 2,
    color: Math.random() > 0.45 ? "#ff6f91" : "#ff9671"
  });
}

function showLoveMessage() {
  popup.textContent = messages[Math.floor((score / 10 - 1) % messages.length)];
  popup.classList.add("is-visible");
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => popup.classList.remove("is-visible"), 2300);
}

function updateHearts(width, height) {
  const basket = {
    left: player.x - player.width / 2,
    right: player.x + player.width / 2,
    top: player.y - 6,
    bottom: player.y + player.height
  };

  hearts = hearts.filter((heart) => {
    heart.y += heart.speed;
    heart.x += Math.sin(heart.sway + heart.y / 22) * 0.9;

    const caught =
      heart.x > basket.left &&
      heart.x < basket.right &&
      heart.y + heart.size > basket.top &&
      heart.y - heart.size < basket.bottom;

    if (caught) {
      score += 1;
      scoreEl.textContent = score;
      if (score % 10 === 0) {
        showLoveMessage();
      }
      return false;
    }

    return heart.y - heart.size < height;
  });

  hearts.forEach((heart) => drawHeart(heart.x, heart.y, heart.size, heart.color));
}

function frame(timestamp) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const delta = timestamp - lastFrame;
  lastFrame = timestamp;

  if (keys.has("ArrowLeft") || keys.has("a")) {
    player.x -= player.speed * Math.min(delta / 16.67, 2);
  }
  if (keys.has("ArrowRight") || keys.has("d")) {
    player.x += player.speed * Math.min(delta / 16.67, 2);
  }

  if (timestamp - lastSpawn > Math.max(420, 920 - score * 6)) {
    spawnHeart(width);
    lastSpawn = timestamp;
  }

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);
  updateHearts(width, height);
  drawPlayer(width);

  if (running) {
    requestAnimationFrame(frame);
  }
}

function startGame() {
  score = 0;
  hearts = [];
  scoreEl.textContent = "0";
  running = true;
  overlay.classList.add("is-hidden");
  resizeCanvasForDisplay();
  requestAnimationFrame((time) => {
    lastFrame = time;
    lastSpawn = time;
    frame(time);
  });
}

startButton.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "a", "d"].includes(event.key)) {
    keys.add(event.key);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  const rect = canvas.getBoundingClientRect();
  player.x = event.clientX - rect.left;
});

canvas.addEventListener("pointermove", (event) => {
  if (event.buttons !== 1 && event.pointerType !== "touch") {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  player.x = event.clientX - rect.left;
});

window.addEventListener("resize", resizeCanvasForDisplay);
resizeCanvasForDisplay();
drawBackground(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
drawPlayer(canvas.getBoundingClientRect().width);
