const calculateDistance = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}
const isTriangleRobust = (points) => {
  let e = [null, null, null];
  let a = [null, null, null];

  e[0] = calculateDistance(points[1], points[2]);
  e[1] = calculateDistance(points[0], points[2]);
  e[2] = calculateDistance(points[0], points[1]);


  const pow2 = x => x*x;
  a[0] = Math.acos((pow2(e[1]) + pow2(e[2]) - pow2(e[0])) / (2 * e[1] * e[2]));
  a[1] = Math.acos((pow2(e[0]) + pow2(e[2]) - pow2(e[1])) / (2 * e[0] * e[2]));
  a[2] = Math.acos((pow2(e[1]) + pow2(e[0]) - pow2(e[2])) / (2 * e[1] * e[0]));

  let minAngle = Math.min(a[0], a[1], a[2]);
  let minEdge  = Math.min(e[0], e[1], e[2]);

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
}

class GradientAndAssemblyRobot extends Kilobot {
  constructor(opts) {
    super();
    this.gradientDist = opts.gradientDist;
    this.initialDist = opts.initialDist;
    this.HESITATE_DURATION = 20 * opts.ticksBetweenMsgs;
    this.NEIGHBOUR_EXPIRY = 2 * opts.ticksBetweenMsgs;
    this.DESIRED_SHAPE_DIST = 3.5*opts.radius;
    this.NEARBY_MOVING_DISTANCE = 4*this.DESIRED_SHAPE_DIST;

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
    this.lastExpireCheck = -1;
    this.isInsideShape = opts.isInsideShape;
    this.edgeFollowingStartedAt = null;

    this.switchToState(States.Start);

    this.COLORS = [
      this.RGB(3, 0, 0), // red
      this.RGB(3, 0, 3), // magenta
      this.RGB(0, 0, 3), // blue
      this.RGB(0, 3, 3), // cyan
      this.RGB(0, 3, 0), // green
      this.RGB(3, 3, 0), // yellow
    ];

    // this.COLORS_INTENSE = [
    //   this.RGB(3, 0, 0), // red
    //   this.RGB(3, 0, 3), // magenta
    //   this.RGB(0, 0, 3), // blue
    //   this.RGB(0, 3, 3), // cyan
    //   this.RGB(0, 3, 0), // green
    //   this.RGB(3, 3, 0), // yellow
    // ];

  }

  setup() {
    this.myGradient = null;
    this.hesitateData = {};
    this.counter = 0;
    // this.posHistory = [];
    // this.localizeCounter = 0;

    if(this.isSeed) {
      this.set_color(this.RGB(3, 3, 3));
    } else {
      this.set_color(this.RGB(2, 2, 2));
    }
  }

  smoothColor(x, b) {
    // Usage::
    //   this.set_color(this.RGB(
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
    this.set_color(this.COLORS[g % this.COLORS.length]);
  }


