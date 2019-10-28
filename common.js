let RADIUS = 1; // best performance

let CATS = {
  NONE: 0,
  ROBOT: 0b01,
  NEIGHBOR: 0b10,
}


const COUNT = 4 + 10;
const _ShapeScale = 1.5*RADIUS; // 1.5*RADIUS
let ShapeDesc = [[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" "," "," "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," ","#","#","#","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#","#","#","#"," "," "," "," ","#","#","#","#","#","#","#","#","#","#"," "," "],[" ","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "],[" ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "],[" ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "],[" "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "," "],[" "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "," "],[" "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "," "],[" "," "," ","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "]];
// let ShapeDesc = [
//   '###',
//   '#  ',
//   '#  ',
// ];

const RootSeedPos = {
  x: 0,
  y: 0,
};

let ShapePosOffset = {x: 0, y: 0};
let _ShapePosRootIndexes = {x: 0, y: 0};

if(true){
  let trimmed = false;
  let rowCount = ShapeDesc.length;
  for(let rowi = rowCount-1; rowi >= 0; rowi--) {
    if(trimmed) {
      break;
    }
    for(let coli = 0; coli < ShapeDesc[rowi].length; coli++) {
      if(ShapeDesc[rowi][coli] == '#') {
        ShapeDesc = ShapeDesc.slice(0, rowi+1);
        _ShapePosRootIndexes = {
          x: coli,
          y: 0,
        };
        ShapePosOffset = {
          x: RootSeedPos.x - _ShapePosRootIndexes.x*_ShapeScale,
          y: RootSeedPos.y - _ShapePosRootIndexes.y*_ShapeScale,
        };
        trimmed = true;
        break;
      }
    }
  }
  console.log('_ShapePosRootIndexes', _ShapePosRootIndexes);
  console.log('ShapePosOffset', ShapePosOffset);
}

const PER_ROW = Math.floor(Math.sqrt(COUNT * $(window).width()/$(window).height()*1));

const MARGIN = 12 * RADIUS;
let SIZE = {
  w: $(window).width()-10,
  h: $(window).height()-10,
}
/*
let SIZE = {
  w: RADIUS*2 * PER_ROW + MARGIN*2,
  h: RADIUS*Math.sqrt(3) * (COUNT/PER_ROW) * 2 + MARGIN*2,
}
*/

let V = {
  PAN: {
    x: SIZE.w/2.0,
    y: SIZE.h/2.0,
  },
  ZOOM: 20.0,
};

const equalViews = (v1, v2) => {
  if(v1 == null || v2 == null)
    return false;

  if(v1.PAN.x == v2.PAN.x
    && v1.PAN.y == v2.PAN.y
    && v1.ZOOM == v2.ZOOM
  )
    return true;
  else
    return false;
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


const formatSeconds = (totalSeconds, full) => {
  let h = Math.floor(totalSeconds/3600);
  let m = Math.floor((totalSeconds - h*3600)/60);
  let s = Math.floor(totalSeconds % 60);

  if(s < 10) s = `0${s}`;
  if(m < 10) m = `0${m}`;
  if(h < 10) h = `0${h}`;
  if(full) {
    return `${h}h:${m}m:${s}s`;
  }

  if(h > 0) {
    return `${h}h:${m}m:${s}s`;
  } else if(m > 0) {
    return `${m}m:${s}s`;
  } else {
    return `${s}s`;
  }
}


const FAST = !false;

let INITIAL_DIST = 2.5 * RADIUS;
let NEIGHBOUR_DISTANCE = 11 * RADIUS; // 4 * RADIUS + 2 * RADIUS * Math.sqrt(3);

// const SQRT3 = Math.sqrt(3);

const PERFECT = false;

const TICKS_BETWEEN_MSGS = 30/2;
const LOOP_PER_SECOND = 30;

let DRAW_TRAVERSED_PATH = !false;
let DRAW_CONNS_AND_BOUNDS = !false;
let DRAW_LOCALIZATION_ERROR = !false;
let DRAW_SHADOW = !false;
let DRAW_SHAPE_DESCRIPTION = true;

let BENCHMARKING = true;
if(BENCHMARKING) {
  DRAW_TRAVERSED_PATH = false;
  // DRAW_SHAPE_DESCRIPTION = false;
  // DRAW_SHADOW = false;
  // DRAW_LOCALIZATION_ERROR = false;
  DRAW_CONNS_AND_BOUNDS = false;
}

if(COUNT > 500) {
  DRAW_SHADOW = false;
}

const DARK_MODE = true;
const FRAME_LIMIT = null;
const MAX_DEPTH = 3;
const FRAMES_PER_BODY = 50;
let RAND_SEED = 0;
const NO_COLLISION = 0;
const BODY_ID_IGNORE = 0;

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
