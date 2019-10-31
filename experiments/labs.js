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

  createRobots(newRobot) {
    for(let i = 0; i < 10; i++) {
      newRobot(
        {
          x: MathRandom(),
          y: MathRandom(),
        },
        0,
        new RobotLab0(),
      );
    }
  }

  setupGraphics(
    PIXI,
    pixiApp,
    platformGraphics,
    bodies,
    bodyIDs,
    setDisplayedData,
  ) {
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

window['ExperimentLab1.2'] = class {b
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: true,
      traversedPathLen: 1000,
    }
  }

  createRobots(newRobot) {
    for(let i = 0; i < 10; i++) {
      newRobot(
        {
          x: MathRandom(),
          y: MathRandom(),
        },
        MathRandom() * 2*Math.PI,
        new RobotLab1_2(),
      );
    }
  }

  setupGraphics(
    PIXI,
    pixiApp,
    platformGraphics,
    bodies,
    bodyIDs,
    setDisplayedData,
  ) {
  }
}
