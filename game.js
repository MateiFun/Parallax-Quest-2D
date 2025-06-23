// === Canvas Setup ===
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
const ZOOM = 1.5;

// === Exclamation Animation ===
const exclamationFrames = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `User/ExclamationSign/Exclamation${i}.png`;
  exclamationFrames.push(img);
}
let exclamationFrameIndex = 0;
let exclamationTimer = 0;
const EXCLAMATION_FRAME_DURATION = 0.2;
let nearInteractable = false;

// === World and Area State ===
let currentArea = null;
const areas = {
  startingArea: {
    name: "startingArea",
    backgroundSrc: "Backgrounds/StartingArea.jpg",
    worldWidth: 3028,
    worldHeight: 2088,
    collisionBoxes: [
      { x: 460, y: 1930, width: 1150, height: 40 },
      { x: 1415, y: 1950, width: 40, height: 150 },
      { x: 1160, y: 1680, width: 460, height: 140 },
      { x: 1780, y: 1930, width: 870, height: 40 },
      { x: 1770, y: 1680, width: 570, height: 140 },
      { x: 1210, y: 1820, width: 140, height: 140 },
      { x: 1210, y: 1630, width: 292, height: 50 },
      { x: 1997, y: 1420, width: 343, height: 350 },
      { x: 1605, y: 1653, width: 23, height: 184 },
      { x: 1766, y: 1653, width: 23, height: 187 },
      { x: 1889, y: 1614, width: 30, height: 30 },
      { x: 1045, y: 1535, width: 35, height: 520 },
      { x: 1015, y: 1590, width: 23, height: 487 },
      { x: 525, y: 1590, width: 23, height: 487 },
      { x: 856, y: 1589, width: 220, height: 28 },
      { x: 483, y: 935, width: 40, height: 728 },
      { x: 505, y: 959, width: 116, height: 28 },
      { x: 795, y: 959, width: 116, height: 28 },
      { x: 815, y: 959, width: 106, height: 166 },
      { x: 525, y: 1834, width: 540, height: 28 },
      { x: 525, y: 1589, width: 240, height: 28 },
      { x: 895, y: 1310, width: 180, height: 43 },
      { x: 893, y: 1089, width: 28, height: 264 },
      { x: 830, y: 1270, width: 40, height: 35 },
      { x: 1045, y: 1310, width: 50, height: 67 },
      { x: 899, y: 1270, width: 710, height: 34 },
      { x: 1785, y: 1270, width: 555, height: 34 },
      { x: 2095, y: 1210, width: 145, height: 254 },
      { x: 2463, y: 1270, width: 355, height: 34 },
      { x: 1823, y: 1300, width: 355, height: 64 }
    ],
    sprites: [
      {
      src: "Backgrounds/StartingAreaAddedSprites/CastelTest.png", // path to the image
      x: 1200,
      y: 1100,
      width: 601,
      height: 178
      }
    ],
    doors: [
      {
        x: 1148,
        y: 977,
        width: 55,
        height: 65,
        targetArea: "houseInterior1",
        targetSpawn: { x: 340, y: 550 },
        doorBack: true
      }
    ]
  },
  houseInterior1: {
    name: "houseInterior1",
    backgroundSrc: "Backgrounds/HouseInside1.jpg",
    worldWidth: 736,
    worldHeight: 682,
    collisionBoxes: [
      { x: 0, y: 526, width: 207, height: 90 },
      { x: 50, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 }
    ],
    sprites: [],
    doors: [
      {
        x: 327,
        y: 635,
        width: 120,
        height: 20,
        targetArea: "startingArea",
        targetSpawn: { x: 1127, y: 1000 },
        doorBack: true
      }
    ]
  }
};

let backgroundImg = new Image();

// === Input Handling ===
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// === Player ===
const player = {
  x: 1700,
  y: 2000,
  width: 80,
  height: 80,
  speed: 200
};

// === Walk Cycle ===
const walkFrames = [];
let walkFramesLoaded = 0;
let currentFrame = 0;
let frameTimer = 0;
const FRAME_DURATION = 0.15;
let facingLeft = false;

for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `User/UserWalkCycle/UserWalkCycle${i}.png`;
  img.onload = () => {
    walkFramesLoaded++;
    if (walkFramesLoaded === 4 && backgroundImg.complete) {
      requestAnimationFrame(gameLoop);
    }
  };
  walkFrames.push(img);
}

