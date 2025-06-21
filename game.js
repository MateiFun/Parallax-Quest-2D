const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// === Zoom constant ===
const ZOOM = 1.5;  // Change this to zoom in/out (1 = normal)

// Load background image
const backgroundImg = new Image();
backgroundImg.src = "Backgrounds/StartingArea.jpg";

// Match background dimensions
const WORLD_WIDTH = 3028;
const WORLD_HEIGHT = 2088;

// Input
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Player setup with fixed spawn point
const player = {
  x: 1700,
  y: 2000,
  width: 80,
  height: 80,
  speed: 200
};

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

function update(deltaTime) {
  const isSprinting = keys["shift"];
  const sprintMultiplier = isSprinting ? 2 : 1;
  const velocity = player.speed * sprintMultiplier * deltaTime;
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

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));

  if (moved) {
    const frameDuration = isSprinting ? FRAME_DURATION / 2 : FRAME_DURATION;
    frameTimer += deltaTime;
    if (frameTimer >= frameDuration) {
      frameTimer = 0;
      currentFrame = (currentFrame + 1) % walkFrames.length;
    }
  } else {
    currentFrame = 0;
  }
}

function getCamera() {
  const camX = Math.max(0, Math.min(
    player.x + player.width / 2 - (canvas.width / (2 * ZOOM)),
    WORLD_WIDTH - canvas.width / ZOOM
  ));
  const camY = Math.max(0, Math.min(
    player.y + player.height / 2 - (canvas.height / (2 * ZOOM)),
    WORLD_HEIGHT - canvas.height / ZOOM
  ));
  return { x: camX, y: camY };
}

function drawWorld(camera) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.scale(ZOOM, ZOOM);

  ctx.drawImage(
    backgroundImg,
    camera.x, camera.y,
    canvas.width / ZOOM, canvas.height / ZOOM,
    0, 0,
    canvas.width / ZOOM, canvas.height / ZOOM
  );

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

  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  //ctx.fillText("Use WASD to move, hold Shift to sprint", 20, 30);
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

backgroundImg.onload = () => {
  requestAnimationFrame(gameLoop);
};
