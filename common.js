let OFFSET = {
  x: 0,
  y: 0,
}

let SIZE = {
  w: 2.5,
  h: 2.5,
}

let SCALE = 1.0;

{
  let dimensions = {
    w: $(window).width(),
    h: $(window).height(),
    // w: Math.min($(window).width(), 10),
    // h: $(window).height(),
  }
  let scale1 = 1.0 * dimensions.w / SIZE.w;
  let scale2 = 1.0 * dimensions.h / SIZE.h;
  SCALE = Math.min(scale1, scale2);
}

let gSIZE = {
  w: SIZE.w * SCALE,
  h: SIZE.h * SCALE,
}

// let RADIUS = 0.025;
let RADIUS = 0.035;
let NEIGHBOUR_DISTANCE = RADIUS * 4;

const MSG_PER_SEC = 2;
const PERFECT = false;
const COUNT = Math.floor(1024 * 1.0);
const DRAW_CONNECTIONS = false;
const DARK_MODE = !false;
const FRAME_LIMIT = null;
const MAX_DEPTH = 3;
const FRAMES_PER_BODY = 50;
let RAND_SEED = 0;
const NO_COLLISION = 0;
const randomPos = {x: SIZE.w*Math.random(), y: SIZE.h*Math.random()};

const ContinueQuery = true;
const StopQuery = false;

const noise = function(magnitude) {
  return magnitude * (Math.random()-0.5);
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

const calcDist = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}

function getRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '0x';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function randomIndex(array) {
  if(array.length == 0) {
    console.error("randomIndex: array is empty");
    return undefined;
  }
  return Math.floor(array.length * Math.random());
}

function randomItem(array) {
  if(array.length == 0) {
    console.error("randomItem: array is empty");
    return undefined;
  }
  return array[Math.floor(array.length * Math.random())];
}

function weightedRandomItem(array, weightAttribute) {
  const DEFAULT_WEIGHT = 1;

  let probSum = 0;
  array.forEach(x => probSum += (x[weightAttribute]||DEFAULT_WEIGHT));

  let chosen = Math.random() * probSum;
  let cursor = 0;
  let chosenIdx = 0;

  for (let j = 0; j < array.length; j++) {
    if(cursor > chosen) {
      chosenIdx = j;
      break;
    }
    cursor += array[j][weightAttribute] || DEFAULT_WEIGHT;
  }

  return array[chosenIdx];
}
