class RobotLab0 extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;

    if(Math.floor(this.counter / 15) % 2 == 0) {
      this.set_color(this.RGB(1, 0, 0));
    } else {
      this.set_color(this.RGB(0, 0, 1));
    }
  }
}
