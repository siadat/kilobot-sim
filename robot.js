const GRADIENT_DIST = 3 * RADIUS;

const COLORS = [
  new RGB(3, 0, 0), // red
  new RGB(3, 0, 3), // magenta
  new RGB(0, 0, 3), // blue
  new RGB(0, 3, 3), // cyan
  new RGB(0, 3, 0), // green
  new RGB(3, 3, 0), // yellow
];

const HESITATE_DURATION = (1+MSG_PER_SEC) * 60;
const NEIGHBOUR_EXPIRY = (3+MSG_PER_SEC) * 60;

const STATES = [
  'start',
  'wait_to_move',
  'move_while_outside',
  'move_while_inside',
  'joined_shape',

  // 'idle',
  // 'move_out', // mobile
  // 'move_in',  // mobile
  // 'stop_in',  // stopped
  // 'stop_out', // stopped
];

class GradientAndAssemblyRobot extends Kilobot {
  constructor(opts) {
    super();
    this.shapeScale = opts.shapeScale;
    this.shapeDesc = opts.shapeDesc;
    this.isSeed = opts.isSeed;
    this.shapePos = opts.shapePos;
    this.neighbors = {};
    this.isStationary = true;
    this.prevNearestNeighDist = Infinity;
    this.stats = {};
  }

