Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  TOTAL_MEMORY: 1024 * 1024 * 32, // default value is 1024 * 1024 * 16.
}).then(function(Box2D) {
  // let imageEditor = new ImageEditor();
  // setTimeout(() => { console.log(JSON.stringify(imageEditor.convert())); }, 500);
  // return;

  window.box2D = Box2D;
  // create two boxes and a ground
class Pitch {
  constructor(graphical, fastforward) {
    this.destroyFuncs = [];

    this.graphical = graphical;
    this.fastforward = fastforward;
    this.connections = [];
    this.deltaTime = null;
    this.speedX = null;
    this.fps = 60;
    this.displayedData = {};
    this.tickBatchCount = 1;

    if(this.graphical) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: DARK_MODE ? 0x222222 : 0xdddddd,
        autoStart: true,
        width: SIZE.w,
        height: SIZE.h,
        antialias: !false,
      });

      {
        // displayed data meta box:
        const g = new PIXI.Graphics()
        const opts = {
          fontSize: 12,
          lineHeight: 20,
          top: 20,
          bottom: 20,
          left: 20,
        };
        g.zIndex = 4;
        if(DARK_MODE) {
          g.beginFill(0x000000, 0.5);
        } else {
          g.beginFill(0xffffff, 0.5);
        }
        let lineCount = 10
        g.drawRect(
          0, 0,
          SIZE.w*0.5, opts.lineHeight*lineCount + opts.top+opts.bottom,
        );

        this.displayedDataPixiText = new PIXI.Text('FPS', {
          fontSize: opts.fontSize,
          align: 'left',
          lineHeight: opts.lineHeight,
          fill: DARK_MODE ? 0xffffff : 0x000000
        });
        this.displayedDataPixiText.position = {
          x: opts.left,
          y: opts.top,
        }
        g.addChild(this.displayedDataPixiText);
        this.pixiApp.stage.addChild(g);

        this.pixiApp.ticker.add(() => {
          this.setDisplayedData('FPS', `${Math.floor(1/this.deltaTime)}/s`);
        });
      }


      if(DRAW_TRAVERSED_PATH) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.5;
        // g.beginFill(b.robot.led.toHexDark());
        g.endFill();

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_TRAVERSED_PATH) return;
          forEachObj(this.bodies, b => {
            g.lineStyle(2, b.robot.led.toHexDark());

            let lastPos = null;
            b.posHistory.forEach(p => {
              if(lastPos == null) {
                lastPos = p;
                g.moveTo(V.PAN.x + p.x * V.ZOOM, V.PAN.y + p.y * V.ZOOM);
                return;
              }
              // g.drawCircle(V.PAN.x + p.x * V.ZOOM, V.PAN.y + p.y * V.ZOOM, 2);
              g.lineStyle(2, p.color);
              g.moveTo(V.PAN.x + lastPos.x * V.ZOOM, V.PAN.y + lastPos.y * V.ZOOM);
              g.lineTo(V.PAN.x + p.x * V.ZOOM, V.PAN.y + p.y * V.ZOOM);

              {
                g.moveTo(
                  V.PAN.x + p.x * V.ZOOM - Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                  V.PAN.y + p.y * V.ZOOM - Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                );
                g.lineTo(
                  V.PAN.x + p.x * V.ZOOM + Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                  V.PAN.y + p.y * V.ZOOM + Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                );
              }

              g.moveTo(V.PAN.x + p.x * V.ZOOM, V.PAN.y + p.y * V.ZOOM);
              lastPos = p;
            });

            if(lastPos != null) {
              g.lineStyle(2, b.robot.led.toHex());
              g.lineTo(V.PAN.x + b.body.GetPosition().get_x() * V.ZOOM, V.PAN.y + b.body.GetPosition().get_y() * V.ZOOM);
            }
          });
        });
      }

      if(DRAW_SHAPE_DESCRIPTION) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.3;
        g.lastView = null;

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          if(equalViews(g.lastView, V)) return;
          g.lastView = copyView(V);

          g.clear();
          if(!DRAW_SHAPE_DESCRIPTION) return;

          let highlightJoined = false;

          let shapeMarks = {};
          if(highlightJoined) {
            forEachObj(this.bodies, b => {
              // if(b.robot._uid != 1) return;
              let p = b.body.GetPosition();
              let i = Math.floor(+(p.get_x() - ShapePosOffset.x)/_ShapeScale);
              let j = Math.floor(-(p.get_y() - ShapePosOffset.y)/_ShapeScale);
              let key = `${ShapeDesc.length - 1 - j}:${i}`;
              shapeMarks[key] = (shapeMarks[key] || 0) + 1
            });
          }

          g.lineStyle(0, 0x000000);
          g.beginFill(0x888888);

          for(let rowi = 0; rowi < ShapeDesc.length; rowi++) {
            let row = ShapeDesc[rowi];
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

              let x = ShapePosOffset.x + coli*_ShapeScale;
              let y = ShapePosOffset.y - (ShapeDesc.length-1 - rowi)*_ShapeScale;
              g.drawRect(
                V.PAN.x + V.ZOOM * x,
                V.PAN.y + V.ZOOM * y,
                +(V.ZOOM * _ShapeScale - 1),
                -(V.ZOOM * _ShapeScale - 1),
              );
            }
          }
        });
      }

      if(false) { // origin grid
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.5;
        g.lastView = null;

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          if(equalViews(g.lastView, V)) return;
          g.clear();
          g.lineStyle(4, 0x000000);
          g.endFill();

          let s = 10 * _ShapeScale;
          g.moveTo(V.PAN.x - s * V.ZOOM, V.PAN.y + 0 * V.ZOOM);
          g.lineTo(V.PAN.x + s * V.ZOOM, V.PAN.y + 0 * V.ZOOM)

          g.moveTo(V.PAN.x + 0 * V.ZOOM, V.PAN.y - s * V.ZOOM);
          g.lineTo(V.PAN.x + 0 * V.ZOOM, V.PAN.y + s * V.ZOOM);
        });
      }


      if(DRAW_SHADOW) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.25;

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_SHADOW) return;

          forEachObj(this.bodies, b => {

            let shadowOffset = {
              x: V.PAN.x + (b.body.GetPosition().get_x() + b.circleRadius*0.25) * V.ZOOM,
              y: V.PAN.y + (b.body.GetPosition().get_y() + b.circleRadius*0.25) * V.ZOOM,
            }

            g.beginFill(0x000000)
            g.drawCircle(shadowOffset.x, shadowOffset.y, b.circleRadius * V.ZOOM);
          });
        });
      }

      if(DRAW_LOCALIZATION_ERROR) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 2;
        g.alpha = 0.75; // 0.25;
        let color = 0x008400; // 0xff0000

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_LOCALIZATION_ERROR) return;

          // let errorMagnitude = 0;
          let correctlyLocalizedCount = 0;
          forEachObj(this.bodies, b => {
            if(this.selectedUID && this.selectedUID != b.robot._uid)
              return;

            let shapePos = b.robot.shapePos;
            if(!shapePos) return;

            let pos = b.position;
            if(!b.position && b.getData) {
              let data = b.getData();
              pos = data.pos;
            }

            let thickness = RADIUS*V.ZOOM * 0.2; // 2
            let posActual = {
              x: V.PAN.x + pos.x * V.ZOOM,
              y: V.PAN.y + pos.y * V.ZOOM,
            }
            let posEstimated = {
              x: V.PAN.x + (RootSeedPos.x + shapePos.x) * V.ZOOM,
              y: V.PAN.y + (RootSeedPos.y + shapePos.y) * V.ZOOM,
            }
            let dist = calcDist(posActual, posEstimated);
            // errorMagnitude += dist
            if(dist < RADIUS*V.ZOOM) correctlyLocalizedCount++;

            const MAX = 100000;
            if(posEstimated.x > +MAX) posEstimated.x = +MAX;
            if(posEstimated.x < -MAX) posEstimated.x = -MAX;
            if(posEstimated.y > +MAX) posEstimated.y = +MAX;
            if(posEstimated.y < -MAX) posEstimated.y = -MAX;

            g.endFill();
            color = 0xff0000; // b.robot.led.toHexDark();
            g.lineStyle(thickness, color);
            g.moveTo(posActual.x, posActual.y);
            g.lineTo(posEstimated.x, posEstimated.y);

            // for perfect cases:
            /*
            if(calcDist(posActual, posEstimated) < thickness) {
              g.lineStyle(0);
              g.beginFill(color);
              g.drawCircle(posActual.x, posActual.y, thickness/2);
              g.drawCircle(posEstimated.x, posEstimated.y, thickness/2);
            }
            */

            if(false) {
              g.endFill();
              g.lineStyle(1, color);
              g.drawCircle(posEstimated.x, posEstimated.y, V.ZOOM * RADIUS);

              {
                let crossPoints = [posEstimated, posActual];
                let fullSize = V.ZOOM * RADIUS * 0.2;
                for(let i = 0, len = crossPoints.length; i < len; i++) {
                  let p = crossPoints[i];
                  let r = fullSize; // * ((i+1)/len);
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
          // let errMag = errorMagnitude/Object.keys(this.bodies).length/RADIUS;
          // this.setDisplayedData('Avg localization err', `${Math.round(errMag * 10)/10} radius`);
          this.setDisplayedData('Well localized', `${correctlyLocalizedCount}/${Object.keys(this.bodies).length} robots`);
        });
      }

      {
        let g = new PIXI.Graphics()
        g.zIndex = 3;
        g.alpha = 0.5;
        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!this.selectedUID) return;

          let b = this.bodies[this.selectedUID];
          let quadlateral = b.robot.getFirstRobustQuadrilateral();
          if(!quadlateral) {
            return;
          }

          let bodyPositions = quadlateral.map(id => this.bodies[id].body.GetPosition());
          g.lineStyle(V.ZOOM * RADIUS/4, 0xffffff);

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
              V.PAN.x + p1.get_x()*V.ZOOM,
              V.PAN.y + p1.get_y()*V.ZOOM,
            );
            g.lineTo(
              V.PAN.x + p2.get_x()*V.ZOOM,
              V.PAN.y + p2.get_y()*V.ZOOM,
            );
          });
        });
      }

      {
        if(DRAW_CONNS_AND_BOUNDS) {
          let connGraphics = new PIXI.Graphics()
          connGraphics.zIndex = 2;
          connGraphics.alpha = 0.5;
          this.pixiApp.stage.addChild(connGraphics);
          this.pixiApp.ticker.add(() => {
            connGraphics.clear();
            if(!DRAW_CONNS_AND_BOUNDS) return;

            let bounds = [];
            for(let i = 0; i < this.bodyIDs.length; i++) {
              if(this.selectedUID != null && this.selectedUID != this.bodyIDs[i]) {
                continue;
              }
							let body = this.bodies[this.bodyIDs[i]].body;
							let f = body.GetFixtureList();
							let fp = Box2D.getPointer(f);
							let j = 0;
							while(fp) {
							  j++;
								bounds.push({
									aabb: f.GetAABB(),
									color: j%2==0 ? 0x00ff00 : 0x0000ff,
								});
								f = f.GetNext();
								fp = Box2D.getPointer(f);
							}
            }

            bounds.forEach(bound => {
              connGraphics.lineStyle(2, bound.color || 0x00ff00);

              connGraphics.drawRect(
                V.PAN.x + V.ZOOM * (bound.aabb.get_lowerBound().get_x()),
                V.PAN.y + V.ZOOM * (bound.aabb.get_lowerBound().get_y()),
                V.ZOOM * (bound.aabb.get_upperBound().get_x() - bound.aabb.get_lowerBound().get_x()),
                V.ZOOM * (bound.aabb.get_upperBound().get_y() - bound.aabb.get_lowerBound().get_y()),
              );
            });

            this.connections.forEach(conn => {
              if(this.selectedUID != null && (this.selectedUID != conn.from /*&& this.selectedUID != conn.to*/)) {
                return;
              }
              let pos1 = this.bodies[conn.from].body.GetPosition();
              let pos2 = this.bodies[conn.to].body.GetPosition();
              connGraphics.lineStyle(V.ZOOM * RADIUS/4, this.bodies[conn.from].robot.led.toHex());
              connGraphics.moveTo(V.PAN.x + pos1.get_x() * V.ZOOM, V.PAN.y + pos1.get_y() * V.ZOOM);
              connGraphics.lineTo(V.PAN.x + pos2.get_x() * V.ZOOM, V.PAN.y + pos2.get_y() * V.ZOOM);
            });

          });
        }
      }

      this.pixiApp.stage.sortableChildren = true;

      document.body.appendChild(this.pixiApp.view);
      this.pixiApp.view.addEventListener('mousewheel', ev => {
        V.ZOOM *= 1 + ev.wheelDelta/1000.0;
        if(V.ZOOM < 6) V.ZOOM = 6;
        if(V.ZOOM > 40) V.ZOOM = 40;
        // TODO: this._graphics_must_update = true;
      });

      this.pixiApp.view.addEventListener('pointerdown', ev => {
        this.dragStart = {
          x: ev.x,
          y: ev.y,
          panX: V.PAN.x,
          panY: V.PAN.y,
        }
      });

      this.pixiApp.view.addEventListener('pointerup', ev => {
        this.dragStart = null
      });

      this.pixiApp.view.addEventListener('pointermove', ev => {
        if(!this.dragStart) return;
        V.PAN.x = this.dragStart.panX + (ev.x - this.dragStart.x);
        V.PAN.y = this.dragStart.panY + (ev.y - this.dragStart.y);
      });

      // update at least once:
      this.destroyFuncs.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyFuncs.push(() => this.pixiApp.destroy());
    }

    // this.physics = new MatterPhysics();
    this.physics = new Box2DPhysics();
    this.destroyFuncs.push(() => this.physics.destroy());
  }

  setDisplayedData(key, value) {
    if(this.displayedData[key] == value) {
      return;
    }
    this.displayedData[key] = value;
    let newText = ``;

    let keys = Object.keys(this.displayedData).sort().forEach(key => {
      newText += `${key}: ${this.displayedData[key]}`
      newText += '\n';
    });

    this.displayedDataPixiText.text = newText;
  }

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  run(botProg) {
		this.bodies = {};
    let uidCounter = 0;

    const shapePosToPhysPos = (shapePos) => {
      return {
        x: RootSeedPos.x + shapePos.x,
        y: RootSeedPos.y + shapePos.y,
      };
    }

    const isInsideShape = (pos) => {
      if(pos == null)
        return false;

      let i = Math.floor(+(pos.x-ShapePosOffset.x)/_ShapeScale);
      let j = Math.floor(-(pos.y-ShapePosOffset.y)/_ShapeScale);
      j = ShapeDesc.length - 1 - j;

      return ShapeDesc[j] && ShapeDesc[j][i] == '#';
    }

    let extraCount = 0;
    [
      {isSeed: true, isRoot: true,  x: 0*RADIUS, y: RADIUS * 0},
      {isSeed: true, isRoot: false, x: 2*RADIUS, y: RADIUS * 0},
      {isSeed: true, isRoot: false, x: 1*RADIUS, y: RADIUS * +Math.sqrt(3)},
      {isSeed: true, isRoot: false, x: 1*RADIUS, y: RADIUS * -Math.sqrt(3)},
      // {isSeed: false,isRoot: false, x: 1*RADIUS, y: RADIUS * -Math.sqrt(3) - 1*INITIAL_DIST},
      // {isSeed: false,isRoot: false, x: 1*RADIUS, y: RADIUS * -Math.sqrt(3) - 2*INITIAL_DIST},
    ].forEach(shapePos => {
      uidCounter++;

      if(!PERFECT) {
        // shapePos.x += noise(0.1 * RADIUS);
        // shapePos.y += noise(0.1 * RADIUS);
      }

      let b = this.physics.circle(shapePosToPhysPos(shapePos), /*Math.random() * 2*Math.PI*/ Math.PI/2, RADIUS, uidCounter);
      b.robot = new GradientAndAssemblyRobot({
        isInsideShape: isInsideShape,
        shapePos: shapePos.isSeed ? {x: shapePos.x, y: shapePos.y} : null,
        isGradientSeed: shapePos.isSeed && shapePos.isRoot,
        isSeed: shapePos.isSeed,
      });

      b.robot._uid = uidCounter;
      b.robot._phys = b.body;
      b.robot._Box2D = Box2D;

      this.bodies[b.robot._uid] = b;

      this.createBodyGraphic(b);
    });

    let grid = {};
    let gridCursor = {
      x: 0,
      y: -1,
    };
    // Constraints while choosing one of the 6 neighbors:
    // - y > 0
    // - dist to shape > 3 * RADIUS
    // - dist to seeds > 3 * RADIUS
    // - always choose the closest

    let assemblyCount = COUNT - Object.keys(this.bodies).length;
    let gridPosToPhysPos = (gridPos) => {
      let pos = {
        x: (RootSeedPos.x + RADIUS),
        y: (RootSeedPos.y + Math.sqrt(3) * RADIUS + 2*RADIUS),
      };

      pos.x += gridPos.x * INITIAL_DIST + (gridPos.y%2==0 ? -INITIAL_DIST/2 : 0);
      pos.y += gridPos.y * INITIAL_DIST * Math.sqrt(3)/2;
      return pos;
    }

    for(let i = 0; i < assemblyCount; i++) {

      let best = [
                    [0,-1],    [+1,-1],
        [-1, 0],    /*cursor*/ [+1, 0],
                    [0,+1],    [+1,+1],
      ].map(adjacentPoint => {
        let check = {
          x: gridCursor.x + adjacentPoint[0],
          y: gridCursor.y + adjacentPoint[1],
        }

        if(grid[`${check.x}:${check.y}`])
          return null;

        if(check.y < 0) return null;

        /*
        if(check.x >= -10 && check.x <= 10 && check.y >= 0) {
        } else {
          for(let rowi = 0; rowi < ShapeDesc.length; rowi++) {
            let row = ShapeDesc[rowi];
            for(let coli = 0; coli < row.length; coli++) {
              if(row[coli] != '#')
                continue;
              let p = {
                x: ShapePosOffset.x + coli*_ShapeScale,
                y: ShapePosOffset.y - (ShapeDesc.length-1 - rowi)*_ShapeScale,
              }
              if(calcDist(gridPosToPhysPos(check), p) < 4*INITIAL_DIST) {
                return null;
              }
            }
          }
        }
        */


        let distToOrigin = calcDist(gridPosToPhysPos(check), gridPosToPhysPos({x: 0, y: 0}));

        // if(i > 2)
        // if(distToOrigin < 2*INITIAL_DIST) return null;

        return {
          x: check.x,
          y: check.y,
          dist: distToOrigin,
        };
      }).filter(x => x != null).sort((a, b) => a.dist - b.dist)[0];

      if(best == null) {
        console.error("'best' should not be null");
        return;
      }

      grid[`${best.x}:${best.y}`] = true;

      let pos = gridPosToPhysPos(best);

      gridCursor.x = best.x;
      gridCursor.y = best.y;

      uidCounter++;
      /*
      uidCounter++;
      let rowi = Math.floor(i/PER_ROW);
      let coli = i % PER_ROW;

      let pos = {
        x: RootSeedPos.x + RADIUS,
        y: RootSeedPos.y + Math.sqrt(3) * RADIUS + 2*RADIUS + extraCount*INITIAL_DIST,
      };

      if(PER_ROW % 2 == 0) {
        pos.y = RootSeedPos.y + Math.sqrt(3) * RADIUS + Math.sqrt(3)*INITIAL_DIST/2 + extraCount*INITIAL_DIST;
      } 
      let firstToLastCentersInOneRow = (PER_ROW-1)*INITIAL_DIST;
      pos.x += coli * INITIAL_DIST - firstToLastCentersInOneRow/2 + (INITIAL_DIST/2)*(rowi%2);
      pos.y += rowi * (INITIAL_DIST/2*Math.sqrt(3));
      */

      if(!PERFECT) {
        pos.x += noise(0.1 * RADIUS);
        pos.y += noise(0.1 * RADIUS);
      }

      let b = this.physics.circle(pos, /*Math.random() * 2*Math.PI*/ Math.PI/2, RADIUS, uidCounter);
      b.robot = new GradientAndAssemblyRobot({
        isInsideShape: isInsideShape,
        shapePos: null,
        isSeed: false,
      });

      b.robot._uid = uidCounter;
      b.robot._phys = b.body;
      b.robot._Box2D = Box2D;

      this.bodies[b.robot._uid] = b;

      this.createBodyGraphic(b);
    }

    window.bodies = this.bodies;

    {
      let ids = Object.keys(this.bodies)
      let idsBuf = new ArrayBuffer(ids.length * Int32Array.BYTES_PER_ELEMENT);
      this.bodyIDs = new Int32Array(idsBuf);
      for(let i = 0; i < ids.length; i++) {
        this.bodyIDs[i] = ids[i];
      }
    }

    {
      let isStartedBuf = new ArrayBuffer(this.bodyIDs.length * Int8Array.BYTES_PER_ELEMENT);
      this.bodyRobotIsStarted = new Int8Array(isStartedBuf);
      for(let i = 0; i < this.bodyRobotIsStarted.length; i++) {
        this.bodyRobotIsStarted[i] = 0;
      }
    }

    {/*
      this.robots = [];
      for(let i = 0; i < this.bodyIDs.length; i++) {
        let id = this.bodyIDs[i];
        this.robots.push(this.bodies[id].robot);
      }
      */
    }

    // if(PERFECT) {
      forEachObj(this.bodies, b => {
        b.robot.setup();
        b.robot._started = true;
      });
    // }

    this.setDisplayedData('Count', `${COUNT}`);

    {
      /*
      let listener = new Box2D.JSContactListener();
      listener.PreSolve = function(contact) { }
      listener.PostSolve = function(contact) { }
      listener.EndContact = function(contact) { }

      listener.BeginContact = (contactPtr) => {
        let contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
        let fixtureA = contact.GetFixtureA();
        let fixtureB = contact.GetFixtureB();

        if(!fixtureA.IsSensor() && !fixtureB.IsSensor()) {
          return;
        }

        if(fixtureA.IsSensor() && fixtureB.IsSensor()) {
          console.error("should not happen");
          return;
        }

        let idB = fixtureB.GetBody().GetUserData();
        let idA = fixtureA.GetBody().GetUserData();
        if(idA == idB) {
          console.error("equal ids", idA, idB);
        }

        if(fixtureA.IsSensor()) {
          this.sensorContactCounter++;
          // console.log(`BeginContact sensor=${idA} other=${idB}`);
        }

        if(fixtureB.IsSensor()) {
          this.sensorContactCounter++;
          // console.log(`BeginContact sensor=${idB} other=${idA}`);
        }
        return;
      }
      this.physics.world.SetContactListener(listener);
      */
    }



    return new Promise((resolve, reject) => {
      const tickFunc = (frameCount, recursive) => {

        if(frameCount == FRAME_LIMIT || window._state_stop) {
          resolve();
          return;
        }

        // this.setDisplayedData('sensorContactCounter', `${this.sensorContactCounter}`);
        // this.sensorContactCounter = 0;

        {
          let virtualSeconds = Math.floor(frameCount/LOOP_PER_SECOND);
          let ourSeconds = (new Date() - this.startDate)/1000;
          let s = this.tickBatchCount * (this.fps/LOOP_PER_SECOND);
          if(this.speedX == null) {
            this.speedX = s;
          } else {
            this.speedX += (s - this.speedX) * (1/120.0);
          }
          this.setDisplayedData('Duration (robot)', `${formatSeconds(virtualSeconds, true)} (${Math.floor(this.speedX*10)/10}x)`);
          this.setDisplayedData('Duration (render)', `${formatSeconds(ourSeconds, true)}`);
        }

        this.physics.update();

        if(DRAW_TRAVERSED_PATH && frameCount % 30 == 0) {
          let max = 100;
          forEachObj(this.bodies, b => {
            let pos = b.body.GetPosition();
            let lastPos = b.posHistory[b.posHistory.length-1];
            let newPos = {
              x: pos.get_x(),
              y: pos.get_y(),
              angle: b.body.GetAngle(),
            };
            if(lastPos
              && newPos.x == lastPos.x
              && newPos.y == lastPos.y
              && newPos.angle) {
              return;
            }

            newPos.color = b.robot.led.toHex();
            b.posHistory.push(newPos);
            if(b.posHistory.length > max) {
              b.posHistory = b.posHistory.slice(b.posHistory.length-max, b.posHistory.length);
            }
          });
        }

          /*
          // testing how fast I can get all positions
        let poses = [];
        for(let i = 0; i < this.bodyIDs.length; i++) {
          let body = this.bodies[this.bodyIDs[i]].body;
          let pos = body.GetPosition();
          poses.push({x: pos.get_x(), y: pos.get_y()});
        }
        */

        // ******
        if(true)
        for(let i = 0; i < this.bodyIDs.length; i++) {
          let r = this.bodies[this.bodyIDs[i]].robot;
          // let r = this.robots[i];
          if(r._started) {
            r.loop();
            r._internal_loop();
            continue;
          }

          if(Math.random() < 0.1) {
            // r.setup();
            r._started = true;
          }

          /*
          if(this.bodyRobotIsStarted[i] == 1) {
            r.loop();
            r._internal_loop();
            continue;
          }

          if(Math.random() < 0.1) {
            r.setup();
            this.bodyRobotIsStarted[i] = 1;
          }
          */
        }
        // ******

        this.connections = [];
        let messageTxCount = 0;
        let messageRxCount = 0;

        const sendMessage = (broadcastingBody, receiverID, message) => {
          if(receiverID == broadcastingBody.body.GetUserData()) {
            // same body
            return;
          }

          let receiverBody = this.bodies[receiverID];
          if(!receiverBody) {
            console.error(`body id not found id=${receiverID}`);
            return;
          }
          if(!receiverBody.robot._started) {
            return;
          }

          let p1 = broadcastingBody.body.GetPosition();
          let p2 = receiverBody.body.GetPosition();
          let distance = calcDistBox2D(p1, p2);

          if(distance > NEIGHBOUR_DISTANCE) {
            return;
          }

          messageRxCount++;
          receiverBody.robot.kilo_message_rx(message, distance);

          if(DRAW_CONNS_AND_BOUNDS) {
            this.connections.push({
              from: broadcastingBody.body.GetUserData(),
              to: receiverBody.body.GetUserData(),
            });
          }
        };

        let queryCallback = new Box2D.JSQueryCallback();
        queryCallback.ReportFixture = function(fixturePtr) {
          let fixture = Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
          let id = fixture.GetBody().GetUserData();
          if(id == BODY_ID_IGNORE) {
            return ContinueQuery;
          }
          sendMessage(this.broadcastingBody, id, this.message);
          return ContinueQuery;
        }

        {
          /*
          if(frameCount % 2 == 0) {
            for(let i = 0; i < this.bodyIDs.length; i++) {
              let body = this.bodies[this.bodyIDs[i]].body;
              let f = body.GetFixtureList();
              let fp = Box2D.getPointer(f);
              while(fp) {
                if(f.IsSensor()) {
                  let fd = f.GetFilterData();
                  fd.set_maskBits(CATS.NONE)
                  f.SetFilterData(fd);
                  break;
                }
                f = f.GetNext();
                fp = Box2D.getPointer(f);
              }
            }
          }
          */

          /*
          if(frameCount % 1 == 0) {
            for(let i = 0; i < this.bodyIDs.length; i++) {
              let body = this.bodies[this.bodyIDs[i]].body;
              let f = body.GetFixtureList();
              let fp = Box2D.getPointer(f);
              while(fp) {
                if(f.IsSensor()) {
                  body.DestroyFixture(f);
                  break;
                }
                f = f.GetNext();
                fp = Box2D.getPointer(f);
              }
            }
          }
          */
        }


        // ---
        let aabb = new Box2D.b2AABB();
        let lowerBound = new Box2D.b2Vec2(0, 0);
        let upperBound = new Box2D.b2Vec2(0, 0);

        if(true) // 88 -> 68
        for(let i = 0; i < this.bodyIDs.length; i++) {
          let b = this.bodies[this.bodyIDs[i]];
          if(frameCount < b.lastMessageSentAt + TICKS_BETWEEN_MSGS) {
            continue;
          }
          // if(frameCount > 60 * 5) { continue; }

          b.lastMessageSentAt = frameCount;

          let broadcastingBody = b;

          if(!broadcastingBody) {
            console.error("deleted robot fetched");
            continue;
          }

          if(!broadcastingBody.robot._started) {
            continue;
          }

          messageTxCount++;
          let message = broadcastingBody.robot.kilo_message_tx();
          if(message == null) {
            continue;
          }

          {
            /*
          let f = broadcastingBody.body.GetFixtureList();
          let fp = Box2D.getPointer(f);
          let j = 0;
          while(fp) {
            j++;
            if(f.IsSensor()) {
              let fd = f.GetFilterData();
              fd.set_maskBits(CATS.ROBOT)
              f.SetFilterData(fd);
              break;
            }
            f = f.GetNext();
            fp = Box2D.getPointer(f);
          }
          */
            /*
            if(!this.filter2) {
              console.log("should be called ONCE");
            this.filter2 = new Box2D.b2Filter();
            this.filter2.set_categoryBits(CATS.NEIGHBOR);
            this.filter2.set_maskBits(CATS.ROBOT);
            this.sensorCircleShape = new Box2D.b2CircleShape();
            this.sensorCircleShape.set_m_radius(NEIGHBOUR_DISTANCE);
            this.fixtureSensor = new Box2D.b2FixtureDef();
            this.fixtureSensor.set_shape(this.sensorCircleShape);
            this.fixtureSensor.set_isSensor(true);
            this.fixtureSensor.set_filter(this.filter2);
            }
            broadcastingBody.body.CreateFixture(this.fixtureSensor);
            // Box2D.destroy(filter2);
            // Box2D.destroy(sensorCircleShape);
            */
          }

          {
            let pos_x = broadcastingBody.body.GetPosition().get_x();
            let pos_y = broadcastingBody.body.GetPosition().get_y();

            lowerBound.set_x(pos_x-NEIGHBOUR_DISTANCE);
            lowerBound.set_y(pos_y-NEIGHBOUR_DISTANCE);

            upperBound.set_x(pos_x+NEIGHBOUR_DISTANCE);
            upperBound.set_y(pos_y+NEIGHBOUR_DISTANCE);

            aabb.set_lowerBound(lowerBound);
            aabb.set_upperBound(upperBound);

            queryCallback.message = message;
            queryCallback.broadcastingBody = broadcastingBody;
            this.physics.world.QueryAABB(queryCallback, aabb);
          }
        }

        this.setDisplayedData('message_tx()', messageTxCount);
        this.setDisplayedData('message_tx()/robot', Math.round(messageTxCount/COUNT * 100)/100);
        this.setDisplayedData('message_rx()', messageRxCount);
        this.setDisplayedData('message_rx()/robot', Math.round(messageRxCount/COUNT * 100)/100);

        Box2D.destroy(lowerBound);
        Box2D.destroy(upperBound);
        Box2D.destroy(aabb);
        Box2D.destroy(queryCallback);

        if(!recursive) {
          return;
        }

        // ******
        if(this.fastforward) {
          // setTimeout(() => tickFunc(frameCount+1), 1);
          tickFunc(frameCount+1, true);
        } else {
          let time0 = new Date();
          if(false) {
            tickFunc(++frameCount, false);

            setTimeout(() => {
              tickFunc(++frameCount, true);
              let dt = (new Date() - time0)/1000;
              // this.metaFPS = Math.floor(1.0/dt);
              if(this.deltaTime == null) {
                this.deltaTime = dt;
              } else {
                this.deltaTime += (dt - this.deltaTime) * 0.2;
              }
            }, 1);
          } else {
            window.requestAnimationFrame(() => {
              for(let i = 0; i < this.tickBatchCount - 1; i++) {
                tickFunc(++frameCount, false);
              }
              tickFunc(++frameCount, true);
              let dt = (new Date() - time0)/1000;
              // this.metaFPS = Math.floor(1.0/dt);
              if(this.deltaTime == null) {
                this.deltaTime = dt;
              } else {
                this.deltaTime += (dt - this.deltaTime) * 0.2;
              }

              if(this.deltaTime == 0 /* prevent divide by zero */ ) {
                this.fps = 60;
              } else {
                this.fps = 1/this.deltaTime;
              }

              if(this.fps > 55) {
                this.tickBatchCount += 0.2;
              } else {
                this.tickBatchCount -= 1;
              }
              if(this.tickBatchCount < 1) {
                this.tickBatchCount = 1;
              }
              this.setDisplayedData('Tick batch', Math.round(this.tickBatchCount));

              // if(BENCHMARKING) {
              //   console.log(`FPS: ${Math.floor(1/this.deltaTime)}/s`);
              // }
            });
          }
        }
      }

      this.startDate = new Date();
      tickFunc(0, true);
    });
  }

  createBodyGraphic(b) {
    // if(BENCHMARKING) return;
    if(!this.graphical) {
      return;
    }
    switch(b.label) {
      case "Circle Body":
        const g = new PIXI.Graphics();
        g.lastView = null;

        // SIMPLIFIED GRAPHICS
        if(false && BENCHMARKING) {
          const agentGraphicsTick = (b) => {
            let pos = b.position;
            let angle = 0;
            if(!b.position && b.getData) {
              let data = b.getData();
              pos = data.pos;
              angle = data.angle;
            }
            g.x = V.PAN.x + pos.x * V.ZOOM;
            g.y = V.PAN.y + pos.y * V.ZOOM;
            g.angle = angle;
            g.zIndex = 1;

            if(!b.robot._graphics_must_update) {
              return;
            } else {
              b.robot._updated_graphics();
            }

            g.clear();
            g.removeChildren();


            g.lineStyle(0);
            if(b.robot.state == States.JoinedShape) {
              g.beginFill(b.robot.led.toHex(), 1.0);
            } else {
              g.beginFill(b.robot.led.toHex(), 0.5);
            }
            g.drawCircle(0, 0, b.circleRadius * V.ZOOM);

            g.lineStyle(b.circleRadius*V.ZOOM/2.0, 1.0);
            g.moveTo(0, 0);
            g.lineTo(b.circleRadius*V.ZOOM, 0);
          }


          this.pixiApp.ticker.add(() => { agentGraphicsTick(b) });
          this.pixiApp.stage.addChild(g);
          return;
        }

        g.interactive = true;
        g.buttonMode = true;
        g.on('pointerdown', () => {
          this.selectedUID = b.robot._uid;
          console.log('clicked', {
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
          return true;
        });

        const agentGraphicsTick = (b) => {
          let pos = b.position;
          let angle = 0;
          if(!b.position && b.getData) {
            let data = b.getData();
            pos = data.pos;
            angle = data.angle;
          }
          g.x = V.PAN.x + pos.x * V.ZOOM;
          g.y = V.PAN.y + pos.y * V.ZOOM;
          g.angle = angle;
          g.zIndex = 1;

          if(equalViews(g.lastView, V)) {
            if(!b.robot._graphics_must_update) {
              return;
            } else {
              b.robot._updated_graphics();
            }
          }

          g.lastView = copyView(V);

          g.clear();
          g.removeChildren();

          let thickness = 0;

          if(false && b.robot._uid == 504) {
            g.lineStyle(1, 0x000000);
            g.beginFill(0x000000, 0.1);
            g.drawCircle(0, 0, NEIGHBOUR_DISTANCE * V.ZOOM);
          }

          if(DARK_MODE) {
            g.beginFill(0x000000);
          } else {
            thickness = 1;
            g.beginFill(0xffffff);
          }

          g.lineStyle(thickness, 0x000000);
          g.drawCircle(0, 0, b.circleRadius * V.ZOOM - thickness/2);

          let ledRadius = b.circleRadius * 0.4;

          g.lineStyle(0);
          if(b.robot.state == States.JoinedShape) {
            g.beginFill(b.robot.led.toHex(), 0.9);
          } else {
            g.beginFill(b.robot.led.toHex(), 0.2);
          }
          g.drawCircle(0, 0, b.circleRadius * V.ZOOM - thickness/2);

          /*
          if(b.robot.led.toHex() != 0x000000) {
            g.filters = [
              new PIXI.filters.GlowFilter(2, 2, 1, b.robot.led.toHex(), 0.5),
            ];
          } else {
            g.filters = [];
          }
          */
          g.endFill();
          g.lineStyle(b.circleRadius*V.ZOOM*0.25, b.robot.led.toHex(), 0.75);
          g.moveTo(0, 0);
          g.lineTo(b.circleRadius*V.ZOOM, 0);

          g.lineStyle(thickness);
          g.beginFill(b.robot.led.toHex());
          g.drawCircle(
            0,
            0,
            ledRadius * V.ZOOM,
          );

          if(b.robot._mark) {
            g.endFill();
            g.lineStyle(2, 0x000000);
            g.drawCircle(
              0,
              0,
              ledRadius * V.ZOOM * 0.5,
            );
          }

          if(false) {
            const t = new PIXI.Text(`${b.robot.counter || '0'}`, {fontSize: 9, align: 'center', fill: 0xf0f0f0});
            t.anchor.set(0.5);
            t.position = {
              x: 0,
              y: 0,
            }
            g.addChild(t);
          }

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
                g.lineTo(V.ZOOM * RADIUS, 0);
                break;
              case 'left-get-farther':
                g.moveTo(0, 0);
                g.lineTo(0, -V.ZOOM * RADIUS);
                break;
              case 'right-get-close':
                g.moveTo(0, 0);
                g.lineTo(0, +V.ZOOM * RADIUS);
                break;
            }
          }

          /*
        const t = new PIXI.Text(`id:${b.id}`, {fontSize: 9, align: 'center'});
        t.anchor.set(0.5);
        t.position = {
          x: 0,
          y: 0,
        }
        g.addChild(t);
        */

          /*
        if(b.agentTargetPos) {
          g.moveTo(0, 0);
          g.lineTo(b.agentTargetPos.x - b.position.x, b.agentTargetPos.y - b.position.y);
          const t = new PIXI.Text(Math.round(calcDist(b.position, b.agentTargetPos)), {fontSize: 13});
          t.position = {
            x: -10,
            y: 10,
          }
          g.addChild(t);
        }
        */
        };
        this.pixiApp.ticker.add(() => {
          if(!agentGraphicsTick) {
            return;
          }
          agentGraphicsTick(b);
        });
        this.pixiApp.stage.addChild(g);
        break;
    }
  }
}

