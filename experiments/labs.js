class RobotLab0 extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    if(Math.floor(this.counter / 15) % 2 == 0) {
      this.set_color(this.RGB(3, 0, 0));
    } else {
      this.set_color(this.RGB(0, 0, 3));
    }
  }
}

window.ExperimentLab0 = class {
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: true,
      traversedPathLen: 1000,
    }
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    let MathRandom = new Math.seedrandom(1234);
    for(let i = 0; i < 10; i++) {
      newRobot({
          x: MathRandom(),
          y: MathRandom(),
        },
        0,
        new RobotLab0(),
      );
    }
  }
}

// ---

class RobotLab1_2 extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    let t = this.counter % (7 * 30);

    if(t < 2 * 30) {
      this.set_color(this.RGB(0, 3, 0));
      this.set_motors(this.kilo_straight_left, this.kilo_straight_right);
    } else if(t < 4 * 30) {
      this.set_color(this.RGB(3, 0, 0));
      this.spinup_motors();
      this.set_motors(this.kilo_turn_left, 0);
    } else if(t < 6 * 30) {
      this.set_color(this.RGB(0, 0, 3));
      this.spinup_motors();
      this.set_motors(0, this.kilo_turn_right);
    } else if(t < 7 * 30) {
      this.set_color(this.RGB(0, 0, 0));
      this.set_motors(0, 0);
    }
  }
}

window['ExperimentLab1.2'] = class {
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: true,
      traversedPathLen: 1000,
    }
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    let MathRandom = new Math.seedrandom(1234);
    for(let i = 0; i < 10; i++) {
      newRobot({
          x: MathRandom(),
          y: MathRandom(),
        },
        MathRandom() * 2*Math.PI,
        new RobotLab1_2(),
      );
    }
  }
}

// ---

class RobotLab1_3 extends Kilobot {
  setup() {
    this.States = {
      LeftRed: 0,
      RightBlue: 1,
      ForwardGreen: 2,
    };

    this.last_changed = this.kilo_ticks;
    this.state = this.States.ForwardGreen;
  }

  loop() {
    if(this.kilo_ticks < this.last_changed + 60)
      return;

    this.last_changed = this.kilo_ticks;

    switch(this.state) {
      case this.States.ForwardGreen:
        this.set_color(this.RGB(0, 3, 0));
        this.set_motors(this.kilo_straight_left, this.kilo_straight_right);
        this.state = this.States.LeftRed;
        break;
      case this.States.LeftRed:
        this.set_color(this.RGB(3, 0, 0));
        this.set_motors(this.kilo_turn_left, 0);
        this.state = this.States.RightBlue;
        break;
      case this.States.RightBlue:
        this.set_color(this.RGB(0, 0, 3));
        this.set_motors(0, this.kilo_turn_right);
        this.state = this.States.ForwardGreen;
        break;
    }
  }
}

window['ExperimentLab1.3'] = class {
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: false,
    }
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    let MathRandom = new Math.seedrandom(1234);
    for(let i = 0; i < 10; i++) {
      newRobot({
          x: MathRandom(),
          y: MathRandom(),
        },
        MathRandom() * 2*Math.PI,
        new RobotLab1_3(),
      );
    }
  }
}

// ---
class RobotLab7 extends Kilobot {
  setup() {
    this.PERIOD = 60;
    this.RESET_TIME_ADJUSTMENT_DIVIDER = 120;
    this.RESET_TIME_ADJUSTMENT_MAX = 30;

    let s = this.rand_soft(); // Math.floor(60 * this.rand_soft()/255);

		this.message = {data: [s]};
    this.last_reset = s;
		this.reset_time = s;
    this.reset_time_adjustment = 0;
	}

