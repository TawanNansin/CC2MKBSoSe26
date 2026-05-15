let particles = [];
const STARS_PER_CLUSTER = 60;

let bgStars = [];
const BG_STAR_COUNT = 2000;

// Read from sliders
function getClusterCount() { return int(document.getElementById('sl-clusters').value); }
function getRadius()       { return int(document.getElementById('sl-spread').value); }
function getRotSpeed()     { return map(int(document.getElementById('sl-speed').value), 0, 10, 0, 0.004); }


function generateBackgroundStars() {
  bgStars = [];
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    bgStars.push({
      x: random(width),
      y: random(height),
      size: random(0.2, 1.2),
      brightness: random(80, 200),
      twinkleSpeed: random(0.005, 0.02),
      offset: random(TWO_PI)
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Wire up live value labels
  document.getElementById('sl-clusters').addEventListener('input', function() {
    document.getElementById('val-clusters').textContent = this.value;
  });
  document.getElementById('sl-spread').addEventListener('input', function() {
    document.getElementById('val-spread').textContent = this.value;
  });
  document.getElementById('sl-speed').addEventListener('input', function() {
    let v = map(int(this.value), 0, 10, 0, 2).toFixed(1);
    document.getElementById('val-speed').textContent = v + 'x';
  });

  // Regenerate button
  document.getElementById('btn-generate').addEventListener('click', generateClusteredUniverse);

  generateClusteredUniverse();
  generateBackgroundStars();
  setupPlayer();
}

function generateClusteredUniverse() {
  particles = [];
  let RADIUS = getRadius();
  let CLUSTER_COUNT = getClusterCount();

  let colors = [
    [150, 200, 255],
    [255, 255, 255],
    [255, 200, 150],
    [255, 100, 100]
  ];

  for (let i = 0; i < CLUSTER_COUNT; i++) {
    let theta = random(TWO_PI);
    let phi = acos(random(-1, 1));
    let cx = RADIUS * sin(phi) * cos(theta);
    let cy = RADIUS * sin(phi) * sin(theta);
    let cz = RADIUS * cos(phi);

    for (let j = 0; j < STARS_PER_CLUSTER; j++) {
      let offset = p5.Vector.random3D().mult(random(30, 150));
      let c = random(colors);
      particles.push({
        x: cx + offset.x,
        y: cy + offset.y,
        z: cz + offset.z,
        size: random(1, 3.5),
        col: [...c],
        pulseSpeed: random(0.01, 0.05),
        offset: random(TWO_PI)
      });
    }
  }
}

function project(x, y, z, aY, aX) {
  let cosY = cos(aY), sinY = sin(aY);
  let x1 = x * cosY + z * sinY;
  let z1 = -x * sinY + z * cosY;

  let cosX = cos(aX), sinX = sin(aX);
  let y1 = y * cosX - z1 * sinX;
  let z2 = y * sinX + z1 * cosX;

  let fov = 600;
  let s = fov / (fov + z2);

  return { sx: x1 * s + width / 2, sy: y1 * s + height / 2, scale: s, z: z2 };
}

function draw() {
  background(0);
  drawBackgroundStars();
  let speed = getRotSpeed();
  let aY = frameCount * speed;
  let aX = frameCount * speed * 0.5;

  blendMode(ADD);
  noStroke();

  for (let p of particles) {
    let proj = project(p.x, p.y, p.z, aY, aX);
    if (proj.z > -500) {
      let pulse = sin(frameCount * p.pulseSpeed + p.offset);
      let intensity = map(pulse, -1, 1, 0.8, 1.2);
      let [r, g, b] = p.col;
      let s = p.size * proj.scale * 2;

      for (let i = 6; i > 0; i--) {
        fill(r, g, b, (8 / i) * intensity);
        ellipse(proj.sx, proj.sy, s * (i * 3), s * (i * 3));
      }

      fill(255, 255, 255, 210 * intensity);
      ellipse(proj.sx, proj.sy, s, s);
    }
  }

  blendMode(BLEND);
}

function drawBackgroundStars() {
  noStroke();
  blendMode(BLEND);
  for (let s of bgStars) {
    let twinkle = sin(frameCount * s.twinkleSpeed + s.offset);
    let alpha = map(twinkle, -1, 1, s.brightness * 0.6, s.brightness);
    fill(255, 255, 255, alpha);
    ellipse(s.x, s.y, s.size, s.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateBackgroundStars();
}


// --- MUSIC PLAYER ---
function setupPlayer() {
  const playlist = [
    { file: "CanYouFeelMyWarmthInSpace.mp3",  title: "Can You Feel My Warmth In Space" },
    { file: "CloseInTheDistance.mp3",          title: "Close In The Distance" },
    { file: "ComeAliveLofi.mp3",               title: "Come Alive (Lofi)" },
    { file: "DawntrailLofi.mp3",               title: "Dawntrail (Lofi)" },
    { file: "FFMainThemeLofi.mp3",             title: "FF Main Theme (Lofi)" },
    { file: "FootfallsLofi.mp3",               title: "Footfalls (Lofi)" },
    { file: "KuganeLofi.mp3",                  title: "Kugane (Lofi)" },
    { file: "LuminaraLofi.mp3",                title: "Luminara (Lofi)" },
    { file: "SimpleFoldLofi.mp3",              title: "Simple Fold (Lofi)" },
    { file: "StarSong.mp3",                    title: "Star Song" },
    { file: "TornFromHeavenLofi.mp3",          title: "Torn From Heaven (Lofi)" },
    { file: "ToTheShoresEndLofi.mp3",          title: "To The Shores End (Lofi)" },
  ];

  let currentIndex = 0;

  const audio     = document.getElementById('audio');
  const btnPlay   = document.getElementById('btn-play');
  const btnPrev   = document.getElementById('btn-prev');
  const btnNext   = document.getElementById('btn-next');
  const progress  = document.getElementById('progress-bar');
  const volume    = document.getElementById('volume-bar');
  const timeCur   = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const title     = document.getElementById('player-title');

  audio.volume = 0.7;

  function formatTime(s) {
    let m = floor(s / 60);
    let sec = floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function loadTrack(index, autoplay = false) {
    let track = playlist[index];
    audio.src = 'assets/' + track.file;
    title.textContent = '♪ ' + track.title;
    progress.value = 0;
    timeCur.textContent = '0:00';
    timeTotal.textContent = '0:00';
    btnPlay.textContent = '▶';
    if (autoplay) {
      audio.play();
      btnPlay.textContent = '⏸';
    }
  }

  function nextTrack(autoplay = true) {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(currentIndex, autoplay);
  }

  function prevTrack() {
    // If more than 3 seconds in, restart current track instead
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      loadTrack(currentIndex, !audio.paused);
    }
  }

  // Play / Pause
  btnPlay.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      btnPlay.textContent = '⏸';
    } else {
      audio.pause();
      btnPlay.textContent = '▶';
    }
  });

  btnNext.addEventListener('click', () => nextTrack(!audio.paused));
  btnPrev.addEventListener('click', () => prevTrack());

  // Auto advance when track ends
  audio.addEventListener('ended', () => nextTrack(true));

  // Progress bar update
  audio.addEventListener('timeupdate', () => {
    let pct = (audio.currentTime / audio.duration) * 100;
    progress.value = isNaN(pct) ? 0 : pct;
    timeCur.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  // Scrubbing
  progress.addEventListener('input', () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  // Volume
  volume.addEventListener('input', () => {
    audio.volume = volume.value;
  });

  // Load first track
  loadTrack(0);
}