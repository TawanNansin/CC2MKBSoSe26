// --- Nebula Logic State ---
let innerGasTexture, outerGasTexture; 
let currentSeed;    
let isGenerating = false;
let isHD = false; 

// Harmony Colors
let gasColor1, gasColor2, gasColor3;

let bgMusic;
let musicLoaded = false;
let musicStarted = false;

let stars = []; 

// UI Elements
let roughnessSlider, densitySlider, swirlSlider, detailSlider, coverageSlider, muteBtn;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // High-def textures for gas clouds
  innerGasTexture = createGraphics(1024, 512);
  outerGasTexture = createGraphics(1024, 512);
  currentSeed = floor(random(1000000));

  // Initialize Palette
  randomizeColors();

  // Static Starfield (placed far away)
  for (let i = 0; i < 800; i++) {
    stars.push(p5.Vector.random3D().mult(width * 3));
  }

  setupUI();
  
  soundFormats('mp3', 'ogg');
  bgMusic = loadSound('assets/CloseInTheDistance.mp3', 
    () => { musicLoaded = true; muteBtn.html('MUSIC READY'); muteBtn.style('background', '#2e7d32'); },
    () => { musicLoaded = false; muteBtn.html('MUSIC NOT FOUND'); muteBtn.style('background', '#c62828'); }
  );

  generateNebula();
}

/**
 * Generates a harmonious color palette using HSB logic.
 * This ensures the colors always look "cosmic" and not muddy.
 */
function randomizeColors() {
  // Temporary switch to HSB to pick colors
  push();
  colorMode(HSB, 360, 100, 100);
  
  let baseHue = random(360);
  // Pick analogous colors (shifted hues) for harmony
  gasColor1 = color(baseHue, 90, 30);                // Dark deep gas
  gasColor2 = color((baseHue + 30) % 360, 80, 70);   // Glowing mid-tones
  gasColor3 = color((baseHue + 60) % 360, 30, 100);  // Bright highlights
  pop(); 
}

// FBm Noise Engine
function fractalNoise(x, y, z, octaves, persistence) {
  let total = 0;
  let freq = 1;
  let amp = 1;
  let maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * freq, y * freq, z * freq) * amp;
    maxVal += amp;
    amp *= persistence;
    freq *= 2.0;
  }
  return total / maxVal;
}

function draw() {
  background(2, 4, 12); 
  
  // 1. Draw Starfield
  push();
  noLights();
  strokeWeight(1.5);
  for (let i = 0; i < stars.length; i++) {
    stroke(255, random(150, 255)); 
    point(stars[i].x, stars[i].y, stars[i].z);
  }
  pop();

  orbitControl(); 
  ambientLight(200); // Gas should look "emissive"

  // 2. OUTER NEBULA LAYER
  push();
  texture(outerGasTexture);
  noStroke();
  rotateY(frameCount * 0.0002); 
  sphere(width * 2.2, 64, 64);
  pop();

  // 3. INNER NEBULA LAYER (Swirls closer)
  push();
  texture(innerGasTexture);
  noStroke();
  rotateY(-frameCount * 0.0004); 
  sphere(width * 1.8, 64, 64);
  pop();
}

function renderWorld() {
  renderLayer(innerGasTexture, 0.8);
  renderLayer(outerGasTexture, 1.4);
}

function renderLayer(pg, scaleMod) {
  pg.clear();
  pg.loadPixels();
  noiseSeed(currentSeed + (scaleMod * 500));

  let roughness = roughnessSlider.value();
  let density = densitySlider.value();
  let swirl = swirlSlider.value();
  let detail = detailSlider.value();
  let coverage = coverageSlider.value();
  let sOff = currentSeed * 0.05;

  for (let y = 0; y < pg.height; y++) {
    for (let x = 0; x < pg.width; x++) {
      let theta = (x / pg.width) * TWO_PI;
      let phi = (y / pg.height) * PI;
      let nx = cos(theta) * sin(phi) + sOff;
      let ny = sin(theta) * sin(phi) + sOff;
      let nz = cos(phi) + sOff;

      let ns = roughness * 60 * scaleMod;
      
      // DOMAIN WARPING (The Swirl Math)
      let ox = fractalNoise(nx * ns, ny * ns, nz * ns, 3, 0.5) * swirl;
      let oy = fractalNoise((nx + 5) * ns, (ny + 5) * ns, nz * ns, 3, 0.5) * swirl;
      
      let v = fractalNoise((nx + ox) * ns, (ny + oy) * ns, nz * ns, detail, 0.5);

      // Transparency and Color Mapping
      let alpha = map(v, coverage, 1, 0, 255, true);
      let col;
      
      if (v > 0.75) {
        col = lerpColor(gasColor2, gasColor3, map(v, 0.75, 1, 0, 1));
      } else {
        col = lerpColor(gasColor1, gasColor2, map(v, 0, 0.75, 0, 1));
      }

      pg.set(x, y, color(red(col), green(col), blue(col), alpha * density));
    }
  }
  pg.updatePixels();
}

function setupUI() {
  let ui = createDiv('').position(20, 20);
  ui.style('color', 'white').style('background', 'rgba(0,0,0,0.85)').style('padding', '20px').style('display', 'flex').style('flex-direction', 'column').style('gap', '10px').style('width', '220px').style('font-family', 'sans-serif').style('border-radius', '10px');

  muteBtn = createButton('MUSIC: LOADING...').parent(ui);
  muteBtn.style('padding', '8px').style('color', 'white').style('border', 'none').style('border-radius', '5px').style('cursor', 'pointer');
  
  function addS(label, min, max, val, step) {
    createDiv(label).parent(ui).style('font-size', '10px').style('font-weight', 'bold');
    let s = createSlider(min, max, val, step).parent(ui);
    s.style('width', '100%');
    return s;
  }

  roughnessSlider = addS('NEBULA ROUGHNESS', 0.01, 0.25, 0.06, 0.01);
  densitySlider = addS('GAS DENSITY', 0.1, 2.0, 1.0, 0.1);
  swirlSlider = addS('SWIRLINESS', 0, 3, 1.2, 0.1);
  detailSlider = addS('FRACTAL DETAIL', 4, 10, 6, 1);
  coverageSlider = addS('GAS COVERAGE', 0.1, 0.7, 0.4, 0.01);

  let btnRow = createDiv('').parent(ui).style('display', 'flex').style('gap', '5px');
  createButton('FAST').parent(btnRow).style('flex','1').mousePressed(() => { isHD = false; generateNebula(); });
  createButton('HD').parent(btnRow).style('flex','1').mousePressed(() => { isHD = true; generateNebula(); });
  
  createButton('RANDOMIZE EVERYTHING').parent(ui).style('padding', '10px').style('background', '#2c3e50').style('color', 'white').mousePressed(() => { 
    currentSeed = floor(random(1000000)); 
    randomizeColors();
    generateNebula(); 
  });
}

function generateNebula() {
  if (musicLoaded && !musicStarted) {
    bgMusic.loop();
    bgMusic.setVolume(0.4);
    musicStarted = true;
    muteBtn.html('MUTE MUSIC');
  }

  if (isGenerating) return; 
  isGenerating = true;
  
  let resX = isHD ? 1024 : 512; 
  let resY = isHD ? 512 : 256;
  innerGasTexture.resizeCanvas(resX, resY);
  outerGasTexture.resizeCanvas(resX, resY);

  setTimeout(() => {
    renderWorld();
    isGenerating = false;
  }, 50);
}