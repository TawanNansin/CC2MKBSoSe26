let surfaceTexture, cloudTexture; 
let currentSeed;    
let isGenerating = false;
let isHD = false; 

let bgMusic;
let musicLoaded = false;
let musicStarted = false;

let stars = []; 

// UI Elements
let detailSlider, seaLevelSlider, tempSlider, cloudDensitySlider, cloudCoverageSlider, muteBtn;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // High-def starting buffers
  surfaceTexture = createGraphics(1024, 512);
  cloudTexture = createGraphics(1024, 512);
  currentSeed = floor(random(1000000));

  // Static Starfield
  for (let i = 0; i < 600; i++) {
    stars.push(p5.Vector.random3D().mult(width * 2.5));
  }

  setupUI();
  
  soundFormats('mp3', 'ogg');
  bgMusic = loadSound('assets/CloseInTheDistance.mp3', 
    () => { musicLoaded = true; muteBtn.html('MUSIC READY (Click Gen)'); muteBtn.style('background', '#2e7d32'); },
    () => { musicLoaded = false; muteBtn.html('MUSIC NOT FOUND (404)'); muteBtn.style('background', '#c62828'); }
  );

  generateNewPlanet();
}

// FBm Noise for crisp details
function fractalNoise(x, y, z, octaves, persistence) {
  let total = 0;
  let freq = 1;
  let amp = 1;
  let maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * freq, y * freq, z * freq) * amp;
    maxVal += amp;
    amp *= persistence;
    freq *= 2.1; // Slightly non-integer for more "organic" jaggedness
  }
  return total / maxVal;
}

function draw() {
  background(5); 
  
  // 1. Draw Starfield (No Depth Testing so stars don't clip)
  push();
  noLights();
  strokeWeight(1.2);
  for (let i = 0; i < stars.length; i++) {
    stroke(255, random(150, 255)); 
    point(stars[i].x, stars[i].y, stars[i].z);
  }
  pop();

  orbitControl(); 
  
  // Lighting
  ambientLight(60); 
  directionalLight(255, 250, 230, 0.5, 0.2, -1);

  rotateY(frameCount * 0.0015);

  // 2. PLANET SURFACE (Draw this first)
  push();
  texture(surfaceTexture);
  noStroke();
  sphere(height / 3.5, 128, 128); 
  pop();

  // 3. CLOUDS (Draw second)
  push();
  texture(cloudTexture);
  noStroke();
  rotateY(frameCount * 0.0005); 
  sphere(height / 3.45, 128, 128); 
  pop();

  // 4. ATMOSPHERE GLOW (Draw last with transparency)
  // This is what was causing the "Black/Zoom" issue. 
  // We make it slightly larger and very faint.
  push();
  fill(100, 180, 255, 25); // Very low alpha (25)
  noStroke();
  sphere(height / 3.4, 64, 64);
  pop();
}

function renderWorld() {
  surfaceTexture.loadPixels();
  cloudTexture.clear();
  cloudTexture.loadPixels();
  noiseSeed(currentSeed);

  let r = detailSlider.value();
  let sl = seaLevelSlider.value();
  let t = tempSlider.value();
  let sOff = currentSeed * 1.5; 

  // Optimized loop for 1024x512 resolution
  for (let y = 0; y < surfaceTexture.height; y++) {
    for (let x = 0; x < surfaceTexture.width; x++) {
      let theta = (x / surfaceTexture.width) * TWO_PI;
      let phi = (y / surfaceTexture.height) * PI;
      let nx = cos(theta) * sin(phi) + sOff;
      let ny = sin(theta) * sin(phi) + sOff;
      let nz = cos(phi) + sOff;

      let ns = r * 120; // Scale
      
      // High-Octave Terrain (8 layers for Ultra detail)
      let v = fractalNoise(nx * ns, ny * ns, nz * ns, 8, 0.5);

      // Normal-Map Style Lighting (makes mountains look "sharp")
      let v2 = fractalNoise((nx + 0.002) * ns, ny * ns, (nz + 0.002) * ns, 8, 0.5);
      let lighting = map(v - v2, -0.01, 0.01, 0.6, 1.4);

      let col;
      if (v < sl) {
        // Deep blue to cyan water
        col = lerpColor(color(2, 10, 40), color(0, 100, 200), map(v, 0, sl, 0, 1));
      } else {
        // Advanced Biomes
        if (v > 0.85 || t < 0.2) col = color(250); // Snow
        else if (t > 0.8) col = lerpColor(color(210, 180, 140), color(120, 60, 20), v); // Desert
        else {
          if (v < sl + 0.02) col = color(220, 200, 160); // Beach
          else if (v < 0.65) col = color(30, 100, 30); // Forest
          else col = color(80, 75, 70); // Rock
        }
        // Apply "Bump" lighting to land only
        col = color(red(col) * lighting, green(col) * lighting, blue(col) * lighting);
      }
      surfaceTexture.set(x, y, col);

      // Whispy HD Clouds
      let cv = fractalNoise(nx * cloudDensitySlider.value() + 500, ny * cloudDensitySlider.value() + 500, nz * cloudDensitySlider.value() + 500, 5, 0.5);
      if (cv > map(cloudCoverageSlider.value(), 0, 1, 0.85, 0.15)) {
        cloudTexture.set(x, y, color(255, 210));
      }
    }
  }
  surfaceTexture.updatePixels();
  cloudTexture.updatePixels();
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

  detailSlider = addS('TERRAIN ROUGHNESS', 0.005, 0.15, 0.03, 0.001);
  seaLevelSlider = addS('SEA LEVEL', 0.1, 0.8, 0.45, 0.01);
  tempSlider = addS('TEMPERATURE', 0, 1, 0.5, 0.01);
  cloudDensitySlider = addS('CLOUD DENSITY', 1, 20, 8, 0.1);
  cloudCoverageSlider = addS('CLOUD COVERAGE', 0.1, 0.9, 0.4, 0.01);

  let btnRow = createDiv('').parent(ui).style('display', 'flex').style('gap', '5px');
  createButton('FAST').parent(btnRow).style('flex','1').mousePressed(() => { isHD = false; generateNewPlanet(); });
  createButton('HD').parent(btnRow).style('flex','1').mousePressed(() => { isHD = true; generateNewPlanet(); });
  
  createButton('RANDOMIZE WORLD').parent(ui).style('padding', '10px').style('background', '#444').style('color', 'white').mousePressed(() => { 
    currentSeed = floor(random(1000000)); 
    generateNewPlanet(); 
  });
}

function generateNewPlanet() {
  if (musicLoaded && !musicStarted) {
    bgMusic.loop();
    bgMusic.setVolume(0.4);
    musicStarted = true;
    muteBtn.html('MUTE MUSIC');
  }

  if (isGenerating) return; 
  isGenerating = true;
  
  // Force 1024x512 for HD feel
  let resX = isHD ? 2048 : 1024; 
  let resY = isHD ? 1024 : 512;
  surfaceTexture.resizeCanvas(resX, resY);
  cloudTexture.resizeCanvas(resX, resY);

  setTimeout(() => {
    renderWorld();
    isGenerating = false;
  }, 50);
}