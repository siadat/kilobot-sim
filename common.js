let SCALE = 1;

let OFFSET = {
  x: 0,
  y: 0,
}

let SIZE = {
  w: 770 * 0.5 * SCALE,
  h: 680 * 0.5 * SCALE,
}

const COUNT = 200;
const FRAME_LIMIT = 100;
const MAX_DEPTH = 3;
const FRAMES_PER_BODY = 50;
let RAND_SEED = 0;
const NO_COLLISION = 0;
const randomPos = {x: SIZE.w*Math.random(), y: SIZE.h*Math.random()};

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
