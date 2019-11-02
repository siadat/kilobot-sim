let RADIUS = 1; // best performance

const DEV = false;

let SIZE = {
  w: window.innerWidth,
  h: window.innerHeight-10,
}

const equalZooms = (v1, v2) => {
  if(v1 == null || v2 == null)
    return false;

  return v1.ZOOM == v2.ZOOM;
}

const copyView = (v) =>{
  return {
    PAN: {
      x: v.PAN.x,
      y: v.PAN.y,
    },
    ZOOM: v.ZOOM,
  }
}

const FAST = !false;

const Order = [
  'Shape',
  'OriginGrid',
  'Shadow',
  'TraversedPath',
  'RobustQuadlateral',
  'ConnsAndBouns',
  'Robots',
  'LocalizationError',
]

let INITIAL_DIST = 3 * RADIUS;
let NEIGHBOUR_DISTANCE = INITIAL_DIST/3*11; // 11 * RADIUS; // 4 * RADIUS + 2 * RADIUS * Math.sqrt(3);

// const SQRT3 = Math.sqrt(3);

const PERFECT = false;

const TICKS_BETWEEN_MSGS = 30/2;
const LOOP_PER_SECOND = 30;

let DRAW_CONNS_AND_BOUNDS = !false;
let DRAW_SHADOW = false;
let DRAW_SHAPE_DESCRIPTION = true;

let BENCHMARKING = true;
if(BENCHMARKING) {
  // DRAW_SHAPE_DESCRIPTION = false;
  DRAW_CONNS_AND_BOUNDS = false;
}

const DARK_MODE = !true;
const FRAME_LIMIT = null;
const MAX_DEPTH = 3;
const FRAMES_PER_BODY = 50;
let RAND_SEED = 0;
const NO_COLLISION = 0;
const BODY_ID_IGNORE = 0;

const ContinueQuery = true;
const StopQuery = false;

const _tempMathRandom = new Math.seedrandom(1234);
const noise = function(magnitude) {
  return magnitude * (_tempMathRandom()-0.5);
}

const clampVector = function(v) {
  const MAX = 0.01;

  if(v.x > MAX) {
    v.x = MAX;
  } else if(v.x < -MAX) {
    v.x = -MAX;
  }

  if(v.y > MAX) {
    v.y = MAX;
  } else if(v.y < -MAX) {
    v.y = -MAX;
  }

  return v;
}

const zIndexOf = (name) => {
  let zIndex = Order.indexOf(name);
  if(zIndex == -1) {
    console.error(`name=${name} not found in order list`);
  }
  return zIndex;
}

const forEachObj = function(obj, f) {
  let i = 0;
  Object.keys(obj).forEach(k => {
    let item = obj[k];
    f(item, k, i);
    i++;
  });
}

const pow2 = function(x) {
  return x * x;
}

const pow3 = function(x) {
  return x * x * x;
}

const calcSlope = function(pos1, pos2) {
  return (pos2.y - pos1.y) / (pos2.x - pos1.x);
}

const positiveMod = function(num, n) {
  return ((num % n) + n) % n;
}

const calcDegree = function(pos1, pos2) {
  let d = calcDist(pos1, pos2);
  return (pos2.y - pos1.y) / (pos2.x - pos1.x);
}

const calcDist = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}

const calcDistBox2D = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.get_x() - pos2.get_x(), 2) + Math.pow(pos1.get_y() - pos2.get_y(), 2)
  );
}

function randomItem(array) {
  if(array.length == 0) {
    console.error("randomItem: array is empty");
    return undefined;
  }
  return array[Math.floor(array.length * _tempMathRandom())];
}
