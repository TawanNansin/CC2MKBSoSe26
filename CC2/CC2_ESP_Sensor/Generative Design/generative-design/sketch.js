let particles = [];
const CLUSTER_COUNT = 15;
const STARS_PER_CLUSTER = 60;
const RADIUS = 600;

function setup() {
  createCanvas(windowWidth, windowHeight); // 2D mode - no WEBGL
  generateClusteredUniverse();
}

function generateClusteredUniverse() {
  particles = [];
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

// Manual 3D rotation + perspective projection
function project(x, y, z, aY, aX) {
  // Rotate Y
  let cosY = cos(aY), sinY = sin(aY);
  let x1 = x * cosY + z * sinY;
  let z1 = -x * sinY + z * cosY;

  // Rotate X
  let cosX = cos(aX), sinX = sin(aX);
  let y1 = y * cosX - z1 * sinX;
  let z2 = y * sinX + z1 * cosX;

  // Perspective
  let fov = 600;
  let s = fov / (fov + z2);

  return {
    sx: x1 * s + width / 2,
    sy: y1 * s + height / 2,
    scale: s,
    z: z2
  };
}

function draw() {
  background(0);

  let aY = frameCount * 0.001;
  let aX = frameCount * 0.0005;

  blendMode(ADD);
  noStroke();

  for (let p of particles) {
    let proj = project(p.x, p.y, p.z, aY, aX);
    if (proj.z > -500) { // skip stars behind the camera
      let pulse = sin(frameCount * p.pulseSpeed + p.offset);
      let intensity = map(pulse, -1, 1, 0.8, 1.2);
      let [r, g, b] = p.col;
      let s = p.size * proj.scale * 2;

      // Bloom layers
      for (let i = 6; i > 0; i--) {
        let alpha = (8 / i) * intensity;
        let size = s * (i * 3);
        fill(r, g, b, alpha);
        ellipse(proj.sx, proj.sy, size, size);
      }

      // Bright core
      fill(255, 255, 255, 210 * intensity);
      ellipse(proj.sx, proj.sy, s, s);
    }
  }

  blendMode(BLEND);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}