const GRADIENT_DIST = 3 * RADIUS;
const SHAPE_DESC = [
  '    ##    ',
  '    ##    ',
  '    ##    ',
  '   ####   ',
  '##########',
  '##########',
  '   ####   ',
  '    ##    ',
  '    ##    ',
  '    ##    ',
];

class SelfAssemblyRobot extends Kilobot {
  setup() {
    this.shapeScale = 2 * RADIUS;
    this.SHAPE_DESC = SHAPE_DESC;
    this.myGradient = null;

    this.colors = [
      new RGB(3, 0, 0), // red
      new RGB(3, 0, 3), // magenta
      new RGB(0, 0, 3), // blue
      new RGB(0, 3, 3), // cyan
      new RGB(0, 3, 0), // green
      new RGB(3, 3, 0), // yellow
    ];
  }

  loop() {
  }

  smoothMode(x, b) {
    // return x % b;
    let newBase = 2*b - 2;
    let values = []
    for(let i = 0; i < newBase; i++) {
      if(i < b) {
        values.push(i);
      } else {
        values.push(b - 2 + b - i);
      }
    }
    return values[x%newBase];
  }

  kilo_message_rx(message, distance) {
    switch(message.type) {
      case 'gradient':
        if(distance < GRADIENT_DIST) {
          if(this.myGradient != null && this.myGradient < message.value + 1) {
            return;
          }
          this.myGradient = message.value + 1;
          let c = this.myGradient;
          this.set_color(this.colors[this.myGradient % this.colors.length]);

          // this.set_color(new RGB(
          //   this.smoothMode(Math.floor(c / (4*4)), 4),
          //   this.smoothMode(Math.floor(c / (4)), 4),
          //   this.smoothMode(c, 4),
          // ));

          // this.set_color(new RGB(
          //   Math.floor(c / (4*4)) % 4,
          //   Math.floor(c/4) % 4,
          //   c % 4,
          // ));
        }
        break;
    }
  }

  kilo_message_tx() {
    if(this.myGradient == null) {
      return null;
    }

    return {
      type: 'gradient',
      value: this.myGradient,
    };
  }
}

class SeedRobot extends Kilobot {
  setup() {
    this.shapeScale = 2 * RADIUS;
    this.SHAPE_DESC = SHAPE_DESC;
  }

  loop() {
    this.set_color(new RGB(1, 1, 1));
  }

  kilo_message_rx(message, distance) {
    switch(message.type) {
      case 'gradient':
        // ignore
        break;
    }
  }

  kilo_message_tx() {
    return {
      type: 'gradient',
      value: 0,
    };
  }
}

class GradientSeedRobot extends Kilobot {
  setup() {
    this.shapeScale = 2 * RADIUS;
    this.SHAPE_DESC = SHAPE_DESC;
  }

  loop() {
    this.set_color(new RGB(3, 3, 3));
  }

  kilo_message_rx(message, distance) {
    switch(message.type) {
      case 'gradient':
        // ignore
        break;
    }
  }

  kilo_message_tx() {
    return {
      type: 'gradient',
      value: 0,
    };
  }
}

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

  kilo_message_rx(message, distance) {
    // console.log(`kilo_message_rx: from distance=${distance}`); //, message);
    // console.log(`kilo_message_rx`);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  kilo_message_tx() {
    // return null;
    return {"hello": true};
  }
}

