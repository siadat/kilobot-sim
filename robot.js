const COLORS = [
  new RGB(3, 0, 0), // red
  new RGB(3, 0, 3), // magenta
  new RGB(0, 0, 3), // blue
  new RGB(0, 3, 3), // cyan
  new RGB(0, 3, 0), // green
  new RGB(3, 3, 0), // yellow
];

const GRADIENT_DIST = INITIAL_DIST + 1*RADIUS;
const HESITATE_DURATION = 20 * 60 / MSG_PER_SEC;
const NEIGHBOUR_EXPIRY = 2 * 60 / MSG_PER_SEC;
const DESIRED_SHAPE_DIST = 3 * RADIUS/ShapeScale;
const isTriangleRobust = (points) => {
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

const States = {
  Start                  : 'Start',
  WaitToMove             : 'WaitToMove',
  MoveWhileOutside       : 'MoveWhileOutside',
  MoveWhileInside        : 'MoveWhileInside',
  // MoveWhileInsideParking: 'MoveWhileInsideParking',
  JoinedShape            : 'JoinedShape',
  // 'idle',
  // 'move_out', // mobile
  // 'move_in',  // mobile
  // 'stop_in',  // stopped
  // 'stop_out', // stopped
}

class GradientAndAssemblyRobot extends Kilobot {
  constructor(opts) {
    super();
    this.shapeScale = opts.shapeScale;
    this.shapeDesc = opts.shapeDesc;
    this.isSeed = opts.isSeed;
    this.isGradientSeed = opts.isGradientSeed;
    this.shapePos = opts.shapePos;
    this.neighbors = {};
    this.isStationary = true;
    this.prevNearestNeighDist = Infinity;
    this.stats = {};
    this.events = [];
    this.edgeFollowingAge = 0;
    this.desiredDistance = DESIRED_SHAPE_DIST;
    this.lastExpireCheck = -1;
    // this.slowDown = false;

    this.switchToState(States.Start);
  }

  setup() {
    this.myGradient = null;
    this.hesitateData = {};
    this.counter = 0;
    // this.posHistory = [];
    // this.localizeCounter = 0;

    if(this.isSeed) {
      this.set_color(new RGB(3, 3, 3));
    } else {
      this.set_color(new RGB(2, 2, 2));
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
    if(true) {
      this.events.push(s);
    }
  }

  set_colors_for_gradient(g) {
    if(g == null) {
      return;
    }
    this.set_color(COLORS[g % COLORS.length]);
  }


  getFirstRobustTriangle() {
    let nIDs = Object.keys(this.neighbors);
    nIDs = nIDs.filter(nid => this.neighbors[nid].shapePos != null && this.neighbors[nid].isStationary);
    // nIDs.sort((a, b) => this.neighbors[a].neighborGradient - this.neighbors[b].neighborGradient);
    nIDs.sort((a, b) => this.neighbors[a].measuredDist - this.neighbors[b].measuredDist);
    let ncount = nIDs.length;

    if(ncount < 3) {
      return null;
    }

    let p = [
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
        if(this.neighbors[nIDs[j]].neighborGradient == null) continue;
        if(this.neighbors[nIDs[j]].neighborGradient > this.myGradient) continue;
        for(let k = j+1; k < ncount; k++) {
          p[2] = this.neighbors[nIDs[k]].shapePos;
          if(this.neighbors[nIDs[k]].neighborGradient == null) continue;
          if(this.neighbors[nIDs[k]].neighborGradient > this.myGradient) continue;
          let triangle = [
            this.neighbors[nIDs[i]].shapePos,
            this.neighbors[nIDs[j]].shapePos,
            this.neighbors[nIDs[k]].shapePos,
          ];
          if(isTriangleRobust(triangle)) {
            return [
              this.neighbors[nIDs[i]],
              this.neighbors[nIDs[j]],
              this.neighbors[nIDs[k]],
            ];
          }
        }
      }
    }

    return null;
  }

  getFirstRobustQuadrilateral() {
    // if(this._cached_first_quad) {
    //   return this._cached_first_quad;
    // }
    // let nIDs = Object.keys(this.neighbors);
    let nIDs = this.getNeighborsUIDs().filter(nid => {
      let n = this.neighbors[nid];
      return (
           n.shapePos != null
        && n.isStationary
        && n.neighborGradient != null
        && (n.neighborState == States.JoinedShape || n.neighborGradient < this.myGradient)
      );
    }).sort((a, b) => {
      return +(this.neighbors[a].measuredDist - this.neighbors[b].measuredDist);
    }).slice(0, 10);

    // this.currentFarthestLocalizingNeighborUID = nIDs[nIDs.length-1];

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
      for(let j = i+1; j < ncount; j++) {
        p[1] = this.neighbors[nIDs[j]].shapePos;
        for(let k = j+1; k < ncount; k++) {
          p[2] = this.neighbors[nIDs[k]].shapePos;
          for(let l = k+1; l < ncount; l++) {
            p[3] = this.neighbors[nIDs[l]].shapePos;

            let robustTriangles = 0;
            for(let skippedIdx = 0; skippedIdx < p.length; skippedIdx++) {
              let triangle = [];
              for(let includedIdx = 0; includedIdx < p.length; includedIdx++) {
                if(includedIdx != skippedIdx) {
                  triangle.push(p[includedIdx]);
                }
              }
              if(isTriangleRobust(triangle)) {
                robustTriangles++;
              } else {
                break;
              }
            }

            if(robustTriangles == 4) {
              return [
                nIDs[i],
                nIDs[j],
                nIDs[k],
                nIDs[l],
              ]
              // this._cached_first_quad = [
              //   nIDs[i],
              //   nIDs[j],
              //   nIDs[k],
              //   nIDs[l],
              // ]
              // return this._cached_first_quad;
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

  getNeighborsUIDs() {
    if(this._neighborsUIDs != null) {
      return this._neighborsUIDs;
    }
    let nIDs = Object.keys(this.neighbors);
    this._neighborsUIDs = nIDs.filter(nuid => this.counter - this.neighbors[nuid].seenAt < NEIGHBOUR_EXPIRY);
    return this._neighborsUIDs;
  }

  getNeighbors() {
    if(this._neighbors != null) {
      return this._neighbors;
    }
    let nIDs = Object.keys(this.neighbors);
    this._neighbors = nIDs.filter(nuid => this.counter - this.neighbors[nuid].seenAt < NEIGHBOUR_EXPIRY).map(nuid => this.neighbors[nuid]);
    return this._neighbors;
  }

  forEachNeighbor(f) {
    forEachObj(this.neighbors, (neigh, uid) => {
      if(this.lastExpireCheck != this.counter) {
        // too old, delete it (even if not processed)
        if(this.counter - neigh.seenAt > NEIGHBOUR_EXPIRY) {
          delete(this.neighbors[uid]);
          return;
        }
      }

      f(neigh, uid);
    });
    // if(this.lastExpireCheck != this.counter) {
    //   this.lastExpireCheck = this.counter;
    // }
  }

  gradientFormation() {
    // if(BENCHMARKING) return;
    if(this.myGradient == null) {
      this.hesitate("movement");
      this.isStationary = true;
      this.unmark();
    }

    // if(!this.isStationary)
    //   return;

    if(this.isGradientSeed) {
      this.myGradient = 0;
      return;
    }

    let grad = Infinity;

    this.getNeighborsUIDs().forEach(nuid => {
      let neigh = this.neighbors[nuid];
      if(neigh.measuredDist > GRADIENT_DIST)
        return;

      if(neigh.message.grad == null)
        return;

      if(!neigh.isStationary)
        return;

      if(neigh.message.grad < grad)
        grad = neigh.message.grad; 
    });

    /*
    this.getNeighbors().forEach(neigh => {
      // let neigh = this.neighbors[nuid];
      if(neigh.measuredDist > GRADIENT_DIST)
        return;

      if(neigh.message.grad == null)
        return;

      if(!neigh.isStationary)
        return;

      if(neigh.message.grad < grad)
        grad = neigh.message.grad; 
    });
    */

    /*
    this.forEachNeighbor((neigh, nuid) => {
      if(neigh.measuredDist > GRADIENT_DIST)
        return;

      if(neigh.message.grad == null)
        return;

      if(!neigh.isStationary)
        return;

      if(neigh.message.grad < grad)
        grad = neigh.message.grad; 
    });
    */

    if(grad < Infinity)
      this.setGradient(grad + 1);
  }

  getNearestNeighbor() {
    let ret = null;

    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(ret == null) {
        ret = n;
        return;
      }

      if(n.measuredDist < ret.measuredDist) {
        ret = n
        return;
      }
    });

    /*
    this.forEachNeighbor((n, uid) => {
      if(ret == null) {
        ret = n;
        return;
      }

      if(n.measuredDist < ret.measuredDist) {
        ret = n
        return;
      }
    });
    */

    return ret;
  }

  getHighestUIDInNeighbors() {
    let ret = null;

    // this.forEachNeighbor((n, uid) => {
    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(ret == null) {
        ret = n;
        return;
      }

      if(n.neighborUID == null)
        return;

      if(n.neighborUID > ret.neighborUID) {
        ret = n;
        return;
      }

    });

    return ret;
  }

  getHighestGradAndIDNeighbor() {
    let ret = null;

    // this.forEachNeighbor((n, uid) => {
    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(n.measuredDist > GRADIENT_DIST)
        return;

      if(ret == null) {
        ret = n;
        return;
      }

      if(n.neighborGradient == null)
        return;

      if(n.neighborGradient > ret.neighborGradient) {
        ret = n;
        return;
      }

      if(n.neighborGradient == ret.neighborGradient && n.neighborUID > ret.neighborUID) {
        ret = n;
        return;
      }

    });

    return ret;
  }

  localize() {
    if(this.isSeed) return;
    // this.localizeSimpleExact();
    this.localizeSupplement();
  }

  // The reason localizeSimpleExact doesn't always work is 3 things:
  // - lack of nearby robust trianles in neighbors
  // - we move and even accurate data becomes obsolete
  // - ambiguities, eg flip
  localizeSimpleExact() {
    // let closestNeighbours = this.get3ClosestNeighbours();
    let closestNeighbours = this.getFirstRobustQuadrilateral();
    if(!closestNeighbours || closestNeighbours.length < 4) {
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
  }

  localizeSupplement() {
    if(this.shapePos == null) {
      // not starting from 0,0 because 0,0 is always inside the shape!
      this.shapePos = {
        x: 0, // -Math.random() * PER_ROW*2*RADIUS/ShapeScale + MARGIN*2*RADIUS/ShapeScale,
        y: -10, // -4*RADIUS/ShapeScale - Math.random() * PER_ROW*2*RADIUS/ShapeScale,
      };
    }

    // let closestNeighbours = this.getFirstRobustTriangle();
    let closestNeighbourIDs = this.getFirstRobustQuadrilateral();

    if(!closestNeighbourIDs || closestNeighbourIDs.length < 3) {
      return;
    }

    closestNeighbourIDs.forEach(nuid => {
      let neigh = this.neighbors[nuid];
      let c = calcDist(this.shapePos, neigh.shapePos);
      let v = {x: 0, y: 0};
      if(c != 0) {
        v = {
          x: (this.shapePos.x - neigh.shapePos.x)/c,
          y: (this.shapePos.y - neigh.shapePos.y)/c,
        };
      }
      let n = {
        x: neigh.shapePos.x + (neigh.measuredDist/this.shapeScale) * v.x,
        y: neigh.shapePos.y + (neigh.measuredDist/this.shapeScale) * v.y,
      }
      // console.log('iteration', this.shapePos, neigh.shapePos, c, v, n);
      this.shapePos = {
        x: this.shapePos.x + (n.x - this.shapePos.x)/4, // Object.keys(this.neighbors).length,
        y: this.shapePos.y + (n.y - this.shapePos.y)/4, // Object.keys(this.neighbors).length,
        // x: this.shapePos.x - (this.shapePos.x - n.x)/1, // Object.keys(this.neighbors).length,
        // y: this.shapePos.y - (this.shapePos.y - n.y)/1, // Object.keys(this.neighbors).length,
      };
    });
  }

  seenRecentMovingNeighbors() {
    let seen = false;
    // this.forEachNeighbor((info, uid) => {
    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(seen == true)
        return;

      if(!n.isStationary && n.edgeFollowingAge >= this.edgeFollowingAge) {
        seen = true;
      }
    });

    return seen;
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

  isInsideShape() {
    if(this.shapePos == null)
      return false;

    let x = Math.floor(this.shapePos.x);
    let y = this.shapeDesc.length - Math.floor(this.shapePos.y) - 1;

    return this.shapeDesc[y] && this.shapeDesc[y][x] == '#';
  }

  doEdgeFollow() {
    this.edgeFollowingAge++;
    let nn = this.getNearestNeighbor();
    if(nn == null) return;

    let tooClose = nn.measuredDist/this.shapeScale < DESIRED_SHAPE_DIST; // this.desiredDistance;
    let gettingFarther = this.prevNearestNeighDist < nn.measuredDist;
    let noNewData = this.prevNearestNeighDist == nn.measuredDist;
    this.prevNearestNeighDist = nn.measuredDist;

    if(noNewData) {
      // if(!this.slowDown && this.stats.motors) {
      if(this.stats.motors) {
        // if(this.counter % 2 == 0) {
          this.set_motors(this.stats.motors[0], this.stats.motors[1]);
        // }
      }
      // if(this.stats.motors) {
      //   if(this.stats.motors[0] > this.stats.motors[1]) {
      //     this.set_motors(this.stats.motors[0], this.stats.motors[1]);
      //   }
      // }
      return;
    }
    // this.stats.tooClose = tooClose;
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

  switchToState(newState, reason) {
    if(this.state != newState) {
      let msg = `switching to ${newState}`;
      if(reason) {
        msg += `, reason: ${reason}`;
      }
      this.newEvent(msg);
      this._graphics_must_update = true;
      this.state = newState;
    }
  }

  loop() {
    this._neighbors = null;
    this._neighborsUIDs = null;
    // if(BENCHMARKING) {
    //   // this.set_motors(
    //   //   Math.random() > 0.5 ? this.kilo_straight_left : 0,
    //   //   Math.random() > 0.5 ? this.kilo_straight_right: 0,
    //   // );
    //   this.gradientFormation();
    //   return;
    // }
    this.counter++;

    switch(this.state) {

      case States.Start:
        this.gradientFormation();
        this.localize();

        if(this.isSeed) {
          this.switchToState(States.JoinedShape, "isSeed");
          return;
        }

        this.switchToState(States.WaitToMove);
        break;

      case States.WaitToMove:
        this.isStationary = true;
        this.gradientFormation();
        this.localize();

        if(this.isHesitating("movement")) {
          return;
        }

        if(this.seenRecentMovingNeighbors()) {
          this.hesitate("movement");
          this.isStationary = true;
          this.unmark();
          return;
        }


        {
          let hgn = this.getHighestGradAndIDNeighbor();
          if(hgn == null) return;

          if(this.myGradient > hgn.neighborGradient) {
            this.switchToState(States.MoveWhileOutside, "my grad > my neighbors");
          } else if(this.myGradient == hgn.neighborGradient) {
            if(this.kilo_uid > hgn.neighborUID) {
              this.switchToState(States.MoveWhileOutside, "equal grads, but my ID is larger");
            }
          }
        }
        break;
      case States.MoveWhileOutside:
        this.localize();
        this.gradientFormation();

        if(this.isInsideShape()) {
          // this.myGradient = null;
          this.switchToState(States.MoveWhileInside, "inside shape");
        }

        if(this.seenRecentMovingNeighbors()) {
          this.isStationary = true;
          this.unmark();
          return;
        }

        this.mark();
        this.isStationary = false;
        this.doEdgeFollow();
        break;
      case States.MoveWhileInside:
        // this.desiredDistance = DESIRED_SHAPE_DIST;
        // this.desiredDistance = 2 * RADIUS/ShapeScale;
        // this.slowDown = true;

        this.localize();
        this.gradientFormation();
        this.mark();
        this.isStationary = false;
        this.doEdgeFollow();

        if(!this.isInsideShape()) {
          this.switchToState(States.JoinedShape, "went out");
          return;
        }

        {
          let nn = this.getNearestNeighbor();
          if(nn != null && nn.neighborGradient >= this.myGradient /*&& nn.neighborGradient != 1*/) {
            this.switchToState(States.JoinedShape, `my grad ${this.myGradient} >= closest neighbor ${nn.neighborGradient }`);
            // this.switchToState(States.MoveWhileInsideParking, `my grad ${this.myGradient} >= closest neighbor ${nn.neighborGradient }`);
            return;
          }
        }

        break;
        //  case States.MoveWhileInsideParking:
        //    this.desiredDistance = 2 * RADIUS/ShapeScale;
        
        //    this.localize();
        //    this.gradientFormation();
        //    this.mark();
        //    this.isStationary = false;
        //    this.doEdgeFollow();
        
        //    if(!this.isInsideShape()) {
        //      this.switchToState(States.JoinedShape, "went out");
        //      return;
        //    }
        
        //    {
        //      let nn = this.getNearestNeighbor();
        //      if(nn == null) {
        //        this.switchToState(States.MoveWhileInside, "no neighbors");
        //        return;
        //      }
        //    }
        
        //    break;
      case States.JoinedShape:
        this.unmark();
        this.isStationary = true;
        this.localize();
        if(this.isSeed)
          this.gradientFormation();
        // this.localize();
        break;
    }


    /*
    */
  }

  hesitate(what) {
    this.hesitateData[what] = this.counter;
  }

  isHesitating(what) {
    let at = this.hesitateData[what];
    if(at != undefined && this.counter < at + HESITATE_DURATION) {
      return true;
    }
    delete(this.hesitateData[what]);
    return false;
  }

  kilo_message_rx(message, distance) {
    // let n = this.neighbors[message.robotUID]; 
    // if(!n
    //   || n.neighborGradient != message.grad
    //   || (n.shapePos && (n.shapePos.x != message.shapePos.x || n.shapePos.y != message.shapePos.y))
    //   || n.isStationary != message.isStationary
    //   || n.measuredDist != distance
    // ) {
    //   this._cached_first_quad = null;
    // }
    // if(!this.neighbors[this.currentFarthestLocalizingNeighborUID] || this.neighbors[this.currentFarthestLocalizingNeighborUID].measuredDist >= distance) {
    //   this._cached_first_quad = null;
    // }
    this.neighbors[message.robotUID] = {
      neighborUID: message.robotUID,
      neighborGradient: message.grad,
      neighborState: message.state,
      edgeFollowingAge: message.edgeFollowingAge,
      seenAt: this.counter,
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
      // consideringMovement: !this.isHesitating("movement"),
      shapePos: this.shapePos,
      isSeed: this.isSeed,
      state: this.state,
      edgeFollowingAge: this.edgeFollowingAge,
    };
  }
}