class Box2DPhysics {
	constructor() {
		this.currentFrame = 0;
		this.destroyFuncs = [];

		// Box2D-interfacing code
		let gravity = new Box2D.b2Vec2(0, 0);
		this.world = new Box2D.b2World(gravity);
    window.world = this.world;

    if(false /* edge/wall */) {
      this.edgeShape({x: 0, y: 0}, {x: SIZE.w, y: 0});
      this.edgeShape({x: 0, y: 0}, {x: 0,      y: SIZE.h});

      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: 0, y: SIZE.h});
      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: SIZE.w, y: 0});
    }


	}

	edgeShape(from, to) {
		let bd_ground = new Box2D.b2BodyDef();
		bd_ground.set_type(Box2D.b2_staticBody);
		let ground = this.world.CreateBody(bd_ground);
    ground.SetUserData(BODY_ID_IGNORE);
		let shape0 = new Box2D.b2EdgeShape();
		shape0.Set(new Box2D.b2Vec2(from.x, from.y), new Box2D.b2Vec2(to.x, to.y));
		ground.CreateFixture(shape0, 0.0);
	}

/*
	staticBox() {
		let b2bodyDef = new Box2D.b2BodyDef();
		b2bodyDef.set_type(Box2D.b2_staticBody);
		b2bodyDef.set_position(new Box2D.b2Vec2(cx, cy));
		console.log("setting position to", cx, cy);

		let shape = new Box2D.b2PolygonShape();
		shape.SetAsBox(w * 0.5, h * 0.5);

    let body = this.world.CreateBody(b2bodyDef);
    body.CreateFixture(shape, 0.0);
	}
*/

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  update() {
    // if(!BENCHMARKING) {
    this.world.Step(1.0/60.0, 8, 3); // 8, 2
    // }
    this.currentFrame++;
  }

	circle(pos, angle, radius, id) {
		let b2bodyDef = new Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(20.0);
		b2bodyDef.set_angularDamping(20.0);
    // if(BENCHMARKING) {
    //   b2bodyDef.set_type(Box2D.b2_staticBody);
    // } else {
    if(id == 1 || id == 2 || id == 3 || id == 4) {
      b2bodyDef.set_type(Box2D.b2_staticBody);
    } else {
      b2bodyDef.set_type(Box2D.b2_dynamicBody);
    }
    //   b2bodyDef.set_type(Box2D.b2_staticBody);
    // }

    let posVec = new Box2D.b2Vec2(pos.x, pos.y);
		b2bodyDef.set_position(posVec);
    Box2D.destroy(posVec);

    b2bodyDef.set_bullet(false);

    let filter1 = new Box2D.b2Filter();
    filter1.set_categoryBits(CATS.ROBOT);
    filter1.set_maskBits(CATS.ROBOT | CATS.NEIGHBOR);

    if(!this.circleShape) {
      this.circleShape = new Box2D.b2CircleShape();
      this.circleShape.set_m_radius(radius);
    }

		let fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(1.0);
		fixtureDef.set_friction(10);
		fixtureDef.set_restitution(0.0);
		fixtureDef.set_shape(this.circleShape);
    fixtureDef.set_filter(filter1);
    Box2D.destroy(filter1);
    // Box2D.destroy(this.circleShape);

		let body = this.world.CreateBody(b2bodyDef);
    body.CreateFixture(fixtureDef);
    // ---
    /*
    let filter2 = new Box2D.b2Filter();
    filter2.set_categoryBits(CATS.NEIGHBOR);
    filter2.set_maskBits(CATS.NONE);
    let sensorCircleShape = new Box2D.b2CircleShape();
    sensorCircleShape.set_m_radius(NEIGHBOUR_DISTANCE);
    let fixtureSensor = new Box2D.b2FixtureDef();
    fixtureSensor.set_shape(sensorCircleShape);
    fixtureSensor.set_isSensor(true);
    fixtureSensor.set_filter(filter2);
    body.CreateFixture(fixtureSensor);
    Box2D.destroy(filter2);
    Box2D.destroy(sensorCircleShape);
    */
		// ---

    body.SetUserData(id);

    body.SetTransform(
      body.GetPosition(),
      180 * angle / Math.PI,
    );

    if(!PERFECT) {
      // body.ApplyTorque(noise(Math.PI/2));
      body.SetTransform(
        body.GetPosition(),
        body.GetAngle() + noise(20),
      );
    }

    return new Body(body, radius)
	}
}

