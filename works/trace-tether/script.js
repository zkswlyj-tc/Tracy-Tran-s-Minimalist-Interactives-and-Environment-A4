let state = "loading"; // loading, intro, suitcase
let hintPhases = [
  "I couldn’t write a letter.",
  "Everything I have to say is in this suitcase.",
  "Pull the thread. Find me."
];
let words = hintPhases.join(" ").split(" ");
let displayedWords = 0;

let assets = {};
let items = [];
let fateThreads = [];
let opened = false;
let currentLine = 0;
let shakeAmount = 0;

const poem = [
  "", 
  "Loss", 
  "He left", 
  "He left behind", 
  "He left behind a", 
  "He left behind a small", 
  "He left behind a small button."
];

function preload() {
  const ASSET_PATH = 'assets/'; 
  assets.closed = loadImage(ASSET_PATH + 'suitcase_close.png');
  assets.open = loadImage(ASSET_PATH + 'suitcase_open.png');
  assets.jacket = loadImage(ASSET_PATH + 'jacket.png');
  assets.letters = loadImage(ASSET_PATH + 'letters_stack.svg');
  assets.pen = loadImage(ASSET_PATH + 'pen.svg');
  assets.glasses = loadImage(ASSET_PATH + 'glasses.svg');
  assets.stamps = loadImage(ASSET_PATH + 'stamps.svg');
  assets.button = loadImage(ASSET_PATH + 'button.png'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Special Elite');
  imageMode(CENTER);

  // Initialize Audio 
  initAudioSystem(); 

  let originX = width / 2;
  let originY = height / 2;

  // Initialize Fate Web
  for (let i = 0; i < 500; i++) {
    fateThreads.push(new FateThread());
  }

  // Initialize Items
  items.push(new MemoryItem(assets.button, originX, originY, 65, 0.3, "ANC_00", "The final anchor."));
  items.push(new MemoryItem(assets.jacket, originX, originY, 320, 0.05, "OBJ_01", "The weight of his absence."));
  items.push(new MemoryItem(assets.letters, originX + 40, originY + 20, 160, 0.1, "DOC_88", "Unread ink, yellowed time."));
  items.push(new MemoryItem(assets.glasses, originX - 60, originY - 20, 110, 0.12, "VIS_02", "Seeing the world through him."));
  items.push(new MemoryItem(assets.pen, originX + 20, originY - 60, 80, 0.18, "PTR_09", "The last line never written."));
  items.push(new MemoryItem(assets.stamps, originX - 30, originY + 60, 90, 0.15, "COL_04", "Postmarked memories."));
}

function draw() {
  if (state === "loading") {
    drawLoadingScreen();
  } else {
    // Suitcase Atmosphere
    background(217, 197, 163, 160);
    
    // Draw the chaotic background web
    for (let f of fateThreads) f.display();

    if (state === "intro") {
      drawIntro();
    } else {
      runEnvironment();
      updateAudio(items); // From audio.js
    }
  }
  drawVignette();
}

// --- SCREEN STATES ---

function drawLoadingScreen() {
  background(20, 15, 10); 
  
  textAlign(CENTER);
  fill(180, 0, 0, 150);
  textSize(18);
  
  // Oulipo reveal of Hint Fiction
  let currentString = words.slice(0, floor(displayedWords)).join(" ");
  text(currentString, width/2, height/2);

  if (displayedWords < words.length + 1) {
    displayedWords += 0.06; // Speed of text reveal
  } else {
    let flicker = 100 + sin(frameCount * 0.05) * 50;
    fill(217, 197, 163, flicker);
    textSize(12);
    text("—  —", width/2, height/2 + 60);
  }
  
  // Visual Static
  if (random(1) > 0.9) {
    stroke(255, 15);
    line(0, random(height), width, random(height));
  }
}

function drawIntro() {
  push();
  translate(width / 2 + random(-0.3, 0.3), height / 2 + random(-0.3, 0.3));
  let s = (height * 0.7) / assets.closed.height;
  image(assets.closed, 0, 0, assets.closed.width * s, height * 0.7);
  pop();

  textAlign(CENTER);
  let flicker = 150 + sin(frameCount * 0.1) * 50;
  fill(80, 50, 30, flicker); 
  textSize(18);
  text("— in memory of the shadows he left —", width / 2, height - 70);
  
  fill(80, 50, 30, flicker * 0.5);
  textSize(12);
  text("( )", width / 2, height - 45);
}

function runEnvironment() {
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.92;
  }

  let s = (height * 0.7) / assets.open.height;
  image(assets.open, width / 2, height / 2, assets.open.width * s, height * 0.7);

  for (let item of items) {
    item.update();
    item.display();
  }

  drawSnowballPoem();
}

