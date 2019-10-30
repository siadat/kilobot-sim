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
