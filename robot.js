const GRADIENT_DIST = 3 * RADIUS;

const COLORS = [
  new RGB(3, 0, 0), // red
  new RGB(3, 0, 3), // magenta
  new RGB(0, 0, 3), // blue
  new RGB(0, 3, 3), // cyan
  new RGB(0, 3, 0), // green
  new RGB(3, 3, 0), // yellow
];

const HESITATE = (1+MSG_PER_SEC) * 60;

class GradientAndAssemblyRobot extends Kilobot {
  constructor(opts) {
    super();
    this.shapeScale = opts.shapeScale;
    this.shapeDesc = opts.shapeDesc;
    this.isStationary = opts.isStationary;
    this.shapePos = opts.shapePos;
  }

  setup() {
    this.myGradient = null;
    this.hesitateAt = 0;
    this.neighbourIsMovingExpiry = HESITATE;
    this.counter = 0;
    this.events = [];
    this.myMoving = false;

    if(this.isStationary) {
      this.set_color(new RGB(3, 3, 3));
    }
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
    this.set_color(COLORS[g % COLORS.length]);
  }

  loop() {
    this.counter++;

    if(this.isStationary) return;

    this.neighbourIsMovingExpiry--;

    if(this.counter - this.hesitateAt > HESITATE) {

      if(this.neighbourIsMovingExpiry < 0) {
        // this.myMoving = true;
        // this.set_motors(0, this.kilo_turn_right);
      }

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

  hesitate() {
    this.hesitateAt = this.counter;
  }

  kilo_message_rx(message, distance) {
    switch(message.type) {
      case 'gradient':
        this.newEvent("case 'gradient'");
        if(distance > GRADIENT_DIST) {
          break;
        }

        if(message.isMoving) {
          this.neighbourIsMovingExpiry = HESITATE;
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
          this.hesitate();
          this.myGradient = message.value + 1;
          break;
        }

        // from same layer
        // both peelers and waiters get this
        if(this.myGradient == message.value) {
          this.newEvent('(this.myGradient == message.value)');
          if(message.robotUUID > this.kilo_uid && message.consideringMovement) {
            this.hesitate();
          }
          // equalGradIDs[message.robotUUID] = {receivedAt: this.counter};
          // we can move ONLY IF we have the greatest ID
          break;
        }

        // from inner layer
        // both peelers and waiters get this
        if(this.myGradient == message.value + 1) {
          this.newEvent('(this.myGradient == message.value + 1)');
          break;
        }

        // from outer layers
        // peelers don't get this, so cannot move
        if(this.myGradient < message.value + 1) {
          this.newEvent('(this.myGradient < message.value)');
          this.hesitate();
          break;
        }

        // still finding the min gradient among neighbors
        if(this.myGradient > message.value + 1) {
          this.newEvent('(this.myGradient > message.value + 1)');
          this.hesitate();
          this.myGradient = message.value + 1;
          break;
        }

        break;
      case 'noGradientYet':
        this.newEvent("case 'noGradientYet'");
        this.hesitate();
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
      robotUUID: this.kilo_uid,
      consideringMovement: this.counter - this.hesitateAt > HESITATE,
      shapePos: this.shapePos,
    };
  }
}

class RootSeedRobot extends Kilobot {
  constructor(opts) {
    super();
    this.shapeScale = opts.shapeScale;
    this.shapeDesc = opts.shapeDesc;
    this.shapePos = opts.shapePos;
  }

  setup() {
    this.set_color(new RGB(1, 1, 1));
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
      shapePos: this.shapePos,
    };
  }
}
