class RobotLab0 extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    let left = MathRandom() > 0.5 ? this.kilo_turn_left : 0;
    let right = MathRandom() > 0.5 ? this.kilo_turn_right : 0;
    this.set_motors(left, right);

    if(Math.floor(this.counter / 15) % 2 == 0) {
      this.set_color(this.RGB(1, 0, 0));
    } else {
      this.set_color(this.RGB(0, 0, 1));
    }
  }
}

class ExperimentLab0 {
  constructor() {
    this.runnerOptions = {
      limitSpeed: true,
      traversedPath: true,
      traversedPathLen: 1000,
    }
  }

  createRobots(newRobot) {
    newRobot(
      {x: 0, y: 0},
      new RobotLab0(),
    );
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
