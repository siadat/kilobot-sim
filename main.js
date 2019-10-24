Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  TOTAL_MEMORY: 1024 * 1024 * 32, // default value is 1024 * 1024 * 16.
}).then(function(Box2D) {
  window.box2D = Box2D;
// create two boxes and a ground
class Pitch {
  constructor(graphical, fastforward) {
    this.destroyFuncs = [];

    this.graphical = graphical;
    this.fastforward = fastforward;
    this.connections = [];
    this.deltaTime = 0.0;

    if(this.graphical) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: DARK_MODE ? 0x222222 : 0xdddddd,
        autoStart: true,
        width: OFFSET.x + gSIZE.w,
        height: OFFSET.y + gSIZE.h,
        antialias: !false,
      });

      {
        // meta box:
        const g = new PIXI.Graphics()
        const opts = {
          fontSize: 12,
          top: 20,
          left: 20,
        };
        g.zIndex = 3;
        if(DARK_MODE) {
          g.beginFill(0x000000, 0.5);
        } else {
          g.beginFill(0xffffff, 0.5);
        }
        g.drawRect(
          0, 0,
          2*opts.left + 110, opts.fontSize + 2*opts.top,
        );

        const t = new PIXI.Text('FPS', {
          fontSize: opts.fontSize,
          align: 'left',
          fill: DARK_MODE ? 0xffffff : 0x000000
        });
        // t.anchor.set(0.5);
        t.position = {
          x: opts.left,
          y: opts.top,
        }
        g.addChild(t);
        this.pixiApp.stage.addChild(g);

        this.pixiApp.ticker.add(() => {
          // let fpsLine = '';
          // for(let i = 0; i < this.metaFPS/10; i++) {
          //   fpsLine += `${i}`;
          // }
          // t.text = `FPS: ${Math.floor(1/this.deltaTime)} (${this.metaFPS})`;
          t.text = `FPS: ${Math.floor(1/this.deltaTime)}/s`;
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
                g.moveTo(p.x * SCALE, p.y * SCALE);
                return;
              }
              // g.drawCircle(p.x * SCALE, p.y * SCALE, 2);
              g.lineStyle(2, p.color);
              g.moveTo(lastPos.x * SCALE, lastPos.y * SCALE);
              g.lineTo(p.x * SCALE, p.y * SCALE);

              {
                g.moveTo(
                  p.x * SCALE - Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * SCALE * 0.1,
                  p.y * SCALE - Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * SCALE * 0.1,
                );
                g.lineTo(
                  p.x * SCALE + Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * SCALE * 0.1,
                  p.y * SCALE + Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * SCALE * 0.1,
                );
              }

              g.moveTo(p.x * SCALE, p.y * SCALE);
              lastPos = p;
            });

            if(lastPos != null) {
              g.lineStyle(2, b.robot.led.toHex());
              g.lineTo(b.body.GetPosition().get_x() * SCALE, b.body.GetPosition().get_y() * SCALE);
            }
          });
        });
      }

      if(DRAW_SHAPE_DESCRIPTION) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.3;
        // g.beginFill(b.robot.led.toHexDark());

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_SHAPE_DESCRIPTION) return;

          g.lineStyle(1, 0x000000);
          for(let rowi = 0; rowi < ShapeDesc.length; rowi++) {
            let row = ShapeDesc[rowi];
            for(let coli = 0; coli < row.length; coli++) {
              if(row[coli] == '#') {
                g.beginFill(0xffffff);
              } else {
                // g.beginFill(0x888888);
                continue;
              }
              g.drawRect(
                SCALE * (RootSeedPos.x + coli * ShapeScale),
                SCALE * (RootSeedPos.y - (ShapeDesc.length - rowi - 1) * ShapeScale),
                SCALE * (ShapeScale),
                -SCALE * (ShapeScale),
              );
            }
          }
        });
      }

      if(DRAW_SHADOW) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = 1;
        g.alpha = 0.5;
        // g.beginFill(b.robot.led.toHexDark());

        this.pixiApp.stage.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_SHADOW) return;

          forEachObj(this.bodies, b => {

            let shadowOffset = {
              x: (b.body.GetPosition().get_x() + b.circleRadius*0.25) * SCALE,
              y: (b.body.GetPosition().get_y() + b.circleRadius*0.25) * SCALE,
            }

            g.beginFill(0x000000)
            g.drawCircle(shadowOffset.x, shadowOffset.y, b.circleRadius * SCALE);
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

          forEachObj(this.bodies, b => {
            let shapePos = b.robot.shapePos;
            if(!shapePos) return;

            let pos = b.position;
            if(!b.position && b.getData) {
              let data = b.getData();
              pos = data.pos;
            }

            let thickness = RADIUS*SCALE * 0.1; // 2
            let posActual = {
              x: pos.x * SCALE,
              y: pos.y * SCALE,
            }
            let posEstimated = {
              x: RootSeedPos.x * SCALE + shapePos.x * ShapeScale * SCALE,
              y: RootSeedPos.y * SCALE - shapePos.y * ShapeScale * SCALE,
            }

            const MAX = 100000;
            if(posEstimated.x > +MAX) posEstimated.x = +MAX;
            if(posEstimated.x < -MAX) posEstimated.x = -MAX;
            if(posEstimated.y > +MAX) posEstimated.y = +MAX;
            if(posEstimated.y < -MAX) posEstimated.y = -MAX;

            g.endFill();
            color = b.robot.led.toHexDark();
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
              g.drawCircle(posEstimated.x, posEstimated.y, SCALE * RADIUS);

              {
                let crossPoints = [posEstimated, posActual];
                let fullSize = SCALE * RADIUS * 0.2;
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
        });
      }

      {
        if(DRAW_CONNECTIONS) {
          let connGraphics = new PIXI.Graphics()
          connGraphics.zIndex = 2;
          connGraphics.alpha = 0.5;
          this.pixiApp.stage.addChild(connGraphics);
          this.pixiApp.ticker.add(() => {
            connGraphics.clear();
            if(!DRAW_CONNECTIONS) return;

            this.bounds.forEach(bound => {
              connGraphics.lineStyle(2, bound.color || 0x00ff00);

              connGraphics.drawRect(
                SCALE * (bound.aabb.get_lowerBound().get_x()),
                SCALE * (bound.aabb.get_lowerBound().get_y()),
                SCALE * (bound.aabb.get_upperBound().get_x() - bound.aabb.get_lowerBound().get_x()),
                SCALE * (bound.aabb.get_upperBound().get_y() - bound.aabb.get_lowerBound().get_y()),
              );
            });

            this.connections.forEach(conn => {
              let pos1 = this.bodies[conn.from].body.GetPosition();
              let pos2 = this.bodies[conn.to].body.GetPosition();
              connGraphics.lineStyle(SCALE * RADIUS/4, this.bodies[conn.from].robot.led.toHex());
              connGraphics.moveTo(pos1.get_x() * SCALE, pos1.get_y() * SCALE);
              connGraphics.lineTo(pos2.get_x() * SCALE, pos2.get_y() * SCALE);
            });

          });
        }
      }


      this.pixiApp.stage.sortableChildren = true;

      document.body.appendChild(this.pixiApp.view);

      // update at least once:
      this.destroyFuncs.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyFuncs.push(() => this.pixiApp.destroy());
    }

    // this.physics = new MatterPhysics();
    this.physics = new Box2DPhysics();
    this.destroyFuncs.push(() => this.physics.destroy());
  }

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  run(botProg) {
		this.bodies = {};
    let uidCounter = 0;

    const shapePosToPhysPos = (shapePos) => {
      return {
        x: RootSeedPos.x + ShapeScale*shapePos.x,
        y: RootSeedPos.y - ShapeScale*shapePos.y, // y-axis in shape goes up, in physics goes down
      };
    }

    [
      {isSeed: true, isRoot: true,  x: 0*RADIUS/ShapeScale, y: RADIUS/ShapeScale * 0},
      {isSeed: true, isRoot: false, x: 2*RADIUS/ShapeScale, y: RADIUS/ShapeScale * 0},
      {isSeed: true, isRoot: false, x: 1*RADIUS/ShapeScale, y: RADIUS/ShapeScale * +Math.sqrt(3)},
      {isSeed: true, isRoot: false, x: 1*RADIUS/ShapeScale, y: RADIUS/ShapeScale * -Math.sqrt(3)},
      // {isSeed: false,isRoot: false, x: 1*RADIUS/ShapeScale, y: RADIUS/ShapeScale * -Math.sqrt(3) - 2 * RADIUS/ShapeScale},
    ].forEach(shapePos => {
      uidCounter++;

      // if(!PERFECT) {
      //   shapePos.x += noise(0.2);
      //   shapePos.y += noise(0.2);
      // }

      let b = this.physics.circle(shapePosToPhysPos(shapePos), Math.PI/2, RADIUS, uidCounter);
      b.robot = new GradientAndAssemblyRobot({
        shapeDesc: ShapeDesc,
        shapeScale: ShapeScale,
        shapePos: shapePos.isSeed ? {x: shapePos.x, y: shapePos.y} : null,
        isGradientSeed: shapePos.isSeed && shapePos.isRoot,
        isSeed: shapePos.isSeed,
      });

      b.robot._uid = uidCounter;
      b.robot._phys = b.body;
      b.robot._Box2D = Box2D;

      this.bodies[b.robot._uid] = b;

      this.createGraphics(b);
    });

    let assemblyCount = COUNT - 4 - 1;
    for(let i = 0; i < assemblyCount; i++) {
      uidCounter++;
      let rowi = Math.floor(i/PER_ROW);
      let coli = i % PER_ROW;

      let pos = {
        x: RootSeedPos.x + RADIUS,
        y: RootSeedPos.y + Math.sqrt(3) * RADIUS + 2*RADIUS, // + 2*RADIUS,
      };

      if(PER_ROW % 2 == 0) {
        pos.y = RootSeedPos.y + Math.sqrt(3) * RADIUS + Math.sqrt(3)*RADIUS;
      }

      let firstToLastCentersInOneRow = (PER_ROW-1)*INITIAL_DIST;
      pos.x += coli * INITIAL_DIST - firstToLastCentersInOneRow/2 + (INITIAL_DIST/2)*(rowi%2);
      pos.y += rowi * (INITIAL_DIST/2*Math.sqrt(3));

      if(!PERFECT) {
        pos.x += noise(RADIUS * 0.2);
        pos.y += noise(RADIUS * 0.2);
      }

      let b = this.physics.circle(pos, Math.PI/2, RADIUS, uidCounter);

      b.robot = new GradientAndAssemblyRobot({
        shapeDesc: ShapeDesc,
        shapeScale: ShapeScale,
        shapePos: null,
        isSeed: false,
      });
      b.robot._uid = uidCounter;
      b.robot._phys = b.body;
      b.robot._Box2D = Box2D;

      this.bodies[b.robot._uid] = b;

      this.createGraphics(b);
    }

    if(PERFECT) {
      forEachObj(this.bodies, b => {
        b.robot.setup();
        b.robot._started = true;
      });
    }

    window.bodies = this.bodies;

    return new Promise((resolve, reject) => {
      const tickFunc = (frameCount, recursive) => {
        if(frameCount == FRAME_LIMIT || window._state_stop) {
          resolve();
          return;
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

        // ******
        forEachObj(this.bodies, b => {
          if(b.robot._started) {
            b.robot.loop();
            b.robot._internal_loop();
            return;
          }

          if(Math.random() < 0.05) {
            b.robot.setup();
            b.robot._started = true;
          }
        });
        // ******

        // this.bodies = this.bodies.filter(b => !b._to_be_removed);
        this.connections = [];
        this.bounds = [];

        /*
        this.bodies.forEach(b => {
          let aabb = b.body.GetFixtureList().GetAABB();
          this.bounds.push({aabb: aabb});
        });
        */

        // ---
        forEachObj(this.bodies, (b, i) => {
          if(frameCount < b.lastMessageSentAt + 30) {
            return;
          }

          b.lastMessageSentAt = frameCount;

          let broadcastingBody = b;

          if(!broadcastingBody) {
            console.error("deleted robot fetched");
            return;
          }

          if(!broadcastingBody.robot._started) {
            return;
          }
          let pos = broadcastingBody.body.GetPosition();
          let queryCallback = new Box2D.JSQueryCallback();

          let message = broadcastingBody.robot.kilo_message_tx();
          if(message == null) {
            return;
          }

          const handleReceiver = (id) => {
            let receiverBody = this.bodies[id];

            if(!receiverBody) {
              console.error(`body id not found id=${id}`);
              return;
            }

            if(receiverBody.body.GetUserData() == broadcastingBody.body.GetUserData()) {
              // same body
              return;
            }

            if(!receiverBody.robot._started) {
              return;
            }

            let p1 = broadcastingBody.body.GetPosition();
            let p2 = receiverBody.body.GetPosition();
            let distance = Math.sqrt(Math.pow(p1.get_x() - p2.get_x(), 2) + Math.pow(p1.get_y() - p2.get_y(), 2));

            if(distance > NEIGHBOUR_DISTANCE) {
              return;
            }

            receiverBody.robot.kilo_message_rx(message, distance);
            this.connections.push({
              from: broadcastingBody.body.GetUserData(),
              to: receiverBody.body.GetUserData(),
            });
          };

          queryCallback.ReportFixture = function(fixturePtr) {
            var fixture = Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
            let id = fixture.GetBody().GetUserData();
            if(id == BODY_ID_IGNORE) {
              return ContinueQuery;
            }
            handleReceiver(id);
            return ContinueQuery;
          }

          let aabb = new Box2D.b2AABB();
          let lowerBound = new Box2D.b2Vec2(pos.get_x()-NEIGHBOUR_DISTANCE, pos.get_y()-NEIGHBOUR_DISTANCE);
          let upperBound = new Box2D.b2Vec2(pos.get_x()+NEIGHBOUR_DISTANCE, pos.get_y()+NEIGHBOUR_DISTANCE);
          aabb.set_lowerBound(lowerBound);
          aabb.set_upperBound(upperBound);
          Box2D.destroy(lowerBound);
          Box2D.destroy(upperBound);

          this.physics.world.QueryAABB(queryCallback, aabb);
          Box2D.destroy(aabb);
        });

        if(!recursive) {
          return;
        }

        // ******
        if(this.fastforward) {
          // setTimeout(() => tickFunc(frameCount+1), 1);
          tickFunc(frameCount+1);
        } else {
          let time0 = new Date();
          if(false) {
            tickFunc(++frameCount, false);

            setTimeout(() => {
              tickFunc(++frameCount, true);
              let dt = (new Date() - time0)/1000;
              // this.metaFPS = Math.floor(1.0/dt);
              if(frameCount == 1) {
                this.deltaTime = dt;
              } else {
                this.deltaTime += (dt - this.deltaTime) * 0.2;
              }
            }, 1);
          } else {
            if(FAST) {
              for(let i = 0; i < 10; i++) {
                tickFunc(++frameCount, false);
              }
            }
            window.requestAnimationFrame(() => {
              tickFunc(++frameCount, true);
              let dt = (new Date() - time0)/1000;
              // this.metaFPS = Math.floor(1.0/dt);
              if(frameCount == 1) {
                this.deltaTime = dt;
              } else {
                this.deltaTime += (dt - this.deltaTime) * 0.2;
              }
            });
          }
        }
      }

      tickFunc(0, true);
    });
  }

  createGraphics(b) {
    if(!this.graphical) {
      return;
    }
    switch(b.label) {
      case "Circle Body":
        const g = new PIXI.Graphics();
        g.interactive = true;
        g.buttonMode = true;
        g.on('pointerdown', () => {
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
          /*
          b._to_be_removed = true;
          b.robot._graphics_must_update = true;
          b.robot._phys.GetWorld().DestroyBody(b.robot._phys);
          delete(this.bodies[b.robot._uid]);
          this.pixiApp.stage.removeChild(g);
          */

          // this.physics.world.DestroyBody(b.robot._phys);
        });

        const agentGraphicsTick = (b) => {
          let pos = b.position;
          let angle = 0;
          if(!b.position && b.getData) {
            let data = b.getData();
            pos = data.pos;
            angle = data.angle;
          }
          g.x = pos.x * SCALE;
          g.y = pos.y * SCALE;
          g.angle = angle;
          g.zIndex = 1;

          if(!b.robot._graphics_must_update) {
            return;
          } else {
            b.robot._updated_graphics();
          }

          g.clear();
          g.removeChildren();

          let thickness = 0;

          if(false && b.robot._uid == 504) {
            g.lineStyle(1, 0x000000);
            g.beginFill(0x000000, 0.1);
            g.drawCircle(0, 0, NEIGHBOUR_DISTANCE * SCALE);
          }

          if(DARK_MODE) {
            g.beginFill(0x000000);
          } else {
            thickness = 1;
            g.beginFill(0xffffff);
          }

          g.lineStyle(thickness, 0x000000);
          g.drawCircle(0, 0, b.circleRadius * SCALE - thickness/2);

          let ledRadius = b.circleRadius * 0.4;

          g.lineStyle(0);
          if(b.robot.state == States.JoinedShape) {
            g.beginFill(b.robot.led.toHex(), 0.9);
          } else {
            g.beginFill(b.robot.led.toHex(), 0.2);
          }
          g.drawCircle(0, 0, b.circleRadius * SCALE - thickness/2);

          /*
          if(b.robot.led.toHex() != 0x000000) {
            g.filters = [
              new PIXI.filters.GlowFilter(2, 2, 1, b.robot.led.toHex(), 0.5),
            ];
          } else {
            g.filters = [];
          }
          */
          g.lineStyle(b.circleRadius*SCALE/2.0);
          g.moveTo(0, 0);
          g.lineTo(b.circleRadius*SCALE, 0);

          g.lineStyle(thickness);
          g.beginFill(b.robot.led.toHex());
          g.drawCircle(
            0,
            0,
            ledRadius * SCALE,
          );

          if(b.robot._mark) {
            g.endFill();
            g.lineStyle(2, 0x000000);
            g.drawCircle(
              0,
              0,
              ledRadius * SCALE * 0.5,
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
                g.lineTo(SCALE * RADIUS, 0);
                break;
              case 'left-get-farther':
                g.moveTo(0, 0);
                g.lineTo(0, -SCALE * RADIUS);
                break;
              case 'right-get-close':
                g.moveTo(0, 0);
                g.lineTo(0, +SCALE * RADIUS);
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
          if(b._to_be_removed) {
            this.pixiApp.stage.removeChild(g);
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

    if(true /* edge/wall */) {
      this.edgeShape({x: 0, y: 0}, {x: SIZE.w, y: 0});
      this.edgeShape({x: 0, y: 0}, {x: 0,      y: SIZE.h});

      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: 0, y: SIZE.h});
      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: SIZE.w, y: 0});
    }

    /*
		let listener = new Box2D.JSContactListener();
		listener.PreSolve = function(contact) {
      // console.log('PreSolve', arguments);
      return;
    }
		listener.PostSolve = function(contact) {
      // console.log('PreSolve', arguments);
      return;
    }
		listener.BeginContact = function(contact) {
      // console.log('BeginContact', contact.GetFixtureA().GetBody().GetUserData());
      // console.log('BeginContact', contact);
      return;
			div = document.getElementById("textUI");
			div.innerHTML = "Come "+contact.GetFixtureA().GetBody();
			defaultCarSpeed = defaultCarSpeed/2;
		}

		listener.EndContact = function(contact) {
      // console.log('EndContact', contact.GetFixtureA().GetBody().GetUserData());
      // console.log('EndContact', contact);
      return;
      div = document.getElementById("textUI");
			div.innerHTML = "Go "+contact.GetFixtureA().GetBody();
			defaultCarSpeed = defaultCarSpeed*2;
		}
		this.world.SetContactListener(listener);
    */
	}

	edgeShape(from, to) {
		let bd_ground = new Box2D.b2BodyDef();
		bd_ground.set_type(Box2D.b2_staticBody);
		let ground = this.world.CreateBody(bd_ground);
    ground .SetUserData(BODY_ID_IGNORE);
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
    this.world.Step(1.0/60.0, 8, 3); // 8, 2
    this.currentFrame++;
  }

	circle(pos, angle, radius, id) {
		let b2bodyDef = new Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(20.0);
		b2bodyDef.set_angularDamping(20.0);
    // b2bodyDef.set_type(Box2D.b2_dynamicBody);
		b2bodyDef.set_type(Box2D.b2_staticBody);

    let posVec = new Box2D.b2Vec2(pos.x, pos.y);
		b2bodyDef.set_position(posVec);
    Box2D.destroy(posVec);

    b2bodyDef.set_bullet(false);

    let filter1 = new Box2D.b2Filter();
    filter1.set_categoryBits(0x0001);
    filter1.set_maskBits(0x0001);

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
    // body.CreateFixture(fixtureSensor);
    // Box2D.destroy(b2bodyDef);

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
    b._to_be_removed = true;
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

