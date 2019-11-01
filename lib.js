import {VERSION} from "./version.js";
window.VERSION = VERSION;

// import {
//   RADIUS,
//   MathRandom,
//   DEV,
//   CATS,
//   MetaOpts,
//   ExperimentRandom,
//   DARK_MODE,
//   SIZE,
//   V,
// } from "./common.js";

import {Kilobot} from "./kilobot.js";
window.Kilobot = Kilobot;

import {Pitch} from "./pitch.js";
window.Pitch = Pitch;

import {Box2D} from "./physics/physics.js";
// import "./vendor/Box2D_v2.3.1_min.js";
window.Box2D = Box2D;

// window.Pitch = Pitch;
// window.DARK_MODE = DARK_MODE;
// window.SIZE = SIZE;
// window.DEV = DEV;
// window.MetaOpts = MetaOpts;
// window.V = V;
// window.CATS = CATS;
// window.RADIUS = RADIUS;
// window.MathRandom = MathRandom;

console.log("VERSION IS", VERSION);
