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
    if(this._internalTicker % 40 == 0) {
      // console.log("you can send now");
      let msgToSend = this.kilo_message_tx();
      if(!msgToSend) {
        return;
      }
      console.log("broadcasting message", msgToSend);
    }
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
    console.log(`received message=${message} from distance=${distance}`);
  }

  // roughly every 2 seconds
  // the returned message is sent, unless it is null
  kilo_message_tx() {
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

    let coef = 0.01;

    let angle = Math.PI * this._phys.GetAngle() / 180.0;
    if(!PERFECT) {
      angle += noise(0.05 * Math.PI);
    }

    // this._phys.ApplyAngularImpulse(

    let force1 = new this._Box2D.b2Vec2(
      this._permanentSpeedErr * coef * Math.cos(angle),
      this._permanentSpeedErr * coef * Math.sin(angle),
    );

    this._phys.ApplyTorque(coef * right/255.0);
    this._phys.ApplyForce(force1, this._phys.GetPosition());
    this._Box2D.destroy(force1);

    let force2 = new this._Box2D.b2Vec2(
      coef * Math.cos(angle),
      coef * Math.sin(angle),
    );

    this._phys.ApplyTorque(-coef * left/255.0);
    this._phys.ApplyForce(force2, this._phys.GetPosition());
    this._Box2D.destroy(force2);
  }

  delay(ms) {
    console.error("Delay ignored because delay is non-idiomatic Javascript. Instead, please use setTimeout, setInterval, Promise, etc.");
  }

  spinup_motors() {
    this.set_motors(255, 255);
    // this.dalay(15);
  }

  kilo_uid() {
    return this._uid;
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
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toHex() {
    let r = (0xff * (this.r/3)).toString(16);
    let g = (0xff * (this.g/3)).toString(16);
    let b = (0xff * (this.b/3)).toString(16);
    if(r.length == 1) r = `0${r}`;
    if(g.length == 1) g = `0${g}`;
    if(b.length == 1) b = `0${b}`;
    return `0x${r}${g}${b}`;
  }
}