// --- INTERACTION ---

function mousePressed() {
  // 1. Transition from Loading to Intro
  if (state === "loading") {
    if (displayedWords >= words.length) {
      clarifyAudio(); // In audio.js
      state = "intro";
    }
    return;
  }
  
  // 2. Transition from Intro to Suitcase
  if (state === "intro") {
    state = "suitcase";
    opened = true;
    shakeAmount = 15;
    playOpenSound(); // In audio.js
    return;
  }
  
  // 3. Dragging Items
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].isOver()) {
      items[i].isDragging = true;
      if (!items[i].hasMoved) {
        items[i].hasMoved = true;
        currentLine = min(currentLine + 1, poem.length - 1);
        shakeAmount = currentLine * 3;
      }
      break; 
    }
  }
}

function mouseReleased() {
  for (let item of items) item.isDragging = false;
}

// --- CLASSES & HELPERS ---

class MemoryItem {
  constructor(img, x, y, w, mass, label, snippet) {
    this.img = img;
    this.pos = createVector(x, y);
    this.origin = createVector(x, y);
    this.w = w; this.h = (img.height / img.width) * w;
    this.mass = mass; this.label = label; this.snippet = snippet; 
    this.isDragging = false; this.hasMoved = false;
    this.angle = random(-0.1, 0.1); this.noiseOffset = random(1000);
  }

  update() {
    if (this.isDragging) {
      this.pos.x = lerp(this.pos.x, mouseX, this.mass);
      this.pos.y = lerp(this.pos.y, mouseY, this.mass);
      this.angle = lerp(this.angle, (mouseX - pmouseX) * 0.05, 0.1);
    } else {
      this.pos.y += sin(frameCount * 0.03 + this.noiseOffset) * 0.15;
    }
  }

  display() {
    let d = dist(this.pos.x, this.pos.y, width/2, height/2);
    let decay = map(d, 0, width * 0.5, 0, 1, true);

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);

    if (this.label === "ANC_00") {
      let pulse = sin(frameCount * 0.05) * 15;
      drawingContext.shadowBlur = 20 + pulse;
      drawingContext.shadowColor = 'rgba(255, 0, 0, 0.6)';
    } else {
      drawingContext.shadowBlur = this.isDragging ? 25 : 8;
      drawingContext.shadowColor = 'rgba(40, 20, 0, 0.4)';
    }

    image(this.img, 0, 0, this.w, this.h);
    