  loop() {
    // console.log(this.kilo_ticks, this.last_reset, this.kilo_ticks >= this.last_reset, this.kilo_ticks > (this.last_reset + 1));
    if(this.kilo_ticks >= this.reset_time) {

      this.reset_time_adjustment = (this.reset_time_adjustment / this.RESET_TIME_ADJUSTMENT_DIVIDER);

			// Apply a cap to the absolute value of the reset time adjustment.
			if (this.reset_time_adjustment < - this.RESET_TIME_ADJUSTMENT_MAX) {
				this.reset_time_adjustment = - this.RESET_TIME_ADJUSTMENT_MAX;
			} else if (this.reset_time_adjustment > this.RESET_TIME_ADJUSTMENT_MAX) {
				this.reset_time_adjustment = this.RESET_TIME_ADJUSTMENT_MAX;
			}

			this.last_reset = this.kilo_ticks;
			this.reset_time = this.kilo_ticks + this.PERIOD + this.reset_time_adjustment;

			this.reset_time_adjustment = 0;

			// Set the LED white and turn the motors on.
			this.set_color(this.RGB(2, 2, 3));
      // this.set_motors(this.kilo_straight_left, this.kilo_straight_right);

      // this.set_color(this.RGB(3, 0, 0));
      // this.last_reset = this.kilo_ticks;
    } else if (this.kilo_ticks > (this.last_reset + 1)) {
        this.set_color(this.RGB(0, 0, 0));
        this.set_motors(0, 0);
    }
    // else if (this.kilo_ticks) { this.set_color(this.RGB(0, 0, 0)); }

		if ((this.kilo_ticks - this.last_reset) < 255) {
			this.message.data[0] = this.kilo_ticks - this.last_reset;
			// this.message.crc = message_crc(&this.message);
		} else {
			// this.message.crc = 0;
    }
  }

  message_tx() {
    return this.message;
  }

	message_rx(m, d) {
		let my_timer = this.kilo_ticks - this.last_reset;
		let rx_timer = m.data[0];
		let timer_discrepancy = my_timer - rx_timer;

		// Reset time adjustment due to this message - to be combined with the
		// overall reset time adjustment.
		let rx_reset_time_adjustment = 0;

		if (timer_discrepancy > 0) {
			// The neighbor is trailing behind: move the reset time forward
			// (reset later).
			if (timer_discrepancy < (this.PERIOD / 2))
			{
				rx_reset_time_adjustment = timer_discrepancy;
			} else {
				// The neighbor is running ahead: move the reset time backward
				// (reset sooner).
				rx_reset_time_adjustment = - (this.PERIOD - timer_discrepancy) % this.PERIOD;
			}
		} else if (timer_discrepancy < 0) {
			// The neighbor is running ahead: move the reset time backward
			// (reset sooner).
			if (- timer_discrepancy < (this.PERIOD / 2)) {
				rx_reset_time_adjustment = timer_discrepancy;
			} else {
				// The neighbor is trailing behind: move the reset time forward
				// (reset later).
				rx_reset_time_adjustment = (this.PERIOD + timer_discrepancy) % this.PERIOD;
			}
		}

		// Combine the reset time adjustment due to this message with the overall
		// reset time adjustment.
		this.reset_time_adjustment = this.reset_time_adjustment + rx_reset_time_adjustment;
    // console.log(this.reset_time_adjustment);
	}
}

window['ExperimentLab7'] = class {
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: false,
    }
  }

  gradientNoise() {
    if(this.perlinNoiseValue == null) {
      this.perlinNoiseValue = 0.5;
    }

    this.perlinNoiseValue += (this.MathRandom()-0.5)/2;
    if(this.perlinNoiseValue > 1) this.perlinNoiseValue = 1;
    if(this.perlinNoiseValue < 0) this.perlinNoiseValue = 0;
    return this.perlinNoiseValue;
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    this.MathRandom = new Math.seedrandom(1234);
    this.INITIAL_DIST = 4.0*RADIUS;

    for(let i = -5; i < 5; i++) {
      for(let j = -5; j < 5; j++) {
        newRobot({
          x: j * this.INITIAL_DIST + (this.gradientNoise()-0.5)*RADIUS*1,
          y: i * this.INITIAL_DIST + (this.gradientNoise()-0.5)*RADIUS*1,
        },
          this.MathRandom() * 2*Math.PI,
          new RobotLab7(),
        );
      }
    }

  }
}

