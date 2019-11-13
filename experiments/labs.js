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

    let s = this.rand_soft();

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
			this.set_color(this.RGB(3, 0, 0));
      this.set_motors(this.kilo_straight_left, this.kilo_straight_right);

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

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    let MathRandom = new Math.seedrandom(1234);
    for(let i = 0; i < 10; i++) {
      newRobot({
          x: i * 2*RADIUS,
          y: 0,
        },
        MathRandom() * 2*Math.PI,
        new RobotLab7(),
      );
    }
  }
}
