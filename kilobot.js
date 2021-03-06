export class Kilobot {
  constructor() {
    this.led = {r: 0, g: 0, b: 0};
    this._graphics_must_update = true;
    this._uid = -1;
    this._startedAt = new Date();
    this._internalTicker = 0;
    this._ambientlight = 0;
    this._ambientlight_ready = 0|0;
    this._faultiness = 0;
  }

  get_ambientlight() {
    return this._ambientlight;
  }

  setFaultiness(faultiness) {
    this._faultiness = faultiness;
  }

  setup() { }
  loop() { }

  _internal_loop() {
    this._internalTicker++;
    // if(this._internalTicker % 40 == 0) {
    //   let msgToSend = this.message_tx();
    //   if(!msgToSend) {
    //     return;
    //   }
    //   console.log("broadcasting message", msgToSend);
    // }
  }

  kilo_init() {
    // Ok!
  }

  kilo_start() {
    console.error("Define 'loop()' and 'setup()' functions on this class");
  }

  rand_soft() {
    return Math.floor(256 * this._MathRandom());
  }

  rand_hard() {
    return Math.floor(256 * this._MathRandom());
  }

  rand_seed(seed) {
  }

  _updated_graphics() {
    this._graphics_must_update = false;
  }

  get kilo_turn_left() { return 255; }
  get kilo_turn_right() { return 255; }
  get kilo_straight_left() { return 255; }
  get kilo_straight_right() { return 255; }
  get kilo_ticks() {
    return this._internalTicker;
    // return Math.floor((new Date() - this._startedAt)/30.0);
  }

  message_rx(message, distance) {
    // console.log(`message_rx: unhandled message=${message} from distance=${distance}`);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  message_tx() {
    return null;
  }

  message_tx_success() {
  }

  set_motors(left, right) {
    if(
      left < 0 ||
      left > 255 ||
      right < 0 ||
      right > 255
    ) {
      console.error("left and right must be between 0 and 255, left is", left, right);
      return;
    }

    if(left == 0 && right == 0)
      return;

    // if(!this._phys.IsAwake()) this._phys.SetAwake(true);

    // Actual Kilobot measurements:
    //   16mm   radius
    //   25mm/s forward speed
    //   90°/s  turning speed
    let coef = 1.0; // should be 1.0
    let degreePerTick = 90 * (1.0/this._LOOP_PER_SECOND) * coef;
    let forwardSpeed = this._RADIUS * (25.0/16.0) * (1/this._LOOP_PER_SECOND) * coef;

    if(this._faultiness > 0) {
      // TODO
    }

    let a = this._phys.GetAngle();
    let newA = a;
    let p = this._phys.GetPosition();
    // let v = this._phys.GetVelocity();
    // let newPos = new this._Box2D.b2Vec2(0, 0);
    let f = new this._Box2D.b2Vec2(0, 0);

    if(left == right
      && left == this.kilo_straight_left
      && left == this.kilo_straight_right) {
      f.set_x(/*p.get_x() +*/ forwardSpeed * Math.cos(newA * Math.PI/180.0));
      f.set_y(/*p.get_y() +*/ forwardSpeed * Math.sin(newA * Math.PI/180.0));
    } else {
      // TODO: support values other than 255 (eg 155)
      let phi = degreePerTick * (right-left)/255.0;
      newA += phi;

      let temp_cos = 0;
      let temp_sin = 0;
      let legRadius = this._RADIUS*0.9;
      if(right > left) {
        temp_cos = Math.cos(newA *Math.PI/180.0 + Math.PI * 2.0/3.0) * legRadius;
        temp_sin = Math.sin(newA *Math.PI/180.0 + Math.PI * 2.0/3.0) * legRadius;
      } else {
        temp_cos = Math.cos(newA *Math.PI/180.0 + Math.PI * 4.0/3.0) * legRadius;
        temp_sin = Math.sin(newA *Math.PI/180.0 + Math.PI * 4.0/3.0) * legRadius;
      }

      f.set_x(/*p.get_x() +*/ temp_cos - temp_cos*Math.cos(phi *Math.PI/180.0) + temp_sin*Math.sin(phi *Math.PI/180.0));
      f.set_y(/*p.get_y() +*/ temp_sin - temp_cos*Math.sin(phi *Math.PI/180.0) - temp_sin*Math.cos(phi *Math.PI/180.0));
    }

    if(true){
      f.set_x(1.75 * f.get_x() * this._DAMPING * this._phys.GetMass());
      f.set_y(1.75 * f.get_y() * this._DAMPING * this._phys.GetMass());
      this._phys.ApplyLinearImpulse(f, p, true);
    } else {
      // *(1.0/60)
      // *(1.0/60)
      f.set_x(f.get_x() * 2.5e5);
      f.set_y(f.get_y() * 2.5e5);
      this._phys.ApplyForceToCenter(f, true);
    }

    this._phys.SetTransform(this._phys.GetPosition(), a + (newA-a));
    // this._Box2D.destroy(newPos);
    this._Box2D.destroy(f);
  }

  delay(ms) {
    console.error("Delay ignored because delay is non-idiomatic Javascript. Instead, please use setTimeout, setInterval, Promise, etc.");
  }

  spinup_motors() {
    // this.set_motors(255, 255);
    // this.dalay(15);
  }

  get kilo_uid() {
    return this._uid;
  }

  mark() {
    if(this._mark) return;
    this._mark = true;
    this._graphics_must_update = true;
  }

  unmark() {
    if(!this._mark) return;
    this._mark = false;
    this._graphics_must_update = true;
  }

  RGB(r, g, b) {
    return (r<<4) | (g<<2) | (b<<0);
  }

  set_color(rgb) {
    let r = (0b110000 & rgb) >> 4;
    let g = (0b001100 & rgb) >> 2;
    let b = (0b000011 & rgb) >> 0;

    if(  r == this.led.r
      && g == this.led.g
      && b == this.led.b) {
      return;
    }
    this.led = {
      r: r,
      g: g,
      b: b,
    };
    this._graphics_must_update = true;
  }
}

  /*
class RGBClass {
  constructor(r, g, b) {
    if(r < 0 || r > 3) {
      console.error("r must be between 0 and 3", r);
      return;
    }
    if(g < 0 || g > 3) {
      console.error("g must be between 0 and 3", g);
      return;
    }
    if(b < 0 || b > 3) {
      console.error("b must be between 0 and 3", b);
      return;
    }

    this.r = r;
    this.g = g;
    this.b = b;
  }

}
  */
