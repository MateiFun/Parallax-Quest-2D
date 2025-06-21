const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Disable blurring on pixel art
ctx.imageSmoothingEnabled = false;

// Resize canvas to fit screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// World dimensions
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

// Input
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Player setup
const player = {
  x: 1500,
  y: 1500,
  width: 180,    // Scale size here
  height: 180,
  speed: 500    // pixels per second
};

// Track direction for flipping
let facingLeft = false;

// Load walk frames
const walkFrames = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `User/UserWalkCycle/UserWalkCycle${i}.png`;
  walkFrames.push(img);
}

let currentFrame = 0;
let frameTimer = 0;
const FRAME_DURATION = 0.15;

// Random houses
const houses = [];
for (let i = 0; i < 50; i++) {
  houses.push({
    x: Math.random() * (WORLD_WIDTH - 100),
    y: Math.random() * (WORLD_HEIGHT - 100),
    width: 80,
    height: 80,
    color: "darkred"
  });
}

function update(deltaTime) {
  const velocity = player.speed * deltaTime;
  let moved = false;

  if (keys["w"]) {
    player.y -= velocity;
    moved = true;
  }
  if (keys["s"]) {
    player.y += velocity;
    moved = true;
  }
  if (keys["a"]) {
    player.x -= velocity;
    moved = true;
    facingLeft = true;
  }
  if (keys["d"]) {
    player.x += velocity;
    moved = true;
    facingLeft = false;
  }

  // Clamp to world
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));

  // Animate if moved
  if (moved) {
    frameTimer += deltaTime;
    if (frameTimer >= FRAME_DURATION) {
      frameTimer = 0;
      currentFrame = (currentFrame + 1) % walkFrames.length;
    }
  } else {
    currentFrame = 0;
  }
}

function getCamera() {
  const camX = Math.max(0, Math.min(
    player.x + player.width / 2 - canvas.width / 2,
    WORLD_WIDTH - canvas.width
  ));
  const camY = Math.max(0, Math.min(
    player.y + player.height / 2 - canvas.height / 2,
    WORLD_HEIGHT - canvas.height
  ));
  return { x: camX, y: camY };
}

function drawWorld(camera) {
  // Grass background
  ctx.fillStyle = "#2b6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Houses
  for (const house of houses) {
    ctx.fillStyle = house.color;
    ctx.fillRect(house.x - camera.x, house.y - camera.y, house.width, house.height);
  }

  // Player sprite
  const frame = walkFrames[currentFrame];
  const drawX = player.x - camera.x;
  const drawY = player.y - camera.y;

  if (frame.complete) {
    ctx.save();
    if (facingLeft) {
      ctx.translate(drawX + player.width, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0, player.width, player.height);
    } else {
      ctx.drawImage(frame, drawX, drawY, player.width, player.height);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = "cyan";
    ctx.fillRect(drawX, drawY, player.width, player.height);
  }
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText("Use WASD to move", 20, 30);
}

let lastTime = performance.now();
function gameLoop(time) {
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  update(deltaTime);
  const camera = getCamera();
  drawWorld(camera);
  drawUI();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
