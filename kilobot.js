class Kilobot {
  constructor() {
    this.led = new RGB(0, 0, 0);
    this._graphics_must_update = true;
    this._uid = -1;
    this._seed = 0;
    this._permanentSpeedErr = 1.0;
    this._startedAt = new Date();
    this._internalTicker = 0;
    if(!PERFECT) {
      this._permanentSpeedErr = 1 + noise(0.4);
    }
  }

  setup() { }
  loop() { }

  _internal_loop() {
    this._internalTicker++;
    // if(this._internalTicker % 40 == 0) {
    //   let msgToSend = this.kilo_message_tx();
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
    return Math.floor(256 * Math.random());
  }

  rand_hard() {
    return Math.floor(256 * Math.random());
  }

  rand_seed(seed) {
    console.error("Seed ignored");
    this._seed = seed;
  }

  _updated_graphics() {
    this._graphics_must_update = false;
  }

  get kilo_turn_left() { return 255; }
  get kilo_turn_right() { return 255; }
  get kilo_straight_left() { return 255; }
  get kilo_straight_right() { return 255; }
  get kilo_ticks() {
    return Math.floor((new Date() - this._startedAt)/30.0);
  }

  kilo_message_rx(message, distance) {
    // console.log(`kilo_message_rx: unhandled message=${message} from distance=${distance}`);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  kilo_message_tx() {
    console.log(`kilo_message_tx: no message`);
    return null;
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

    if(!this._phys.IsAwake()) {
      this._phys.SetAwake(true);
    }

    let coef = 3 * 0.01 * (RADIUS*RADIUS) / 0.015625;
    

    let angle = Math.PI * this._phys.GetAngle() / 180.0;
    if(!PERFECT) {
      angle += noise(0.05 * Math.PI);
    }

    let force = new this._Box2D.b2Vec2(
      this._permanentSpeedErr * coef * Math.cos(angle),
      this._permanentSpeedErr * coef * Math.sin(angle),
    );

    // The reason I am not using ApplyTorque or ApplyAngularImpulse is that no
    // matter what value I give it the angular velocity doesn't exceed a limit around a PI/second.
    // Replace this SetTransform if you could get ApplyTorque to be fast enough.
    this._phys.SetTransform(
      this._phys.GetPosition(),
      this._phys.GetAngle() + 2.5 * 0.5 * (right - left)/255.0,
    );
    this._phys.ApplyForce(force, this._phys.GetPosition());
    this._Box2D.destroy(force);
  }

  delay(ms) {
    console.error("Delay ignored because delay is non-idiomatic Javascript. Instead, please use setTimeout, setInterval, Promise, etc.");
  }

  spinup_motors() {
    this.set_motors(255, 255);
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

  set_color(rgb) {
    if(  rgb.r == this.led.r
      && rgb.g == this.led.g 
      && rgb.b == this.led.b) {
      return;
    }
    this.led = rgb;
    this._graphics_must_update = true;
  }
}

class RGB {
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
