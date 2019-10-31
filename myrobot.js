// ----
class MyRobot extends Kilobot {
  setup() {
    this.counter = 0;
  }

  loop() {
    this.counter++;
    // this.set_motors(this.kilo_straight_left, this.kilo_straight_left);
    // this.set_motors(this.kilo_turn_left, 0);
    // if(this.counter % 10 == 0) {
    //   this.set_color(new RGB(this.rand_soft() % 4, this.rand_soft() % 4, this.rand_soft() % 4));
    // }
    this.set_color(new RGB(0, 2, 0));
    if(this.kilo_uid == 55) {
      this.set_color(new RGB(2, 0, 0));
      this.set_motors(this.kilo_turn_left, 0);
    }
  }

  message_rx(message, distance) {
    // console.log(`message_rx: from distance=${distance}`); //, message);
    // console.log(`message_rx`);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  message_tx() {
    // return null;
    return {"hello": true};
  }
}