class Body {
  constructor(body, radius) {
    this.body = body;
    this.label = 'Circle Body';
    this.circleRadius = radius;
    this.posHistory = [];
    this.lastMessageSentAt = Math.floor(Math.random() * 60);
  }

  getData () {
    let bpos = this.body.GetPosition();
    return {
      angle: this.body.GetAngle(),
      pos: {
        x: bpos.get_x(),
        y: bpos.get_y(),
      },
    };
  }
}


function showPitch(botProg) {
  return _runPitch(botProg, true, false);
}

function getPitchFitness(botProg) {
  return _runPitch(botProg, false, true);
}

function _runPitch(botProg, graphical, fastforward) {
  let pitch = new Pitch(graphical, fastforward);
  window.pitch = pitch;
  let t0 = new Date();
  return pitch.run(botProg).then(() => {
    console.log("done");
    pitch.destroy();
  });
}

  window.deleteBody = function(id) {
    let b = this.bodies[id];
    b.robot._graphics_must_update = true;
    b.robot._phys.GetWorld().DestroyBody(b.robot._phys);
    delete(this.bodies[b.robot._uid]);
    // window.pitch.pixiApp.stage.removeChild(g);
  }

  console.log("Loaded.");
  showPitch({});
});

function stop() {
  window._state_stop = true;
}

