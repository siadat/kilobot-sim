export class Kilobot {
  constructor() {
    this.led = new RGBClass(0, 0, 0);
    this._graphics_must_update = true;
    this._uid = -1;
    this._startedAt = new Date();
    this._internalTicker = 0;
    this._faultiness = 0;
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
    if(left < 0 || left > 255) {
      console.error("left must be between 0 and 255, left is", left);
      return;
    }
    if(right < 0 || right > 255) {
      console.error("right must be between 0 and 255, right is", right);
      return;
    }

    if(left == 0 && right == 0)
      return;

    if(!this._phys.IsAwake())
      this._phys.SetAwake(true);

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

    if(left == right
      && left == this.kilo_straight_left
      && left == this.kilo_straight_right) {

      let a = this._phys.GetAngle();
      let p = this._phys.GetPosition();

      let newPos = new this._Box2D.b2Vec2(
        p.get_x() + forwardSpeed * Math.cos(a * Math.PI/180.0),
        p.get_y() + forwardSpeed * Math.sin(a * Math.PI/180.0),
      );

      this._phys.SetTransform(newPos, a);
      this._Box2D.destroy(newPos);
    } else {
      let a = this._phys.GetAngle();
      let phi = degreePerTick * (right-left)/255.0;
      a += phi;

      let p = this._phys.GetPosition();

      let temp_cos = 0;
      let temp_sin = 0;
      if(right > left) {
        temp_cos = Math.cos(a *Math.PI/180.0 + Math.PI * 2.0/3.0) * this._RADIUS;
        temp_sin = Math.sin(a *Math.PI/180.0 + Math.PI * 2.0/3.0) * this._RADIUS;
      } else {
        temp_cos = Math.cos(a *Math.PI/180.0 + Math.PI * 4.0/3.0) * this._RADIUS;
        temp_sin = Math.sin(a *Math.PI/180.0 + Math.PI * 4.0/3.0) * this._RADIUS;
      }

      let newPos = new this._Box2D.b2Vec2(
        p.get_x() + temp_cos - temp_cos*Math.cos(phi *Math.PI/180.0) + temp_sin*Math.sin(phi *Math.PI/180.0),
        p.get_y() + temp_sin - temp_cos*Math.sin(phi *Math.PI/180.0) - temp_sin*Math.cos(phi *Math.PI/180.0),
      );

      this._phys.SetTransform(newPos, a);
      this._Box2D.destroy(newPos);
    }
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
    this.led = new RGBClass(r, g, b);
    this._graphics_must_update = true;
  }
}


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

  toHex() {
    let r = Math.floor(0xff * this.r / 3.0).toString(16);
    let g = Math.floor(0xff * this.g / 3.0).toString(16);
    let b = Math.floor(0xff * this.b / 3.0).toString(16);
    if(r.length == 1) r = `0${r}`;
    if(g.length == 1) g = `0${g}`;
    if(b.length == 1) b = `0${b}`;
    return `0x${r}${g}${b}`;
  }
  toHexDark() {
    let r = Math.floor(0xff * this.r / 3.0 / 2).toString(16);
    let g = Math.floor(0xff * this.g / 3.0 / 2).toString(16);
    let b = Math.floor(0xff * this.b / 3.0 / 2).toString(16);
    if(r.length == 1) r = `0${r}`;
    if(g.length == 1) g = `0${g}`;
    if(b.length == 1) b = `0${b}`;
    return `0x${r}${g}${b}`;
  }
}
