class RobotRandom extends Kilobot {
  setup() {
  }

  loop() {
    let randBetween0to2 = Math.floor(3 * this.rand_soft()/256);

    switch(randBetween0to2) {
      case 0:
        this.set_motors(this.kilo_turn_left, 0);
        break;
      case 1:
        this.set_motors(0, this.kilo_turn_right);
        break;
      case 2:
        this.set_motors(this.kilo_straight_left, this.kilo_straight_right);
        break;
    }
  }

  message_rx(message, distance) {
  }

  message_tx() {
    return null;
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

  createRobots(newRobotFunc, newLightFunc, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    for(let i = 0; i < 1; i++) {
      let angle = Math.PI/2;
      let pos = {
        x: i * 10*RADIUS,
        y: 0,
      }
      newRobotFunc(pos, angle, new RobotRandom());
    }
  }
}
