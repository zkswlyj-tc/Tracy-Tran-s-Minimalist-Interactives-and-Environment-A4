let particles = [];
const spacing = 22; 
const fearRadius = 160;
let decayLevel = 0;

//ENTRANCE 
document.addEventListener('DOMContentLoaded', function() {
  const entryButton = document.getElementById('entry-button');
  const entranceOverlay = document.getElementById('entrance-overlay');
  const canvasContainer = document.getElementById('canvas-container');

  entryButton.addEventListener('click', function() {
    entranceOverlay.classList.add('hidden');
    canvasContainer.classList.remove('hidden');
    if (typeof windowResized === 'function') windowResized();
  });
});

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      particles.push(new Particle(x, y));
    }
  }
}

function draw() {
  background(10, 10, 12, 12); 

  if (mouseX !== pmouseX || mouseY !== pmouseY) {
    decayLevel = lerp(decayLevel, 1, 0.01);
  } else {
    decayLevel = lerp(decayLevel, 0, 0.005);
  }

  particles.forEach(p => {
    p.update();
    p.display();
  });
}

class Particle {
  constructor(x, y) {
    this.origin = createVector(x, y);
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.homeLeaning = 0.005; 
    this.integrity = 1.0; 
    this.isBroken = false;
  }

  update() {
    let mouse = createVector(mouseX, mouseY);
    let d = dist(this.pos.x, this.pos.y, mouse.x, mouse.y);
    
    // THE IMPACT 
    if (d < fearRadius) {
      let flee = p5.Vector.sub(this.pos, mouse);
      
      //DECAY
      this.integrity -= 0.015; 
      
      if (this.integrity < 0.2) this.isBroken = true;

      let jitter = map(this.integrity, 1, 0, 1, 12); 
      flee.add(random(-jitter, jitter), random(-jitter, jitter)); 
      
      flee.setMag(map(d, 0, fearRadius, 2.0, 0)); 
      this.acc.add(flee);
      this.homeLeaning = lerp(this.homeLeaning, 0.00001, 0.2);
    } else {
      //HEALING
      this.integrity = min(this.integrity + 0.0005, 0.7); 
      this.homeLeaning = lerp(this.homeLeaning, 0.02, 0.005); 
    }

    // REVERSION
    let homeStrength = this.isBroken ? this.homeLeaning * 0.05 : this.homeLeaning;
    let home = p5.Vector.sub(this.origin, this.pos);
    this.acc.add(home.mult(homeStrength));

    // NOISE
    let n = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.005);
    this.acc.add(p5.Vector.fromAngle(n * TWO_PI).mult(0.1));

    this.vel.add(this.acc);
    // LIMITS
    this.vel.limit(this.isBroken ? 0.5 : 2); 
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.92); 
  }
  display() {
    let d = dist(this.pos.x, this.pos.y, mouseX, mouseY);
    // Color logic
    let r = map(this.integrity, 1, 0, 200, 255);
    let g = map(this.integrity, 1, 0, 200, 50);
    let b = map(this.integrity, 1, 0, 220, 100);
    let a = map(d, 0, fearRadius, 20, 200); 
    
    stroke(r, g, b, a);
    
    //jagged shard
    strokeWeight(this.isBroken ? 1.5 : 0.8);

    push();
    translate(this.pos.x, this.pos.y);
    if (this.isBroken) {
        rotate(this.vel.heading());
        line(-5, 0, 5, 0); // shard
    } else {
        line(-2, 0, 2, 0); // crosshair
        line(0, -2, 0, 2);
    }
    pop();
  }
}