class MyRobot extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;
    // this.set_motors(this.kilo_turn_left, 0);
    // this.set_motors(this.kilo_straight_left, this.kilo_straight_left);
    this.set_motors(this.kilo_turn_left, 0);
    // if(this.counter % 10 == 0) {
    //   this.set_color(new RGB(this.rand_soft() % 4, this.rand_soft() % 4, this.rand_soft() % 4));
    // }
    this.set_color(new RGB(2, 2, 2));
  }

  kilo_message_rx(message, distance) {
    console.log("yo");
    this.super(message, distance);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  kilo_message_tx() {
    return null;
    // return {"do it": true};
  }
}
