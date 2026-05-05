// --- Logic State ---
let surfaceTexture, cloudTexture; 
let currentSeed;    
let isGenerating = false;
let isHD = false; // Toggle for resolution

// --- UI ---
let detailSlider, seaLevelSlider, tempSlider;
let cloudDensitySlider, cloudCoverageSlider;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Start with Normal Res for speed
  surfaceTexture = createGraphics(512, 256);
  cloudTexture = createGraphics(512, 256);
  currentSeed = random(100000);

  setupUI();
  generateNewPlanet();
}

function draw() {
  background(5); 
  orbitControl(); 
  
  // Lighting
  ambientLight(30); 
  directionalLight(255, 252, 245, 0.6, 0.3, -1);

  // Starfield
  push();
  noLights();
  randomSeed(111); 
  for(let i=0; i<300; i++) {
    stroke(200);
    let p = p5.Vector.random3D().mult(width * 1.2);
    point(p.x, p.y, p.z);
  }
  pop();

  // Draw Planet Layers
  rotateY(frameCount * 0.003);
  
  // Surface
  push();
  texture(surfaceTexture);
  noStroke();
  sphere(height / 3.5, 96, 96); 
  pop();

  // Clouds (Slightly larger)
  push();
  texture(cloudTexture);
  noStroke();
  rotateY(frameCount * 0.001); // Clouds move independently
  sphere(height / 3.42, 96, 96); 
  pop();
}

function setupUI() {
  let ui = createDiv('').position(20, 20);
  ui.style('color', 'white').style('background', 'rgba(0,0,0,0.8)').style('padding', '15px').style('border-radius', '8px');

  createDiv('SURFACE & CLOUDS').style('font-weight', 'bold');
  
  detailSlider = createSlider(0.005, 0.1, 0.02, 0.001).parent(ui);
  seaLevelSlider = createSlider(0.1, 0.8, 0.4, 0.01).parent(ui);
  tempSlider = createSlider(0, 1, 0.5, 0.01).parent(ui);
  cloudDensitySlider = createSlider(1, 15, 6, 0.1).parent(ui);
  cloudCoverageSlider = createSlider(0.1, 0.9, 0.45, 0.01).parent(ui);

  // Normal Gen Button
  let btnLow = createButton('FAST GENERATE').parent(ui);
  btnLow.mousePressed(() => { isHD = false; generateNewPlanet(); });

  // HD Gen Button
  let btnHigh = createButton('HD RENDER (SLOW)').parent(ui);
  btnHigh.style('margin-left', '10px');
  btnHigh.mousePressed(() => { isHD = true; generateNewPlanet(); });
}

function generateNewPlanet() {
  if (isGenerating) return;
  isGenerating = true;
  
  // Resize buffers based on mode[cite: 2]
  let resX = isHD ? 2048 : 512;
  let resY = isHD ? 1024 : 256;
  surfaceTexture.resizeCanvas(resX, resY);
  cloudTexture.resizeCanvas(resX, resY);

  setTimeout(() => {
    currentSeed = random(100000);
    renderWorld();
    isGenerating = false;
  }, 50);
}

function renderWorld() {
  surfaceTexture.loadPixels();
  cloudTexture.clear();
  cloudTexture.loadPixels();
  noiseSeed(currentSeed);

  let roughness = detailSlider.value();
  let seaLevel = seaLevelSlider.value();
  let temp = tempSlider.value();

  for (let y = 0; y < surfaceTexture.height; y++) {
    for (let x = 0; x < surfaceTexture.width; x++) {
      let theta = map(x, 0, surfaceTexture.width, 0, TWO_PI);
      let phi = map(y, 0, surfaceTexture.height, 0, PI);
      let nx = cos(theta) * sin(phi);
      let ny = sin(theta) * sin(phi);
      let nz = cos(phi);

      // --- SURFACE NOISE ---
      let ns = roughness * 100;
      let v = noise(nx * ns, ny * ns, nz * ns) * 0.6;
      v += noise(nx * ns * 4, ny * ns * 4, nz * ns * 4) * 0.2;
      v += noise(nx * ns * 12, ny * ns * 12, nz * ns * 12) * 0.1;

      // --- BUMP MAP LOGIC (Fake Shadows) ---
      // Sample a neighbor pixel to find the "slope"[cite: 2]
      let vNeighbor = noise((nx + 0.01) * ns, ny * ns, nz * ns) * 0.6;
      let slope = v - vNeighbor; 
      let shadow = map(slope, -0.05, 0.05, 0.5, 1.5); // Darken or brighten based on slope[cite: 2]

      let col;
      if (v < seaLevel) {
        col = lerpColor(color(5, 20, 80), color(0, 150, 255), map(v, 0, seaLevel, 0, 1));
      } else {
        if (temp > 0.75) col = lerpColor(color(210, 150, 70), color(100, 40, 10), v);
        else if (temp < 0.25) col = lerpColor(color(200, 220, 230), color(255), v);
        else {
          if (v < seaLevel + 0.015) col = color(225, 205, 150);
          else if (v < 0.6) col = color(34, 139, 34);
          else col = color(100);
        }
        // Apply Bump Shadow to land only[cite: 2]
        col = color(red(col) * shadow, green(col) * shadow, blue(col) * shadow);
      }
      surfaceTexture.set(x, y, col);

      // --- CLOUD NOISE ---
      let cd = cloudDensitySlider.value();
      let cv = noise(nx * cd, ny * cd, nz * cd + 50);
      if (cv > map(cloudCoverageSlider.value(), 0, 1, 0.8, 0.2)) {
        cloudTexture.set(x, y, color(255, map(cv, 0.4, 1, 0, 200)));
      }
    }
  }
  surfaceTexture.updatePixels();
  cloudTexture.updatePixels();
}