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
const WAIT_TICKS = (1+MSG_PER_SEC) * 60;

class SelfAssemblyRobot extends Kilobot {
  setup() {
    this.shapeScale = 2 * RADIUS;
    this.SHAPE_DESC = SHAPE_DESC;
    this.myGradient = null;
    this.ticksUntilCanMove = WAIT_TICKS;
    this.neighbourIsMovingExpiry = WAIT_TICKS;
    this.counter = 0;
    this.events = [];
    this.myMoving = false;

    this.colors = [
      new RGB(3, 0, 0), // red
      new RGB(3, 0, 3), // magenta
      new RGB(0, 0, 3), // blue
      new RGB(0, 3, 3), // cyan
      new RGB(0, 3, 0), // green
      new RGB(3, 3, 0), // yellow
    ];
  }

  smoothColor(x, b) {
    // Usage::
    //   this.set_color(new RGB(
    //     this.smoothColor(Math.floor(c / (4*4)), 4),
    //     this.smoothColor(Math.floor(c / (4)), 4),
    //     this.smoothColor(c, 4),
    //   ));

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

  newEvent(s) {
    if(false) {
      this.events.push(s);
    }
  }

  set_colors_for_gradient(g) {
    if(g == null) {
      return;
    }
    this.set_color(this.colors[g % this.colors.length]);
  }

  loop() {
    this.counter++;
    this.ticksUntilCanMove--;
    this.neighbourIsMovingExpiry--;

    if(this.ticksUntilCanMove < 0) {

      if(this.neighbourIsMovingExpiry < 0) {
        // this.myMoving = true;
        // this.set_motors(0, this.kilo_turn_right);
      }

      this.newEvent('(this.ticksUntilCanMove <= 0)');
      this.mark();
      /*
      if(this.counter % 60 < 55) {
        this.set_colors_for_gradient(this.myGradient);
      } else {
        this.set_color(new RGB(3, 3, 3));
      }
      */
    } else {
      this.unmark();
      this.set_colors_for_gradient(this.myGradient);
    }
  }

  kilo_message_rx(message, distance) {
    switch(message.type) {
      case 'gradient':
        this.newEvent("case 'gradient'");
        if(distance > GRADIENT_DIST) {
          break;
        }

        if(message.isMoving) {
          this.neighbourIsMovingExpiry = WAIT_TICKS;
        }

        if(this.closestNeighbourDist > distance) {
          this.closestNeighbourDistDiff = distance - this.closestNeighbourDist;
          this.closestNeighbourDist = distance;
        }

        // each robot needs to set its gradient to x+1
        // where x="lowest value of all neighboring robots"

        // not set yet
        if(this.myGradient == null) {
          this.newEvent('(this.myGradient == null)');
          this.ticksUntilCanMove = WAIT_TICKS;
          this.myGradient = message.value + 1;
          break;
        }

        // from same layer
        // both peelers and waiters get this
        if(this.myGradient == message.value) {
          this.newEvent('(this.myGradient == message.value)');
          break;
        }

        // from inner layer
        // both peelers and waiters get this
        if(this.myGradient == message.value + 1) {
          this.newEvent('(this.myGradient == message.value + 1)');
          break;
        }

        // from outer layers
        // peelers don't get this, so reset ticksUntilCanMove
        if(this.myGradient < message.value + 1) {
          this.newEvent('(this.myGradient < message.value)');
          this.ticksUntilCanMove = WAIT_TICKS;
          break;
        }

        // still finding the min gradient among neighbors
        if(this.myGradient > message.value + 1) {
          this.newEvent('(this.myGradient > message.value + 1)');
          this.ticksUntilCanMove = WAIT_TICKS;
          this.myGradient = message.value + 1;
          break;
        }

        break;
      case 'noGradientYet':
        this.newEvent("case 'noGradientYet'");
        this.ticksUntilCanMove = WAIT_TICKS;
        break;
    }
  }

  kilo_message_tx() {
    if(this.myGradient == null) {
      return {
        type: 'noGradientYet',
      };
    }

    return {
      type: 'gradient',
      value: this.myGradient,
      isMoving: this.myMoving,
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
    return null;
  }
}

class GradientSeedRobot extends Kilobot {
  setup() {
    this.shapeScale = 2 * RADIUS;
    this.SHAPE_DESC = SHAPE_DESC;
    this.set_color(new RGB(3, 3, 3));
  }

  loop() {
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
