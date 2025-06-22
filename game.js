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

const collisionBoxes = [
  // Example boxes
  { x: 460, y: 1930, width: 1150, height: 40 }, // done
  { x: 1415, y: 1950, width: 40, height: 150 }, //done 
  { x: 1160, y: 1680, width: 460, height: 140 }, //done
  { x: 1780, y: 1930, width: 870, height: 40 }, //done
  { x: 1770, y: 1680, width: 570, height: 140 }, //done
  { x: 1210, y: 1820, width: 140, height: 140 }, //done
  { x: 1210, y: 1630, width: 292, height: 50 }, //done
  { x: 1997, y: 1420, width: 343, height: 350 }, //done
  { x: 1605, y: 1653, width: 23, height: 184 }, //done
  { x: 1766, y: 1653, width: 23, height: 187 }, //done
  { x: 1889, y: 1614, width: 30, height: 30 }, //done
  { x: 1045, y: 1535, width: 35, height: 520 }, //done
  { x: 1015, y: 1590, width: 23, height: 487 }, //done
  { x: 525, y: 1590, width: 23, height: 487 }, //done
  { x: 856, y: 1589, width: 220, height: 28 }, //done
  { x: 483, y: 935, width: 40, height: 728 }, //done
  { x: 505, y: 959, width: 116, height: 28 }, //done
  { x: 795, y: 959, width: 116, height: 28 }, //done
  { x: 815, y: 959, width: 106, height: 166 }, //done
  { x: 525, y: 1834, width: 540, height: 28 }, //done
  { x: 525, y: 1589, width: 240, height: 28 }, //done
  { x: 895, y: 1310, width: 180, height: 43 }, //done
  { x: 893, y: 1089, width: 28, height: 264 }, //done
  { x: 830, y: 1270, width: 40, height: 35 }, //done
  { x: 1045, y: 1310, width: 50, height: 67 }, //done
  { x: 899, y: 1270, width: 710, height: 34 }, //done
  { x: 1785, y: 1270, width: 555, height: 34 }, //done
  { x: 2095, y: 1210, width: 145, height: 254 }, //done
  { x: 2463, y: 1270, width: 355, height: 34 }, //done
  { x: 1823, y: 1300, width: 355, height: 64 } //done

  // Add as many as you need...
];

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

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
  const sprintMultiplier = isSprinting ? 1.8 : 1;
  const velocity = player.speed * sprintMultiplier * deltaTime;

  let moved = false;

  // --- X Axis ---
  let proposedX = player.x;
  if (keys["a"]) {
    proposedX -= velocity;
    facingLeft = true;
    moved = true;
  }
  if (keys["d"]) {
    proposedX += velocity;
    facingLeft = false;
    moved = true;
  }

  const hitboxX = {
    x: proposedX + 30,
    y: player.y + 50,
    width: player.width - 60,
    height: player.height - 50
  };
  const blockedX = collisionBoxes.some(box => isColliding(hitboxX, box));
  if (!blockedX) {
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, proposedX));
  }

  // --- Y Axis ---
  let proposedY = player.y;
  if (keys["w"]) {
    proposedY -= velocity;
    moved = true;
  }
  if (keys["s"]) {
    proposedY += velocity;
    moved = true;
  }

  const hitboxY = {
    x: player.x + 30,
    y: proposedY + 50,
    width: player.width - 60,
    height: player.height - 50
  };
  const blockedY = collisionBoxes.some(box => isColliding(hitboxY, box));
  if (!blockedY) {
    player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, proposedY));
  }

  // --- Animation update ---
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
