let surfaceTexture, cloudTexture; 
let currentSeed;    
let isGenerating = false;
let isHD = false; 

let bgMusic;
let musicLoaded = false;
let musicStarted = false;

// UI Elements
let detailSlider, seaLevelSlider, tempSlider, cloudDensitySlider, cloudCoverageSlider, muteBtn;

function preload() {
  // Keep empty to avoid the "Loading..." white screen
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  surfaceTexture = createGraphics(512, 256);
  cloudTexture = createGraphics(512, 256);
  currentSeed = floor(random(1000000));

  setupUI();
  
  // Try to load the music
  soundFormats('mp3', 'ogg');
  bgMusic = loadSound('assets/CloseInTheDistance.mp3', 
    () => { 
      musicLoaded = true; 
      muteBtn.html('MUSIC READY (Click Gen)'); 
      muteBtn.style('background', '#2e7d32'); // Green for success
    },
    () => { 
      musicLoaded = false; 
      muteBtn.html('MUSIC NOT FOUND (404)'); 
      muteBtn.style('background', '#c62828'); // Red for error
      
    }
  );

  generateNewPlanet();
}

function draw() {
  background(5); 
  orbitControl(); 
  
  ambientLight(70); 
  directionalLight(255, 252, 245, 0.5, 0.5, -1);

  // Starfield
  push();
  noLights();
  randomSeed(111); 
  for(let i=0; i<200; i++) {
    stroke(180);
    let p = p5.Vector.random3D().mult(width * 1.5);
    point(p.x, p.y, p.z);
  }
  pop();

  rotateY(frameCount * 0.002);

  // Planet Layers
  push();
  texture(surfaceTexture);
  noStroke();
  sphere(height / 3.5, 96, 96); 
  pop();

  push();
  texture(cloudTexture);
  noStroke();
  rotateY(frameCount * 0.001); 
  sphere(height / 3.42, 96, 96); 
  pop();
}

function setupUI() {
  let ui = createDiv('').position(20, 20);
  ui.style('color', 'white').style('background', 'rgba(0,0,0,0.85)').style('padding', '20px').style('display', 'flex').style('flex-direction', 'column').style('gap', '10px').style('width', '220px').style('font-family', 'sans-serif').style('border-radius', '10px');

  muteBtn = createButton('MUSIC: CHECKING...').parent(ui);
  muteBtn.style('padding', '8px').style('color', 'white').style('border', 'none').style('border-radius', '5px').style('cursor', 'pointer');
  
  function addS(label, min, max, val, step) {
    createDiv(label).parent(ui).style('font-size', '10px').style('font-weight', 'bold');
    let s = createSlider(min, max, val, step).parent(ui);
    s.style('width', '100%');
    return s;
  }

  detailSlider = addS('TERRAIN ROUGHNESS', 0.005, 0.1, 0.02, 0.001);
  seaLevelSlider = addS('SEA LEVEL', 0.1, 0.8, 0.4, 0.01);
  tempSlider = addS('TEMPERATURE', 0, 1, 0.5, 0.01);
  cloudDensitySlider = addS('CLOUD DENSITY', 1, 15, 6, 0.1);
  cloudCoverageSlider = addS('CLOUD COVERAGE', 0.1, 0.9, 0.45, 0.01);

  let btnRow = createDiv('').parent(ui).style('display', 'flex').style('gap', '5px');
  createButton('FAST').parent(btnRow).style('flex','1').mousePressed(() => { isHD = false; generateNewPlanet(); });
  createButton('HD').parent(btnRow).style('flex','1').mousePressed(() => { isHD = true; generateNewPlanet(); });
  
  createButton('RANDOMIZE WORLD').parent(ui).style('padding', '8px').mousePressed(() => { 
    currentSeed = floor(random(1000000)); 
    generateNewPlanet(); 
  });
}

function generateNewPlanet() {
  // Try to start music if it's loaded but hasn't started yet
  if (musicLoaded && !musicStarted) {
    bgMusic.loop();
    bgMusic.setVolume(0.5);
    musicStarted = true;
    muteBtn.html('MUTE MUSIC');
    muteBtn.style('background', '#444');
    
    muteBtn.mousePressed(() => {
      if (bgMusic.isPlaying()) {
        bgMusic.pause();
        muteBtn.html('PLAY MUSIC');
      } else {
        bgMusic.loop();
        muteBtn.html('MUTE MUSIC');
      }
    });
  }

  if (isGenerating) return; 
  isGenerating = true;
  
  let resX = isHD ? 1024 : 512; 
  let resY = isHD ? 512 : 256;
  surfaceTexture.resizeCanvas(resX, resY);
  cloudTexture.resizeCanvas(resX, resY);

  setTimeout(() => {
    renderWorld();
    isGenerating = false;
  }, 50);
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

  for (let y = 0; y < surfaceTexture.height; y++) {
    for (let x = 0; x < surfaceTexture.width; x++) {
      let theta = map(x, 0, surfaceTexture.width, 0, TWO_PI);
      let phi = map(y, 0, surfaceTexture.height, 0, PI);
      let nx = cos(theta) * sin(phi) + sOff;
      let ny = sin(theta) * sin(phi) + sOff;
      let nz = cos(phi) + sOff;

      let ns = r * 100;
      let v = noise(nx * ns, ny * ns, nz * ns) * 0.7 + noise(nx * ns * 4, ny * ns * 4, nz * ns * 4) * 0.3;

      let v2 = noise((nx + 0.005) * ns, ny * ns, (nz + 0.005) * ns) * 0.7;
      let lighting = map(v - v2, -0.01, 0.01, 0.7, 1.3);

      let col;
      if (v < sl) {
        col = lerpColor(color(10, 30, 80), color(0, 150, 255), map(v, 0, sl, 0, 1));
      } else {
        if (t > 0.7) col = lerpColor(color(200, 150, 80), color(100, 40, 10), v);
        else if (t < 0.3) col = color(220, 240, 255);
        else col = v > 0.65 ? color(100) : color(40, 120, 40);
        
        col = color(red(col) * lighting, green(col) * lighting, blue(col) * lighting);
      }
      surfaceTexture.set(x, y, col);

      let cv = noise(nx * cloudDensitySlider.value() + 500, ny * cloudDensitySlider.value() + 500, nz * cloudDensitySlider.value() + 500);
      if (cv > map(cloudCoverageSlider.value(), 0, 1, 0.8, 0.2)) {
        cloudTexture.set(x, y, color(255, 180));
      }
    }
  }
  surfaceTexture.updatePixels();
  cloudTexture.updatePixels();
}