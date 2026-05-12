// --- Cosmic Environment State ---
let stars = [];
const STAR_COUNT = 1200;
const CLUSTER_COUNT = 8; 

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // This is the "Secret Sauce" for Bloom in p5.js WebGL
  // blendMode(ADD) makes colors stack and glow where they overlap
  // Note: We apply this in the draw loop, but it's good to keep in mind!
  
  generateConstellations();
}

function generateConstellations() {
  stars = [];
  
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    // Pick a starting point and a direction for a "star ribbon"
    let startPos = p5.Vector.random3D().mult(random(800, 1500));
    let direction = p5.Vector.random3D().mult(random(200, 500));
    
    let groupSize = floor(random(40, 100));
    
    for (let j = 0; j < groupSize; j++) {
      // Interpolate along the direction to create a "line" or "cloud"
      let t = j / groupSize;
      let pathPos = p5.Vector.lerp(createVector(0,0,0), direction, t);
      
      // Add some "noise" so the line isn't perfectly straight
      let noiseOffset = createVector(
        randomGaussian(0, 100),
        randomGaussian(0, 100),
        randomGaussian(0, 100)
      );
      
      let finalPos = p5.Vector.add(startPos, pathPos).add(noiseOffset);
      
      stars.push({
        pos: finalPos,
        size: random(0.5, 3.5),
        // Use HSB-style logic for color variety (some blue, some white, some gold)
        col: color(random(180, 255), random(200, 255), 255), 
        pulseSpeed: random(0.01, 0.05),
        offset: random(TWO_PI)
      });
    }
  }
}

function draw() {
  background(2, 3, 10); // Very dark blue/black
  
  // Enables the "Bloom" look by adding pixel values together
  blendMode(ADD); 
  
  orbitControl(1, 1, 0.1);

  drawStars();
  
  // Reset blend mode for any UI or non-glowing elements if you add them later
  blendMode(BLEND); 
}

function drawStars() {
  noFill();
  
  for (let s of stars) {
    push();
    translate(s.pos.x, s.pos.y, s.pos.z);
    
    let pulse = sin(frameCount * s.pulseSpeed + s.offset);
    let intensity = map(pulse, -1, 1, 0.5, 1.2);
    
    // 1. THE OUTER RADIANCE (The Bloom)
    // We draw a large, low-opacity point. With blendMode(ADD),
    // these overlap to create a soft, ethereal fog.
    stroke(red(s.col), green(s.col), blue(s.col), 40 * intensity);
    strokeWeight(s.size * 6); 
    point(0, 0);

    // 2. THE CORE (The sharp star)
    stroke(255, 255, 255, 220 * intensity);
    strokeWeight(s.size);
    point(0, 0);
    
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    generateConstellations();
  }
}