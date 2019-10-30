class RobotRandom extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    let left = MathRandom() > 0.5 ? this.kilo_turn_left : 0;
    let right = MathRandom() > 0.5 ? this.kilo_turn_right : 0;
    this.set_motors(left, right);
  }
}

window.ExperimentRandom = class {
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
          x: 20 * RADIUS * MathRandom(),
          y: 20 * RADIUS * MathRandom(),
        },
        0,
        new RobotRandom(),
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