// --
class RobotGradientFormation extends Kilobot {
  constructor(isSeed, INITIAL_DIST) {
    super();
    this.isSeed = isSeed;
    this.INITIAL_DIST = INITIAL_DIST;
    this.COLORS = [
      this.RGB(3, 0, 0), // red
      this.RGB(3, 0, 3), // magenta
      this.RGB(0, 0, 3), // blue
      this.RGB(0, 3, 3), // cyan
      this.RGB(0, 3, 0), // green
      this.RGB(3, 3, 0), // yellow
    ];
  }

  setup() {
    if(this.isSeed) {
      // this.myGradient = 0;
      this.setGradient(0);
      // this.set_color(this.RGB(3, 3, 3));
    } else {
      this.myGradient = 1 + this.rand_soft();
    }
    this.gradientDist = 1.5*this.INITIAL_DIST;
    this.minNeighborValue = Infinity;
    this.updatedAt = this.rand_soft();
    this.PERIOD = 60;
  }

  doGradientFormation() {
    if(this.isSeed) {
      return;
    }

    let grad = Infinity;

    if(this.messageReceived) {
      if(this.messageReceivedData < this.minNeighborValue) {
        this.minNeighborValue = this.messageReceivedData;
      }
      this.messageReceived = false;
    }

    if(this.kilo_ticks > this.updatedAt + this.PERIOD) {
      if(this.minNeighborValue < Infinity) {
        this.setGradient(this.minNeighborValue + 1);
        this.minNeighborValue = Infinity;
      }
      this.updatedAt = this.kilo_ticks
    }
  }

  loop() {
    this.doGradientFormation();
  }

  set_colors_for_gradient(g) {
    if(g == null) {
      return;
    }
    this.set_color(this.COLORS[g % this.COLORS.length]);
  }

  setGradient(newValue) {
    if(this.myGradient == newValue) {
      return;
    }

    this.myGradient = newValue;
    this.set_colors_for_gradient(this.myGradient);
  }

  message_rx(message, distance) {
    if(distance > this.gradientDist) {
      return;
    }

    this.messageReceived = true;
    this.messageReceivedData = message;
    this.messageReceivedDist = distance;
  }

  message_tx() {
    return this.myGradient;
  }
}