  getFirstRobustTriangle() {
    let nIDs = Object.keys(this.neighbors);
    nIDs = nIDs.filter(nid => this.neighbors[nid].shapePos != null && this.neighbors[nid].isStationary);
    // nIDs.sort((a, b) => this.neighbors[a].neighborGradient - this.neighbors[b].neighborGradient);
    nIDs.sort((a, b) => -(this.neighbors[a].measuredDist - this.neighbors[b].measuredDist));
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
    let nIDs = this.getNeighborsUIDs().filter(nid => {
      let n = this.neighbors[nid];
      return (
           n.shapePos != null
        && n.isStationary
        && n.neighborGradient != null
        && (/*n.neighborState == States.JoinedShape ||*/ n.neighborGradient < this.myGradient)
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
            }
          }
        }
      }
    }

    return null;
  }

  getNeighborsUIDs() {
    if(this._neighborsUIDs != null) {
      return this._neighborsUIDs;
    }
    let nIDs = Object.keys(this.neighbors);
    this._neighborsUIDs = nIDs.filter(nuid => this.counter - this.neighbors[nuid].seenAt < this.NEIGHBOUR_EXPIRY);
    return this._neighborsUIDs;
  }

  gradientFormation() {
    if(this.myGradient == null) {
      this.hesitate("movement");
      this.isStationary = true;
      this.unmark();
    }

    if(this.isGradientSeed) {
      this.myGradient = 0;
      return;
    }

    let grad = Infinity;

    this.getNeighborsUIDs().forEach(nuid => {
      let neigh = this.neighbors[nuid];
      if(neigh.measuredDist > this.gradientDist)
        return;

      if(neigh.message.grad == null)
        return;

      if(!neigh.isStationary)
        return;

      if(neigh.message.grad < grad)
        grad = neigh.message.grad;
    });

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

    return ret;
  }

  getHighestUIDInNeighbors() {
    let ret = null;

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

    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(n.measuredDist > this.gradientDist)
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
    if(this.shapePos == null) {
      // not starting from 0,0
      // because 0,0 is always inside the shape!
      this.shapePos = {
        x: 0,
        y: 10*this.initialDist,
      };
    }

    let closestNeighbourIDs = this.getFirstRobustQuadrilateral();

    if(!closestNeighbourIDs || closestNeighbourIDs.length < 3) {
      return;
    }

    closestNeighbourIDs.forEach(nuid => {
      let neigh = this.neighbors[nuid];
      let c = calculateDistance(this.shapePos, neigh.shapePos);
      let v = {x: 0, y: 0};
      if(c != 0) {
        v = {
          x: (this.shapePos.x - neigh.shapePos.x)/c,
          y: (this.shapePos.y - neigh.shapePos.y)/c,
        };
      }
      let n = {
        x: neigh.shapePos.x + (neigh.measuredDist) * v.x,
        y: neigh.shapePos.y + (neigh.measuredDist) * v.y,
      }
      this.shapePos = {
        x: this.shapePos.x + (n.x - this.shapePos.x)/4,
        y: this.shapePos.y + (n.y - this.shapePos.y)/4,
      };
    });
  }

  seenRecentMovingOrPausedNeighbors() {
    let seen = false;
    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(seen == true)
        return;

      if(n.state == States.WaitToMove && n.edgeFollowingAge > 0) {
        seen = true;
        return;
      }

      if(n.isStationary) return;
      if(n.measuredDist > this.NEARBY_MOVING_DISTANCE) return;
      // if(n.neighborUID < this.kilo_uid) return;
      if(n.edgeFollowingAge < this.edgeFollowingAge) return;

      seen = true;
    });

    return seen;
  }

  seenRecentMovingNeighbors() {
    let seen = false;
    this.getNeighborsUIDs().forEach(nuid => {
      let n = this.neighbors[nuid];
      if(seen == true)
        return;

      if(n.isStationary) return;
      if(n.measuredDist > this.NEARBY_MOVING_DISTANCE) return;
      // if(n.neighborUID < this.kilo_uid) return;
      if(n.edgeFollowingAge < this.edgeFollowingAge) return;

      seen = true;
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

  doEdgeFollow() {
    if(this.edgeFollowingStartedAt == null) {
      this.edgeFollowingStartedAt = this.counter;
    }
    this.edgeFollowingAge++;
    let nn = this.getNearestNeighbor();
    if(nn == null) return;

    let tooClose = nn.measuredDist < this.DESIRED_SHAPE_DIST;
    let gettingFarther = this.prevNearestNeighDist < nn.measuredDist;
    let noNewData = this.prevNearestNeighDist == nn.measuredDist;
    this.prevNearestNeighDist = nn.measuredDist;

    if(noNewData) {
      if(this.stats.motors) {
        this.set_motors(this.stats.motors[0], this.stats.motors[1]);
      }
      return;
    }

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
    this._neighborsUIDs = null;
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
        // break; // <

        if(this.isHesitating("movement")) {
          return;
        }

        if(this.seenRecentMovingOrPausedNeighbors()) {
          // if(this.seenRecentMovingNeighbors()) {
          // this.edgeFollowingAge = this._uid;
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

        if(this.isInsideShape(this.shapePos)) {
          // this.myGradient = null;
          this.switchToState(States.MoveWhileInside, "inside shape");
        }

          /*
        if(this.seenRecentMovingNeighbors()) {
          // this.edgeFollowingAge = this._uid;
          this.hesitate("movement");
          this.isStationary = true;
          this.unmark();
          return;
        }
      */

        this.mark();
        this.isStationary = false;
        this.doEdgeFollow();
        break;
      case States.MoveWhileInside:
        this.localize();
        this.gradientFormation();
        this.mark();
        this.isStationary = false;
        this.doEdgeFollow();

        if(!this.isInsideShape(this.shapePos)) {
          this.switchToState(States.JoinedShape, "went out");
          return;
        }

        {
          let nn = this.getNearestNeighbor();
          if(nn != null && nn.neighborGradient >= this.myGradient /*&& nn.neighborGradient != 1*/) {
            this.switchToState(States.JoinedShape, `my grad ${this.myGradient} >= closest neighbor ${nn.neighborGradient }`);
            return;
          }
        }

        break;
      case States.JoinedShape:
        this.unmark();
        this.isStationary = true;
        this.localize();

        // if(!this.isSeed) {
        //   this.set_color(this.COLORS_INTENSE[this.myGradient % this.COLORS_INTENSE.length]);
        // }

        if(this.isSeed)
          this.gradientFormation();
        break;
    }


    /*
    */
  }

  hesitate(what) {
    this.hesitateData[what] = this.counter + this.HESITATE_DURATION*(this.rand_soft()/255.0*0.2);
  }

  isHesitating(what) {
    let at = this.hesitateData[what];
    if(at != undefined && this.counter < at + this.HESITATE_DURATION) {
      return true;
    }
    delete(this.hesitateData[what]);
    return false;
  }

  message_rx(message, distance) {
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

  message_tx() {
    return {
      grad: this.myGradient,
      isStationary: this.isStationary,
      robotUID: this.kilo_uid,
      shapePos: this.shapePos,
      isSeed: this.isSeed,
      state: this.state,
      edgeFollowingAge: this.edgeFollowingAge,
    };
  }
}

// ----

window['ExperimentAssembly'] = class {
  constructor() {
    this.selectedUID = null;
    this.drawLocalizationError = true;
    this.COUNT = 4 + 204;

    this.runnerOptions = {
      limitSpeed: false,
      traversedPath: true,
    }
  }

  clickedOutside() {
    this.selectedUID = null;
  }

  createRobots(newRobot, RADIUS, NEIGHBOUR_DISTANCE, TICKS_BETWEEN_MSGS) {
    const INITIAL_DIST = NEIGHBOUR_DISTANCE/11*3;
    const GRADIENT_DIST = 1.5*INITIAL_DIST;
    this.RADIUS = RADIUS;
    this._ShapeScale = 1.5*this.RADIUS; // 1.5*this.RADIUS
    this.ShapeDesc = [[" "," "," "," "," "," "," ","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" "," "," "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#"," "," "],[" "," "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," ","#","#","#","#","#","#","#","#","#"," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "," "],[" "," "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "," "],[" "," "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "," "],[" "," "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"," "," "],[" "," ","#","#","#","#","#","#","#","#","#"," "," "," "," ","#","#","#","#","#","#","#","#","#","#"," "," "],[" ","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#","#"," "],[" ","#","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "],[" ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "],[" ","#","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "],[" "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "," "],[" "," ","#","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#","#"," "," "," "," "],[" "," "," ","#","#","#"," "," "," "," "," "," "," "," "," "," "," "," ","#","#","#","#"," "," "," "," "," "],[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," "," ","R","#"," "," "," "," "," "," "," "]];

    this.RootSeedPos = {
      x: 0,
      y: 0,
    };

    this.ShapePosOffset = {x: 0, y: 0};
    let _ShapePosRootIndexes = {x: 0, y: 0};

    if(true){
      let trimmed = false;
      let rowCount = this.ShapeDesc.length;
      for(let rowi = rowCount-1; rowi >= 0; rowi--) {
        if(trimmed) {
          break;
        }
        for(let coli = 0; coli < this.ShapeDesc[rowi].length; coli++) {
          if(this.ShapeDesc[rowi][coli] == '#') {
            this.ShapeDesc = this.ShapeDesc.slice(0, rowi+1);
            _ShapePosRootIndexes = {
              x: coli,
              y: 0,
            };
            this.ShapePosOffset = {
              x: this.RootSeedPos.x - _ShapePosRootIndexes.x*this._ShapeScale,
              y: this.RootSeedPos.y - _ShapePosRootIndexes.y*this._ShapeScale,
            };
            trimmed = true;
            break;
          }
        }
      }
    }

    let MathRandom = new Math.seedrandom(1234);
    const noise = function(magnitude) {
      return magnitude * (MathRandom()-0.5);
    }
    const shapePosToPhysPos = (shapePos) => {
      return {
        x: this.RootSeedPos.x + shapePos.x,
        y: this.RootSeedPos.y + shapePos.y,
      };
    }

    const isInsideShape = (pos) => {
      if(pos == null) return false;
      let i = Math.floor(+(pos.x-this.ShapePosOffset.x)/this._ShapeScale);
      let j = Math.floor(-(pos.y-this.ShapePosOffset.y)/this._ShapeScale);
      j = this.ShapeDesc.length - 1 - j;
      return this.ShapeDesc[j] && this.ShapeDesc[j][i] == '#';
    }

    let bodyCounter = 0;
    [
      {isSeed: true, isRoot: true,  x: 0*INITIAL_DIST/2, y: INITIAL_DIST/2 * 0},
      {isSeed: true, isRoot: false, x: 2*INITIAL_DIST/2, y: INITIAL_DIST/2 * 0},
      {isSeed: true, isRoot: false, x: 1*INITIAL_DIST/2, y: INITIAL_DIST/2 * +Math.sqrt(3)},
      {isSeed: true, isRoot: false, x: 1*INITIAL_DIST/2, y: INITIAL_DIST/2 * -Math.sqrt(3)},
    ].forEach(shapePos => {
      bodyCounter++;

      newRobot(
        shapePosToPhysPos(shapePos),
        MathRandom() * 2*Math.PI,
        new GradientAndAssemblyRobot({
          gradientDist: GRADIENT_DIST,
          initialDist: INITIAL_DIST,
          ticksBetweenMsgs: TICKS_BETWEEN_MSGS,
          radius: this.RADIUS,

          isInsideShape: isInsideShape,
          shapePos: shapePos.isSeed ? {x: shapePos.x, y: shapePos.y} : null,
          isGradientSeed: shapePos.isSeed && shapePos.isRoot,
          isSeed: shapePos.isSeed,
        }),
      );
    });

    const TAKEN = true;
    let hexagrid = {};
    let hexagridCursor = {
      x: 0,
      y: -1,
    };

    let gridPosToPhysPos = (gridPos) => {
      let pos = {
        x: (this.RootSeedPos.x + INITIAL_DIST/2),
        y: (this.RootSeedPos.y + Math.sqrt(3) * INITIAL_DIST/2 + 2*INITIAL_DIST/2),
      };

      pos.x += gridPos.x * INITIAL_DIST + (gridPos.y%2==0 ? -INITIAL_DIST/2 : 0);
      pos.y += gridPos.y * INITIAL_DIST * Math.sqrt(3)/2;
      return pos;
    }

    let assemblyCount = this.COUNT - bodyCounter;
    let hexaNeighbors = [
               [0,   -1], [+1,-1],
      [-1, 0], /*cursor*/ [+1, 0],
               [0,   +1], [+1,+1],
    ];

    for(let i = 0; i < assemblyCount; i++) {
      let candidates = hexaNeighbors.map(adjacentPoint => {
        let candidate = {
          x: hexagridCursor.x + adjacentPoint[0],
          y: hexagridCursor.y + adjacentPoint[1],
        }

        if(hexagrid[`${candidate.x}:${candidate.y}`] == TAKEN)
          return null;

        if(!true) {
          if(candidate.y < 0) return null;
        } else {
          let seedAreaWidth = Math.floor(NEIGHBOUR_DISTANCE/INITIAL_DIST) * 2;
          if(candidate.x < -seedAreaWidth/2 || candidate.x > +seedAreaWidth/2 || candidate.y < 0) {
            for(let rowi = 0; rowi < this.ShapeDesc.length; rowi++) {
              let row = this.ShapeDesc[rowi];
              for(let coli = 0; coli < row.length; coli++) {
                if(row[coli] != '#')
                  continue;
                let p = {
                  x: this.ShapePosOffset.x + coli*this._ShapeScale,
                  y: this.ShapePosOffset.y - (this.ShapeDesc.length-1 - rowi)*this._ShapeScale,
                }
                if(calculateDistance(gridPosToPhysPos(candidate), p) < 4*INITIAL_DIST) {
                  return null;
                }
              }
            }
          }
        }

        let distToOrigin = calculateDistance(gridPosToPhysPos(candidate), gridPosToPhysPos({x: 0, y: 0}));

        return {
          x: candidate.x,
          y: candidate.y,
          dist: distToOrigin,
        };
      }).filter(x => x != null).sort((a, b) => a.dist - b.dist);

      let best = candidates[0];

      if(best == null) {
        console.error("'best' should not be null");
        return;
      }

      hexagrid[`${best.x}:${best.y}`] = TAKEN;

      let pos = gridPosToPhysPos(best);

      hexagridCursor.x = best.x;
      hexagridCursor.y = best.y;

      let PERFECT = false;
      if(!PERFECT) {
        pos.x += noise(0.2 * this.RADIUS);
        pos.y += noise(0.2 * this.RADIUS);
      }

      newRobot(
        pos,
        MathRandom() * 2*Math.PI,
        new GradientAndAssemblyRobot({
          gradientDist: GRADIENT_DIST,
          initialDist: INITIAL_DIST,
          ticksBetweenMsgs: TICKS_BETWEEN_MSGS,
          radius: this.RADIUS,

          isInsideShape: isInsideShape,
          shapePos: null,
          isSeed: false,
        }),
      );
    }
  }

  setupGraphics(
    PIXI,
    Box2D,
    pixiApp,
    platformGraphics,
    bodies,
    bodyIDs,
    setDisplayedData,
    zIndexOf,
  ) {
    for(let i = 0; i < bodyIDs.length; i++) {
      let b = bodies[bodyIDs[i]];
      let g = b.g;

      g.interactive = true;
      g.buttonMode = true;
      g.on('pointerdown', (ev) => {
        this.selectedUID = b.robot._uid;
        console.log({
          uid: b.robot._uid,
          state: b.robot.state,
          grad: b.robot.myGradient,
          counter: b.robot.counter,
          isSeed: b.robot.isSeed,
          hesitateData: b.robot.hesitateData,
          shapePos: b.robot.shapePos,
          neighbors: b.robot.neighbors,
          closestRobustNeighbors: b.robot.getFirstRobustQuadrilateral && b.robot.getFirstRobustQuadrilateral(),
          robot: b.robot,
          events: b.robot.events,
        });
        ev.stopPropagation();
      });

      const agentGraphicsTick = (b) => {
        if(false && b.robot.stats) {
          g.endFill();
          if(b.robot.stats.tooClose) {
            g.lineStyle(4, 0xff6666);
          } else {
            g.lineStyle(4, 0x440000);
          }
          switch(b.robot.stats.action) {
            case 'stright':
              g.moveTo(0, 0);
              g.lineTo(this.V.ZOOM * this.RADIUS, 0);
              break;
            case 'left-get-farther':
              g.moveTo(0, 0);
              g.lineTo(0, -this.V.ZOOM * this.RADIUS);
              break;
            case 'right-get-close':
              g.moveTo(0, 0);
              g.lineTo(0, +this.V.ZOOM * this.RADIUS);
              break;
          }
        }
      };
      pixiApp.ticker.add(() => { agentGraphicsTick(b) });
    }


    const DRAW_SHAPE_DESCRIPTION = true;
    if(DRAW_SHAPE_DESCRIPTION) {
      // position vectors
      let g = new PIXI.Graphics()
      g.zIndex = zIndexOf('Shape');
      g.alpha = 0.3;
      g.lastView = null;

      platformGraphics.addChild(g);
      pixiApp.ticker.add(() => {
        if(this.equalZooms(g.lastView, this.V)) return;
        g.lastView = this.copyView(this.V);

        g.clear();
        if(!DRAW_SHAPE_DESCRIPTION) return;

        let highlightJoined = false;

        let shapeMarks = {};
        if(highlightJoined) {
          forEachObj(bodies, b => {
            let p = b.body.GetPosition();
            let i = Math.floor(+(p.get_x() - this.ShapePosOffset.x)/this._ShapeScale);
            let j = Math.floor(-(p.get_y() - this.ShapePosOffset.y)/this._ShapeScale);
            let key = `${this.ShapeDesc.length - 1 - j}:${i}`;
            shapeMarks[key] = (shapeMarks[key] || 0) + 1
          });
        }

        g.lineStyle(0, 0x000000);
        g.beginFill(0x000000, 0.4);

        for(let rowi = 0; rowi < this.ShapeDesc.length; rowi++) {
          let row = this.ShapeDesc[rowi];
          for(let coli = 0; coli < row.length; coli++) {
            if(row[coli] != '#') {
              continue;
            }
            if(highlightJoined) {
              if(shapeMarks[`${rowi}:${coli}`]) {
                g.beginFill(0x008800);
              } else {
                g.beginFill(0x888888);
              }
            }

            let x = this.ShapePosOffset.x + coli*this._ShapeScale;
            let y = this.ShapePosOffset.y - (this.ShapeDesc.length-1 - rowi)*this._ShapeScale;
            g.drawRect(
              +this.V.ZOOM * x,
              +this.V.ZOOM * y - this.V.ZOOM * this._ShapeScale,
              +(this.V.ZOOM * this._ShapeScale - 1),
              +(this.V.ZOOM * this._ShapeScale - 1),
            );
          }
        }
      });
    }

    if(this.drawLocalizationError) {
      // position vectors
      let g = new PIXI.Graphics()
      g.zIndex = zIndexOf('LocalizationError');
      g.alpha = 0.75;
      let color = 0x008400;

      platformGraphics.addChild(g);
      pixiApp.ticker.add(() => {
        g.clear();
        if(!this.drawLocalizationError) return;

        let correctlyLocalizedCount = 0;
        forEachObj(bodies, b => {
          let shapePos = b.robot.shapePos;
          if(!shapePos) return;

          let pos = b.position;
          if(!b.position && b.getData) {
            let data = b.getData();
            pos = data.pos;
          }

          let posActual = {
            x: + pos.x * this.V.ZOOM,
            y: + pos.y * this.V.ZOOM,
          }
          let posEstimated = {
            x: + (this.RootSeedPos.x + shapePos.x) * this.V.ZOOM,
            y: + (this.RootSeedPos.y + shapePos.y) * this.V.ZOOM,
          }
          let dist = calculateDistance(posActual, posEstimated);
          if(dist < this.RADIUS*this.V.ZOOM) correctlyLocalizedCount++;

          if(this.selectedUID && this.selectedUID != b.robot._uid)
            return;

          const MAX = 100000;
          if(posEstimated.x > +MAX) posEstimated.x = +MAX;
          if(posEstimated.x < -MAX) posEstimated.x = -MAX;
          if(posEstimated.y > +MAX) posEstimated.y = +MAX;
          if(posEstimated.y < -MAX) posEstimated.y = -MAX;

          let thickness = this.RADIUS*this.V.ZOOM * 0.2; // 2
          color = 0xff0000;
          g.endFill();
          g.lineStyle(thickness, color);
          g.moveTo(posActual.x, posActual.y);
          g.lineTo(posEstimated.x, posEstimated.y);

          if(false) {
            g.endFill();
            g.lineStyle(1, color);
            g.drawCircle(posEstimated.x, posEstimated.y, this.V.ZOOM * this.RADIUS);

            {
              let crossPoints = [posEstimated, posActual];
              let fullSize = this.V.ZOOM * this.RADIUS * 0.2;
              for(let i = 0, len = crossPoints.length; i < len; i++) {
                let p = crossPoints[i];
                let r = fullSize;
                g.endFill();
                g.lineStyle(thickness, i == 0 ? color : 0x000000, 1);
                g.moveTo(p.x - r, p.y + 0);
                g.lineTo(p.x + r, p.y + 0);
                g.moveTo(p.x + 0,         p.y - r);
                g.lineTo(p.x + 0,         p.y + r);
              };
            }
          }

        })
        setDisplayedData('Well localized', `${correctlyLocalizedCount}/${Object.keys(bodies).length} robots`);
      });
    }

    { // robust quadlateral
      let g = new PIXI.Graphics()
      g.zIndex = zIndexOf('RobustQuadlateral');
      g.alpha = 1;
      platformGraphics.addChild(g);
      pixiApp.ticker.add(() => {
        g.clear();
        if(!this.selectedUID) return;

        let b = bodies[this.selectedUID];
        let quadlateral = b.robot.getFirstRobustQuadrilateral && b.robot.getFirstRobustQuadrilateral();
        if(!quadlateral) {
          return;
        }

        let bodyPositions = quadlateral.map(id => bodies[id].body.GetPosition());

        g.lineStyle(this.V.ZOOM * this.RADIUS/4/4, 0xffffff);
        bodyPositions.forEach(p => {
          g.moveTo(
            + b.body.GetPosition().get_x()*this.V.ZOOM,
            + b.body.GetPosition().get_y()*this.V.ZOOM,
          );
          g.lineTo(
            + p.get_x()*this.V.ZOOM,
            + p.get_y()*this.V.ZOOM,
          );
        });


        g.lineStyle(this.V.ZOOM * this.RADIUS/4, 0xffffff);
        [
          [1, 2],
          [1, 3],
          [1, 4],
          [2, 3],
          [2, 4],
          [3, 4],
        ].forEach(indexes => {
          let p1 = bodyPositions[indexes[0]-1];
          let p2 = bodyPositions[indexes[1]-1];
          g.moveTo(
            + p1.get_x()*this.V.ZOOM,
            + p1.get_y()*this.V.ZOOM,
          );
          g.lineTo(
            + p2.get_x()*this.V.ZOOM,
            + p2.get_y()*this.V.ZOOM,
          );
        });
      });
    }
  }
}

const forEachObj = function(obj, f) {
  let i = 0;
  Object.keys(obj).forEach(k => {
    let item = obj[k];
    f(item, k, i);
    i++;
  });
}

