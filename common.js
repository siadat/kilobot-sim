const LayersOrder = [
  'Shape',
  '_Shadow',
  '_TraversedPath',
  'RobustQuadlateral',
  'ConnsAndBouns',
  '_Robots',
  'LocalizationError',
]

const RADIUS = 1; // best performance
const INITIAL_DIST = 3 * RADIUS;
const NEIGHBOUR_DISTANCE = INITIAL_DIST/3*11; // 11 * RADIUS; // 4 * RADIUS + 2 * RADIUS * Math.sqrt(3);

const TICKS_BETWEEN_MSGS = 30/2;
const LOOP_PER_SECOND = 30;

let DRAW_CONNS_AND_BOUNDS = !false;
let DRAW_SHADOW = false;

let BENCHMARKING = true;
if(BENCHMARKING) {
  DRAW_CONNS_AND_BOUNDS = false;
}

const DARK_MODE = !true;

const _tempMathRandom = new Math.seedrandom(1234);
const noise = function(magnitude) {
  return magnitude * (_tempMathRandom()-0.5);
}

const zIndexOf = (name) => {
  let zIndex = LayersOrder.indexOf(name);
  if(zIndex == -1) {
    console.error(`name=${name} not found in order list`);
  }
  return zIndex;
}

const calcDist = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}