    // FIX: Only draw UI if the item is currently being dragged, 
    // or if it has already been moved from its origin.
    // The Button (ANC_00) remains visible as the core anchor.
    if (this.isDragging || this.hasMoved || (this.label === "ANC_00" && d > 10)) {
      this.drawTrackingUI(decay);
    }
    pop();
  }

  drawTrackingUI(decay) {
    let isButton = (this.label === "ANC_00");
    let activeRed = color(180, 0, 0, isButton ? 255 : map(decay, 0, 1, 220, 40));
    stroke(activeRed); noFill(); strokeWeight(isButton ? 1.5 : 0.8);

    let b = this.w * 0.55; 
    line(-b, -b, -b + 10, -b); line(-b, -b, -b, -b + 10);
    line(b, b, b - 10, b); line(b, b, b, b - 10);

    if (isButton) line(-b, map(sin(frameCount * 0.1), -1, 1, -b, b), b, map(sin(frameCount * 0.1), -1, 1, -b, b));

    fill(activeRed); noStroke(); textSize(10); textAlign(LEFT);
    let corrupted = this.getGlitchText(this.snippet, isButton ? decay * 0.2 : decay);
    text(`[ID:${this.label}]`, b + 8, -b + 10);
    text(`[MEM:${corrupted}]`, b + 8, -b + 22);
    text(isButton ? "[CORE_ANCHOR_ACTIVE]" : `[LOSS:${(decay * 100).toFixed(1)}%]`, b + 8, -b + 34);

    pop();
    push();
    let cX = width/2, cY = height/2;
    stroke(180, 0, 0, isButton ? 200 : map(decay, 0, 1, 40, 120));
    strokeWeight(isButton ? 3 : 1); noFill();
    beginShape();
    vertex(this.pos.x, this.pos.y);
    bezierVertex(this.pos.x, cY, cX, this.pos.y, cX, cY);
    endShape();
    if (isButton) { fill(180, 0, 0, 150 + sin(frameCount * 0.1) * 50); ellipse(cX, cY, 8, 8); }
    pop();
    push(); translate(this.pos.x, this.pos.y); rotate(this.angle);
  }

  getGlitchText(str, amt) {
    if (amt < 0.15) return str;
    let chars = str.split('');
    for (let i = 0; i < chars.length; i++) if (random() < amt * 0.8) chars[i] = random(["Ø", "!", "NaN", "x", "??"]);
    return chars.join('');
  }

  isOver() { return dist(mouseX, mouseY, this.pos.x, this.pos.y) < this.w / 2; }
}
class FateThread {
  constructor() {
    this.x1 = random(width); this.y1 = random(height);
    this.x2 = random(width); this.y2 = random(height);
    this.opacity = random(15, 45); this.weight = random(0.3, 0.8);
    this.seedX1 = random(1000); this.seedY1 = random(1000);
    this.seedX2 = random(1000); this.seedY2 = random(1000);
    this.speed = random(0.002, 0.005);
  }
  display() {
    let x1Off = map(noise(this.seedX1 + frameCount * this.speed), 0, 1, -50, 50);
    let y1Off = map(noise(this.seedY1 + frameCount * this.speed), 0, 1, -50, 50);
    let x2Off = map(noise(this.seedX2 + frameCount * this.speed), 0, 1, -50, 50);
    let y2Off = map(noise(this.seedY2 + frameCount * this.speed), 0, 1, -50, 50);
    stroke(130, 20, 20, this.opacity); strokeWeight(this.weight); noFill();
    beginShape();
    let cx1 = this.x1 + x1Off, cy1 = this.y1 + y1Off, cx2 = this.x2 + x2Off, cy2 = this.y2 + y2Off;
    vertex(cx1, cy1);
    bezierVertex(cx1 + random(-2,2), cy1 + random(-2,2), cx2 + random(-2,2), cy2 + random(-2,2), cx2, cy2);
    endShape();
  }
}

function drawSnowballPoem() {
  push();
  let x = width * 0.75, y = height * 0.3;
  for (let i = 1; i <= currentLine; i++) {
    fill(40, 20, 10, map(i, 1, currentLine, 70, 255));
    textSize(14 + i * 2); text(poem[i], x, y + (i * 50));
  }
  pop();
}

function drawVignette() {
  push(); noFill();
  for (let i = 0; i < 20; i++) {
    stroke(40, 30, 20, i * 4); strokeWeight(height / 10);
    rect(0, 0, width, height);
  }
  pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }