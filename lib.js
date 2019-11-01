import {VERSION} from "./version.js";
window.VERSION = VERSION;

import {Kilobot} from "./kilobot.js";
window.Kilobot = Kilobot;

import {Pitch} from "./pitch.js";
window.Pitch = Pitch;

// import "./vendor/Box2D_v2.3.1_min.js";
import {Box2D} from "./physics/physics.js";
window.Box2D = Box2D;

console.log("VERSION IS", VERSION);
