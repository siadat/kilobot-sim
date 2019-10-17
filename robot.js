class MyRobot extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;
    // this.set_motors(this.kilo_turn_left, 0);
    this.set_motors(this.kilo_straight_left, this.kilo_straight_left);
    // this.set_color(new RGB(this.rand_soft() % 4, this.rand_soft() % 4, this.rand_soft() % 4));
    this.set_color(new RGB(2, 2, 2));
  }
}
