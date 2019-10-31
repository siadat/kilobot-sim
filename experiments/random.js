class RobotRandom extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    let left = this.rand_soft()/255.0 > 0.5 ? this.kilo_turn_left : 0;
    let right = this.rand_soft()/255.0 > 0.5 ? this.kilo_turn_right : 0;
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
          x: 20 * RADIUS * this.rand_soft()/255.0,
          y: 20 * RADIUS * this.rand_soft()/255.0,
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