window['ExperimentGradientFormation'] = class {
  constructor() {
    this.runnerOptions = {
      limitSpeed: false,
      traversedPath: false,
    }
  }
  setupGraphics(
    PIXI,
    Box2D,
    pixiApp,
    platformGraphics,
    bodies,
    bodyIDs,
    setDisplayedData,
    zIndexOf,
  ) {
    for(let i = 0; i < bodyIDs.length; i++) {
      let b = bodies[bodyIDs[i]];
      let g = b.g;

      g.interactive = true;
      g.buttonMode = true;
      g.on('pointerdown', (ev) => {
        this.selectedUID = b.robot._uid;

        console.log({
          uid: b.robot._uid,
          grad: b.robot.myGradient,
          isSeed: b.robot.isSeed,
          events: b.robot.events,
        });
        ev.stopPropagation();
      });
    }
  }

  gridPosToPhysPos (gridPos) {
    let pos = {
      x: (this.RootSeedPos.x + this.INITIAL_DIST/2),
      y: (this.RootSeedPos.y + Math.sqrt(3) * this.INITIAL_DIST/2 + 2*this.INITIAL_DIST/2),
    };

    pos.x += gridPos.x * this.INITIAL_DIST + (gridPos.y%2==0 ? -this.INITIAL_DIST/2 : 0);
    pos.y += gridPos.y * this.INITIAL_DIST * Math.sqrt(3)/2;
    return pos;
  }

  hexagridPositions(count) {
    const TAKEN = true;
    let hexagrid = {};
    this.RootSeedPos = {x: 0, y: 0};

    let hexaNeighbors = [
               [0,   -1], [+1,-1],
      [-1, 0], /*cursor*/ [+1, 0],
               [0,   +1], [+1,+1],
    ];
    let hexagridCursor = {
      x: 0,
      y: 0,
    };
    let positions = [];
    for(let i = 0; i < count; i++) {
      let candidates = hexaNeighbors.map(adjacentPoint => {
        let candidate = {
          x: hexagridCursor.x + adjacentPoint[0],
          y: hexagridCursor.y + adjacentPoint[1],
        }

        if(hexagrid[`${candidate.x}:${candidate.y}`] == TAKEN)
          return null;

        /*
        if(false) {
          if(candidate.y < 0) return null;
        } else if(false) {
          let seedAreaWidth = Math.floor(this.NEIGHBOUR_DISTANCE/this.INITIAL_DIST) * 2;
          if(candidate.x < -seedAreaWidth/2 || candidate.x > +seedAreaWidth/2 || candidate.y < 0) {
            for(let rowi = 0; rowi < this.ShapeDesc.length; rowi++) {
              let row = this.ShapeDesc[rowi];
              for(let coli = 0; coli < row.length; coli++) {
                if(row[coli] != '#')
                  continue;
                let p = {
                  x: this.ShapePosOffset.x + coli*this._ShapeScale,
                  y: this.ShapePosOffset.y - (this.ShapeDesc.length-1 - rowi)*this._ShapeScale,
                }
                let d = calculateDistance(gridPosToPhysPos(candidate), p);
                if(d < 4*this.INITIAL_DIST) {
                  return null;
                  // let distToOrigin = calculateDistance(gridPosToPhysPos(candidate), gridPosToPhysPos({x: 0, y: 0}));
                  // return {
                  //   x: candidate.x,
                  //   y: candidate.y,
                  //   dist: distToOrigin * 10000,
                  // };
                }
              }
            }
          }
        }
        */

        let distToOrigin = calculateDistance(gridPosToPhysPos(candidate), gridPosToPhysPos({x: 0, y: 0}));

        return {
          x: candidate.x,
          y: candidate.y,
          dist: distToOrigin,
        };
      }).filter(x => x != null).sort((a, b) => a.dist - b.dist);

      let best = candidates[0];

      if(best == null) {
        console.error("'best' should not be null");
        return;
      }

      hexagrid[`${best.x}:${best.y}`] = TAKEN;
      let pos = gridPosToPhysPos(best);

      hexagridCursor.x = best.x;
      hexagridCursor.y = best.y;

      // if(true /*!PERFECT*/) {
      //   pos.x += this.noise(0.2 * this.INITIAL_DIST);
      //   pos.y += this.noise(0.2 * this.INITIAL_DIST);
      // }

      positions.push(pos);
    }
    return positions;
  }

  gradientNoise() {
    if(this.perlinNoiseValue == null) {
      this.perlinNoiseValue = 0.5;
    }

    this.perlinNoiseValue += (this.MathRandom()-0.5)/2;
    if(this.perlinNoiseValue > 1) this.perlinNoiseValue = 1;
    if(this.perlinNoiseValue < 0) this.perlinNoiseValue = 0;
    return this.perlinNoiseValue;
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    this.MathRandom = new Math.seedrandom(1234);
    this.INITIAL_DIST = 2.5*RADIUS;
    this.noise = function(magnitude) {
      return magnitude * (this.MathRandom()-0.5);
    }
    this.RootSeedPos = {x: 0, y: 0};

    let width = 32;
    let height = 32;

    for(let i = -Math.floor(height/2); i < +Math.floor(height/2); i++) {
      for(let j = -Math.floor(width/2); j < +Math.floor(width/2); j++) {
        let isSeed = false;
        let pos = this.gridPosToPhysPos({x: j, y: i});

        newRobot({
          x: pos.x, //  + (this.gradientNoise()-0.5)*RADIUS*0.3,
          y: pos.y, //  + (this.gradientNoise()-0.5)*RADIUS*0.3,
        },
          this.MathRandom() * 2*Math.PI,
          new RobotGradientFormation(isSeed, this.INITIAL_DIST),
        );
      }
    }

    {
      let isSeed = true;
      newRobot(this.gridPosToPhysPos({x: -1-Math.floor(width/2), y: -1}),
        this.MathRandom() * 2*Math.PI,
        new RobotGradientFormation(true, this.INITIAL_DIST),
      );
    }

    /*
    let positions = this.hexagridPositions(512);
    for(let i = 0; i < positions.length; i++) {
      let isSeed = i == positions.length-1;
      newRobot({
          x: positions[i].x,
          y: positions[i].y,
        },
        this.MathRandom() * 2*Math.PI,
        new RobotGradientFormation(isSeed, this.INITIAL_DIST),
      );
    }
    */
  }
}