function isColliding(r1, r2) {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

function loadArea(areaName, spawn) {
  currentArea = areas[areaName];
  backgroundImg.src = currentArea.backgroundSrc;
  player.x = spawn.x;
  player.y = spawn.y;
}

backgroundImg.onload = () => {
  if (walkFramesLoaded === 4) {
    requestAnimationFrame(gameLoop);
  }
};

function update(deltaTime) {
  const velocity = player.speed * (keys["shift"] ? 1.8 : 1) * deltaTime;
  let moved = false;

  let proposedX = player.x;
  if (keys["a"]) { proposedX -= velocity; facingLeft = true; moved = true; }
  if (keys["d"]) { proposedX += velocity; facingLeft = false; moved = true; }

  const hitboxX = { x: proposedX + 30, y: player.y + 50, width: player.width - 60, height: player.height - 50 };
  if (!currentArea.collisionBoxes.some(box => isColliding(hitboxX, box))) {
    player.x = proposedX;
  }

  let proposedY = player.y;
  if (keys["w"]) { proposedY -= velocity; moved = true; }
  if (keys["s"]) { proposedY += velocity; moved = true; }

  const hitboxY = { x: player.x + 30, y: proposedY + 50, width: player.width - 60, height: player.height - 50 };
  if (!currentArea.collisionBoxes.some(box => isColliding(hitboxY, box))) {
    player.y = proposedY;
  }

  if (moved) {
    frameTimer += deltaTime;
    if (frameTimer >= FRAME_DURATION) {
      frameTimer = 0;
      currentFrame = (currentFrame + 1) % walkFrames.length;
    }
  } else {
    currentFrame = 0;
  }

  nearInteractable = false;
  for (const door of currentArea.doors) {
    const playerBox = { x: player.x + 30, y: player.y + 50, width: player.width - 60, height: player.height - 50 };
    if (isColliding(playerBox, door)) {
      nearInteractable = true;
      if (keys["e"]) {
        loadArea(door.targetArea, door.targetSpawn);
        break;
      }
    }
  }

  if (nearInteractable) {
    exclamationTimer += deltaTime;
    if (exclamationTimer >= EXCLAMATION_FRAME_DURATION) {
      exclamationTimer = 0;
      exclamationFrameIndex = (exclamationFrameIndex + 1) % exclamationFrames.length;
    }
  } else {
    exclamationFrameIndex = 0;
    exclamationTimer = 0;
  }
}

function getCamera() {
  const camX = Math.max(0, Math.min(player.x + player.width / 2 - canvas.width / (2 * ZOOM), currentArea.worldWidth - canvas.width / ZOOM));
  const camY = Math.max(0, Math.min(player.y + player.height / 2 - canvas.height / (2 * ZOOM), currentArea.worldHeight - canvas.height / ZOOM));
  return { x: camX, y: camY };
}

function drawWorld(camera) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(ZOOM, ZOOM);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width / ZOOM, canvas.height / ZOOM);

  ctx.drawImage(
    backgroundImg,
    camera.x, camera.y,
    canvas.width / ZOOM, canvas.height / ZOOM,
    0, 0,
    canvas.width / ZOOM, canvas.height / ZOOM
  );

  // for (const box of currentArea.collisionBoxes) {
  //   ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
  //   ctx.fillRect(box.x - camera.x, box.y - camera.y, box.width, box.height);
  // }

  // for (const door of currentArea.doors) {
  //   ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
  //   ctx.fillRect(door.x - camera.x, door.y - camera.y, door.width, door.height);
  // }


  const frame = walkFrames[currentFrame];
  const drawX = player.x - camera.x;
  const drawY = player.y - camera.y;
  ctx.save();
  if (facingLeft) {
    ctx.translate(drawX + player.width, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, player.width, player.height);
  } else {
    ctx.drawImage(frame, drawX, drawY, player.width, player.height);
  }
  ctx.restore();





  if (nearInteractable) {
    const exclImg = exclamationFrames[exclamationFrameIndex];
    if (exclImg.complete) {
      const exclX = player.x - camera.x + player.width / 2 - 16;
      const exclY = player.y - camera.y - 32;
      ctx.drawImage(exclImg, exclX, exclY, 32, 32);
    }
  }

  


  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  // Add UI text here
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

// Load initial area
document.addEventListener("DOMContentLoaded", () => {
  loadArea("startingArea", { x: 1700, y: 2000 });
});