  setup() {
    this.myGradient = null;
    this.hesitateData = {};
    this.counter = 0;
    this.events = [];
    // this.posHistory = [];
    // this.localizeCounter = 0;

    if(this.isSeed) {
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

  isTriangleRobust(points) {
    let e = [null, null, null];
    let a = [null, null, null];

    e[0] = calcDist(points[1], points[2]);
    e[1] = calcDist(points[0], points[2]);
    e[2] = calcDist(points[0], points[1]);

    a[0] = Math.acos((pow2(e[1]) + pow2(e[2]) - pow2(e[0])) / (2 * e[1] * e[2]));
    a[1] = Math.acos((pow2(e[0]) + pow2(e[2]) - pow2(e[1])) / (2 * e[0] * e[2]));
    a[2] = Math.acos((pow2(e[1]) + pow2(e[0]) - pow2(e[2])) / (2 * e[1] * e[0]));

    let minAngle = Math.min(a[0], a[1], a[2]);
    let minEdge  = Math.min(e[0], e[1], e[2]);

    // let d = minEdge * pow2(Math.sin(minAngle));
    // if(isNaN(d)) return false;
    // return d > ? * this.shapeScale;

    if(isNaN(minAngle)) return false;
    return minAngle > Math.PI * 20 / 180;
  }

  getFirstRobustQuadrilateral() {
    let nIDs = Object.keys(this.neighbors);
    nIDs = nIDs.filter(nid => this.neighbors[nid].shapePos != null && this.neighbors[nid].isStationary);
    // nIDs.sort((a, b) => this.neighbors[a].neighborGradient - this.neighbors[b].neighborGradient);
    nIDs.sort((a, b) => this.neighbors[a].measuredDist - this.neighbors[b].measuredDist);
    let ncount = nIDs.length;

    if(ncount < 4) {
      return null;
    }

    let p = [
      null, // this.shapePos || {x: 0, y: 0},
      null,
      null,
      null,
    ];


    for(let i = 0; i < ncount; i++) {
      p[0] = this.neighbors[nIDs[i]].shapePos;
      if(this.neighbors[nIDs[i]].neighborGradient == null) continue;
      if(this.neighbors[nIDs[i]].neighborGradient > this.myGradient) continue;
      for(let j = i+1; j < ncount; j++) {
        p[1] = this.neighbors[nIDs[j]].shapePos;
        if(this.neighbors[nIDs[i]].neighborGradient == null) continue;
        if(this.neighbors[nIDs[j]].neighborGradient > this.myGradient) continue;
        for(let k = j+1; k < ncount; k++) {
          p[2] = this.neighbors[nIDs[k]].shapePos;
          if(this.neighbors[nIDs[i]].neighborGradient == null) continue;
          if(this.neighbors[nIDs[k]].neighborGradient > this.myGradient) continue;
          for(let l = k+1; l < ncount; l++) {
            p[3] = this.neighbors[nIDs[l]].shapePos;
            if(this.neighbors[nIDs[i]].neighborGradient == null) continue;
            if(this.neighbors[nIDs[l]].neighborGradient > this.myGradient) continue;

            // console.log('p = ', p);
            let robustTriangles = 0;
            for(let ii = 0; ii < p.length; ii++) {
              let triangle = [];
              for(let jj = 0; jj < p.length; jj++) {
                if(jj != ii) {
                  triangle.push(p[jj]);
                }
              }
              // console.log("triangle=", triangle);
              if(this.isTriangleRobust(triangle)) {
                robustTriangles++;
              } else {
                break;
              }
            }

            if(robustTriangles == 4) {
              return [
                this.neighbors[nIDs[i]],
                this.neighbors[nIDs[j]],
                this.neighbors[nIDs[k]],
                this.neighbors[nIDs[l]],
              ];
            }
          }
        }
      }
    }

    return null;
  }

  get3ClosestNeighbours() {
    if(Object.keys(this.neighbors).length < 3) {
      return [];
    }

    let closestNeighbours = [];

    forEachObj(this.neighbors, (neigh, uid) => {
      // if(neigh.neighborUID > this.kilo_uid)
      if(neigh.neighborGradient == null) {
        return;
      }

      if(neigh.neighborGradient > this.myGradient) {
        return;
      }
      closestNeighbours.push(neigh)
    });

    /*
    closestNeighbours.sort((a, b) => {
      if(a.isSeed && b.isSeed) return Infinity * (a.measuredDist - b.measuredDist);
      if(a.isSeed) return -Infinity;
      if(b.isSeed) return +Infinity;
      return a.measuredDist - b.measuredDist;
    });
    */

    // closestNeighbours.sort((a, b) => {
    //   return Math.random() - 0.5;
    // });

    this.newEvent(`removing ${closestNeighbours.map(n => n.neighborUID).join(',')}`);
    while(closestNeighbours.length >= 3) {
      let x1 = closestNeighbours[0].shapePos.x;
      let x2 = closestNeighbours[1].shapePos.x;
      let x3 = closestNeighbours[2].shapePos.x;

      let y1 = closestNeighbours[0].shapePos.y;
      let y2 = closestNeighbours[1].shapePos.y;
      let y3 = closestNeighbours[2].shapePos.y;

      let area = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
      if(Math.abs(area) > Math.sqrt(3) * pow2(RADIUS/this.shapeScale)) {
        break;
      }

      // let slopeA = positiveMod(180 * Math.atan(calcSlope(closestNeighbours[0].shapePos, closestNeighbours[1].shapePos))/Math.PI, 360);
      // let slopeB = positiveMod(180 * Math.atan(calcSlope(closestNeighbours[1].shapePos, closestNeighbours[2].shapePos))/Math.PI, 360);
      // let slopeC = positiveMod(180 * Math.atan(calcSlope(closestNeighbours[0].shapePos, closestNeighbours[2].shapePos))/Math.PI, 360);
      // let d = 90;
      // if(Math.abs(slopeA - slopeB) > d || Math.abs(slopeC - slopeB) > d || Math.abs(slopeC - slopeA) > d) {
      //   break;
      // }
      // this.newEvent(`removing ${closestNeighbours[2].neighborUID}`);
      closestNeighbours.splice(2, 1);
      // closestNeighbours.splice(Math.floor(Math.random() * 3), 1);
      // let d = Math.sqrt(pow2(slopeA) + pow2(slopeB) + pow2(slopeC));
      // if(d > 5.0) {
      //   break;
      // }

    }

    if(closestNeighbours.length < 3) {
      return [];
    }

    return closestNeighbours;
    // return closestNeighbours.slice(0, 3);
  }

  localize() {
    // let closestNeighbours = this.get3ClosestNeighbours();
    let closestNeighbours = this.getFirstRobustQuadrilateral();
    // if(this.kilo_uid == 20 && closestNeighbours && this.counter == 600) {
    //   console.log(closestNeighbours, closestNeighbours.map(n => n.shapePos));
    // }
    if(!closestNeighbours || closestNeighbours.length < 4) {
      // this.shapePos = null;
      // this.hesitate("not enough neighbours to localize");
      // this.localizeCounter = 0;
      return;
    }

    let x = [null];
    let y = [null];
    let r = [null];

    closestNeighbours.forEach(neigh => {
      x.push(neigh.shapePos.x);
      y.push(neigh.shapePos.y);
      r.push(neigh.measuredDist/this.shapeScale);
    });

    let A = (-2 * x[1] + 2 * x[2]);
    let B = (-2 * y[1] + 2 * y[2]);

    let D = (-2 * x[2] + 2 * x[3]);
    let E = (-2 * y[2] + 2 * y[3]);

    let C = pow2(r[1]) - pow2(r[2]) - pow2(x[1]) + pow2(x[2]) - pow2(y[1]) + pow2(y[2]);
    let F = pow2(r[2]) - pow2(r[3]) - pow2(x[2]) + pow2(x[3]) - pow2(y[2]) + pow2(y[3]);

    let newPos = {
      x: (C*E - F*B) / (A*E - B*D),
      y: (C*D - F*A) / (B*D - A*E),
    };

    if(!isNaN(newPos.x) && !isNaN(newPos.y)) {
      this.shapePos = newPos;
      // this.localizeCounter++;
      // if(this.localizeCounter > 3) {
      //   this.shapePos = newPos;
      //   this.localizeCounter = 0;
      // }
    }

    // if(!isNaN(newPos.x) && !isNaN(newPos.y)) {
    //   this.posHistory.push(newPos);
    //   if(this.posHistory.length > 10) {
    //     this.posHistory.shift();
    //   }
    //   this.shapePos = {x: 0, y: 0};
    //   this.posHistory.forEach(p => {
    //     this.shapePos.x += p.x/this.posHistory.length;
    //     this.shapePos.y += p.y/this.posHistory.length;
    //   });
    // }

    // if(!isNaN(newx) && !isNaN(newy)) { // && Math.abs(newx) < Infinity && Math.abs(newy) < Infinity)
    //   this.shapePos = {
    //     x: newx,
    //     y: newy,
    //   };
    // } /*else {
    //   this.shapePos = {
    //     x: 0.0,
    //     y: 0.0,
    //   };
    // }*/

    /*
      this.shapePos = {
        x: 0.0,
        y: 0.0,
      };

      forEachObj(closestNeighbours, (neigh, uid) => {
        let c = calcDist(this.shapePos, neigh.shapePos);
        if(c == 0) {
          c = 1;
        }

        let v = {
          x: (this.shapePos.x - neigh.shapePos.x)/c,
          y: (this.shapePos.y - neigh.shapePos.y)/c,
        };
        let n = {
          x: neigh.shapePos.x + (neigh.measuredDist/this.shapeScale) * v.x,
          y: neigh.shapePos.y + (neigh.measuredDist/this.shapeScale) * v.y,
        }
        this.shapePos = {
          x: this.shapePos.x + (n.x - this.shapePos.x)/4, // Object.keys(this.neighbors).length,
          y: this.shapePos.y + (n.y - this.shapePos.y)/4, // Object.keys(this.neighbors).length,
        };
      });
      */
  }

  updateMyGradientWithNeighbor(nGrad, nUID, nConsideringMovement, distance) {
    if(distance > GRADIENT_DIST) return;
    if(!this.isStationary) return;
    if(nGrad == null) return;

    // not set yet
    if(this.myGradient == null) {
      this.hesitate("gradient", "movement");
      this.setGradient(nGrad + 1);
      return;
    }

    // from same layer
    // both peelers and waiters get this
    if(this.myGradient == nGrad) {
      if(nUID > this.kilo_uid && nConsideringMovement) {
        this.hesitate("movement");
      }
      return;
    }

    // from inner layer
    // both peelers and waiters get this
    if(this.myGradient == nGrad + 1) {
      return;
    }

    // from outer layers
    // peelers don't get this, so cannot move
    if(this.myGradient < nGrad + 1) {
      this.hesitate("gradient", "movement");
      return;
    }

    // still finding the min gradient among neighbours
    if(this.myGradient > nGrad + 1) {
      this.hesitate("gradient", "movement");
      this.setGradient(nGrad + 1);
      return;
    }
  }

  setGradient(newValue) {
    if(this.myGradient == newValue) {
      return;
    }

    this.myGradient = newValue;
    if(!this.isSeed) {
      this.set_colors_for_gradient(this.myGradient);
    }
  }

  loop() {
    this.counter++;

    forEachObj(this.neighbors, (info, uid) => {
      // too old, delete it (even if not processed)
      if(this.counter - info.receivedAt > NEIGHBOUR_EXPIRY) {
        delete(this.neighbors[uid]);
        return;
      }

      if(!info.noticedOnce) {
        if(!info.message.isStationary)
          this.hesitate("movement");

        this.updateMyGradientWithNeighbor(
          info.message.grad,
          info.message.robotUID,
          info.message.consideringMovement,
          info.measuredDist,
        );
        info.noticedOnce = true;
      }
    });

    if(this.isSeed) return;
    this.localize();

    if(!this.isHesitating("movement") && this.myGradient != null) {
      this.isStationary = false;
      this.mark();

      if (true) {
        // if(!this.shapePos) {
        //   console.error("no this.shapePos");
        // }
        // let distances = Object.keys(this.neighbors).map(uid => calcDist(this.shapePos, this.neighbors[uid].shapePos));

        let distances = Object.keys(this.neighbors).map(uid => this.neighbors[uid].measuredDist);
        let currentNearestNeighDist = Math.min.apply(null, distances);
        let DESIRED_SHAPE_DIST = 2.5 * RADIUS/this.shapeScale;

        let tooClose = currentNearestNeighDist/this.shapeScale < DESIRED_SHAPE_DIST;
        let gettingFarther = this.prevNearestNeighDist < currentNearestNeighDist;
        let noNewData = this.prevNearestNeighDist == currentNearestNeighDist;

        if(noNewData) {
          if(this.stats.motors) {
            this.set_motors(this.stats.motors[0], this.stats.motors[1]);
          }
        } else {
          this.stats.tooClose = tooClose;
          this.stats.gettingFarther = gettingFarther;
          this.stats.desiredDist = DESIRED_SHAPE_DIST;
          // this._graphics_must_update = true;
          // this.stats.orbitingBodyUID = nearestBodyUID;;
          // console.log(`tooClose=${tooClose}, gettingFarther=${gettingFarther}`);

          if(tooClose) {
            if(gettingFarther) {
              this.stats.action = 'stright';
              this.stats.motors = [this.kilo_straight_left, this.kilo_straight_right];
              this.set_motors(this.kilo_straight_left, this.kilo_straight_right);
            } else {
              this.stats.action = 'left-get-farther';
              this.stats.motors = [this.kilo_turn_left, 0];
              this.set_motors(this.kilo_turn_left, 0);
            }
          } else {
            if(gettingFarther) {
              this.stats.action = 'right-get-close';
              this.stats.motors = [0, this.kilo_turn_right];
              this.set_motors(0, this.kilo_turn_right);
            } else {
              this.stats.action = 'stright';
              this.stats.motors = [this.kilo_straight_left, this.kilo_straight_right];
              this.set_motors(this.kilo_straight_left, this.kilo_straight_right);
            }
          }
        }

        this.prevNearestNeighDist = currentNearestNeighDist;
      }

    } else {
      if(!this.isStationary) {
        this.setGradient(null);
        this.isStationary = true;
      }
      this.unmark();
    }
  }

  hesitate() {
    let c = this.counter;
    for(let i = 0; i < arguments.length; i++) {
      let arg = arguments[i];
      this.hesitateData[arg] = c;
    }
  }

  isHesitating(what) {
    let d = this.hesitateData[what];
    if(d != undefined && this.counter < d + HESITATE_DURATION) {
      return true;
    }
    delete(this.hesitateData[what]);
    return false;
  }

  kilo_message_rx(message, distance) {
    this.neighbors[message.robotUID] = {
      neighborUID: message.robotUID,
      neighborGradient: message.grad,
      receivedAt: this.counter,
      measuredDist: distance,
      shapePos: message.shapePos,
      isSeed: message.isSeed,
      isStationary: message.isStationary,
      message: message,
    };
  }

  kilo_message_tx() {
    return {
      grad: this.myGradient,
      isStationary: this.isStationary,
      robotUID: this.kilo_uid,
      consideringMovement: !this.isHesitating("movement"),
      shapePos: this.shapePos,
      isSeed: this.isSeed,
    };
  }
}

class RootSeedRobot extends Kilobot {
  constructor(opts) {
    super();
    this.shapeScale = opts.shapeScale;
    this.shapeDesc = opts.shapeDesc;
    this.shapePos = opts.shapePos;
    this.isStationary = true;
    this.counter = 0;
  }

  setup() {
    this.set_color(new RGB(1, 1, 1));
  }

  loop() {
    this.counter++;
  }

  kilo_message_rx(message, distance) {
    // ignore
  }

  kilo_message_tx() {
    return {
      grad: 0,
      isStationary: this.isStationary,
      shapePos: this.shapePos,
      robotUID: this.kilo_uid,
      isSeed: true,
    };
  }
}
