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
          align: 'center',
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
          let fpsLine = '';
          for(let i = 0; i < this.metaFPS/10; i++) {
            fpsLine += `${i}`;
          }
          t.text = `FPS: ${this.metaFPS} ${fpsLine}`;
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

    for(let i = 0; i < COUNT; i++) {
      let pos = {x: 0, y: 0};
      const PER_ROW = Math.floor(Math.sqrt(COUNT));
      let rowi = Math.floor(i/PER_ROW);
      pos.x = (i % PER_ROW) * (RADIUS*2) + SIZE.w/2 - PER_ROW*(RADIUS*2)/2 + RADIUS*(rowi%2);
      pos.y = SIZE.h/2 - (COUNT/PER_ROW) * 0.5 * (RADIUS*2);
      pos.y += rowi*(RADIUS*2);
      let b = this.physics.circle(pos, RADIUS, i);

      let gradientIndex = Math.floor(COUNT / 2) + Math.floor(Math.sqrt(COUNT)/2);
      if(i == gradientIndex ) {
        b.robot = new GradientSeedRobot();
      } else if(i > gradientIndex  && i < gradientIndex  + 4) {
        b.robot = new SeedRobot();
      } else {
        b.robot = new SelfAssemblyRobot();
      }

      b.robot._uid = i;
      b.robot._phys = b.body;
      b.robot._Box2D = Box2D;

      // this.bodies.push(b);
      this.bodies[i] = b;

      this.createGraphics(b);
    }

    if(PERFECT) {
      // this.bodies.forEach(b => {
      forEachObj(this.bodies, b => {
        b.robot.setup();
        b.robot._started = true;
      });
    }

    window.bodies = this.bodies;

    return new Promise((resolve, reject) => {
      const tickFunc = (frameCount) => {
        if(frameCount == FRAME_LIMIT || window._state_stop) {
          resolve();
          return;
        }

        this.physics.update();

        // ******
        let runningCount = 0;
        forEachObj(this.bodies, b => {
          if(b.robot._started) {
            runningCount++;
            b.robot.loop();
            b.robot._internal_loop();
            return;
          }

          if(Math.random() < 0.05) {
            runningCount++;
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
        // all of this logic is to make sure each robot sends roughly 2 messages per second
        let i = 0;
        const FPS = 60;

        let msgsPerFrame = MSG_PER_SEC * COUNT / FPS;
        let cond = () => i < msgsPerFrame;

        if(msgsPerFrame < 1) {
          cond = () => (frameCount+i) % (FPS/MSG_PER_SEC) == 0
        }

        for(; cond(); i++){
          let broadcasterID = randomItem(Object.keys(this.bodies));
          let broadcastingBody = this.bodies[broadcasterID];
          if(!broadcastingBody) {
            console.error("deleted robot fetched");
            continue;
          }

          if(!broadcastingBody.robot._started) {
            continue;
          }
          let pos = broadcastingBody.body.GetPosition();
          let queryCallback = new Box2D.JSQueryCallback();

          let message = broadcastingBody.robot.kilo_message_tx();
          if(message == null) {
            continue;
          }

          const handleReceiver = (id) => {
            let receiverBody = this.bodies[id];

            if(!receiverBody) {
              console.error("body id not found");
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
            // this.receiverIDs.push(id);
            handleReceiver(id);
            return ContinueQuery;
          }
          // queryCallback.receiverIDs = [];

          let aabb = new Box2D.b2AABB();
          let lowerBound = new Box2D.b2Vec2(pos.get_x()-NEIGHBOUR_DISTANCE/2, pos.get_y()-NEIGHBOUR_DISTANCE/2);
          let upperBound = new Box2D.b2Vec2(pos.get_x()+NEIGHBOUR_DISTANCE/2, pos.get_y()+NEIGHBOUR_DISTANCE/2);
          aabb.set_lowerBound(lowerBound);
          aabb.set_upperBound(upperBound);
          Box2D.destroy(lowerBound);
          Box2D.destroy(upperBound);

          this.physics.world.QueryAABB(queryCallback, aabb);
          Box2D.destroy(aabb);
          // queryCallback.receiverIDs.forEach(id => { });
        }

        // ******
        if(this.fastforward) {
          // setTimeout(() => tickFunc(frameCount+1), 1);
          tickFunc(frameCount+1);
        } else {
          let time0 = new Date();
          window.requestAnimationFrame(() => {
            tickFunc(frameCount+1);
            let dt = (new Date() - time0)/1000;
            this.metaFPS = Math.floor(1.0/dt);
          });
        }
      }

      tickFunc(0);
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
          console.log(`clicked uid:${b.robot._uid} counter:${b.robot.counter} ticksUntilCanMove:${b.robot.ticksUntilCanMove}`);
          /*
          b._to_be_removed = true;
          b.robot._graphics_must_update = true;
          b.robot._phys.GetWorld().DestroyBody(b.robot._phys);
          delete(this.bodies[b.robot._uid]);
          this.pixiApp.stage.removeChild(g);
          */

          // this.physics.world.DestroyBody(b.robot._phys);
          if(!b.robot.events) return;
          b.robot.events.forEach(e => {
            console.log(e);
          });
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

          if(DARK_MODE) {
            g.beginFill(0x000000);
          } else {
            thickness = 1;
            g.beginFill(0xffffff);
          }
          g.lineStyle(thickness, 0x000000);
          g.drawCircle(0, 0, b.circleRadius * SCALE - thickness/2);

          let ledRadius = b.circleRadius * 0.4;
          // let ledRadius = b.circleRadius * 1.0;

          g.lineStyle(0);
          g.beginFill(b.robot.led.toHex(), 0.2);
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
            // (b.circleRadius-ledRadius) * SCALE,
            0,
            0,
            ledRadius * SCALE,
          );

          if(b.robot._mark) {
            g.beginFill(0x000000);
            g.drawCircle(
              // (b.circleRadius-ledRadius) * SCALE,
              0,
              0,
              ledRadius * SCALE * 0.75,
            );
          }

          if(false) {
            // const t = new PIXI.Text(`${b.robot._uid}`, {fontSize: 9, align: 'center'});
            const t = new PIXI.Text(`${b.robot.counter || '0'}`, {fontSize: 9, align: 'center', fill: 0xf0f0f0});
            t.anchor.set(0.5);
            t.position = {
              x: 0,
              y: 0,
            }
            g.addChild(t);
          }

          /*
        const crossSize = 0;
        g.lineStyle(1, 0x000000);
        g.moveTo(-crossSize, 0);
        g.lineTo(crossSize, 0);
        g.moveTo(0, -crossSize);
        g.lineTo(0, crossSize);
        */

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
		let gravity = new Box2D.b2Vec2(0.0, 0.0);
		this.world = new Box2D.b2World(gravity);

    this.edgeShape({x: 0, y: 0}, {x: SIZE.w, y: 0});
    this.edgeShape({x: 0, y: 0}, {x: 0,      y: SIZE.h});

    this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: 0, y: SIZE.h});
    this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: SIZE.w, y: 0});


    /*
    {
      var bd_ground = new Box2D.b2BodyDef();
      bd_ground.set_type(Box2D.b2_staticBody);
      // bd_ground.set_position(new Box2D.b2Vec2(SIZE.w/2, SIZE.h));
      var ground = this.world.CreateBody(bd_ground);

      var shape0 = new Box2D.b2EdgeShape();
      shape0.Set(new Box2D.b2Vec2(0, SIZE.h), new Box2D.b2Vec2(SIZE.w, SIZE.h));

      // let shape0 = new Box2D.b2PolygonShape();
      // shape0.SetAsBox(SIZE.w * 0.5, SIZE.h * 0.5);
      ground.CreateFixture(shape0, 0.0);
    }
    */

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
	}

	edgeShape(from, to) {
		let bd_ground = new Box2D.b2BodyDef();
		bd_ground.set_type(Box2D.b2_staticBody);
		let ground = this.world.CreateBody(bd_ground);
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

	circle(pos, radius, id) {
		let b2bodyDef = new Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(10.0);
		b2bodyDef.set_angularDamping(10.0);
		b2bodyDef.set_type(Box2D.b2_dynamicBody);

    if(!PERFECT) {
      pos.x += noise(radius * 0.2);
      pos.y += noise(radius * 0.2);
    }

    let posVec = new Box2D.b2Vec2(pos.x, pos.y);
		b2bodyDef.set_position(posVec);
    Box2D.destroy(posVec);

    b2bodyDef.set_bullet(false);

    // ---
    let filter1 = new Box2D.b2Filter();
    filter1.set_categoryBits(0x0001);
    filter1.set_maskBits(0x0001);

    // let circleShape = new Box2D.b2CircleShape();
    // circleShape.set_m_radius(radius);

    if(!this.circleShape) {
      this.circleShape = new Box2D.b2CircleShape();
      this.circleShape.set_m_radius(radius);
    }

		let fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(1.0);
		fixtureDef.set_friction(0.6);
		fixtureDef.set_restitution(0.0);
		fixtureDef.set_shape(this.circleShape);
    fixtureDef.set_filter(filter1);
    Box2D.destroy(filter1);
    // Box2D.destroy(this.circleShape);

    /*
    // ---
    let filter2 = new Box2D.b2Filter();
    filter2.set_categoryBits(0x0002);
    filter2.set_maskBits(0x0002);

    // let sensorShape = new Box2D.b2CircleShape();
    // sensorShape.set_m_radius(radius * 2);
    if(!this.sensorShape) {
      this.sensorShape  = new Box2D.b2PolygonShape();
      this.sensorShape.SetAsBox(radius*2, radius*2);
      // this.sensorShape = new Box2D.b2CircleShape();
      // this.sensorShape.set_m_radius(radius * 2);
    }

		let fixtureSensor = new Box2D.b2FixtureDef();
    // fixtureSensor.set_density(1.0);
    // fixtureSensor.set_friction(0.6);
    // fixtureSensor.set_restitution(0.0);
		fixtureSensor.set_shape(this.sensorShape);
    fixtureSensor.set_isSensor(true);
    fixtureSensor.set_filter(filter2);
    Box2D.destroy(filter2);
    // Box2D.destroy(this.sensorShape);
    */

		let body = this.world.CreateBody(b2bodyDef);
    body.CreateFixture(fixtureDef);
    // body.CreateFixture(fixtureSensor);
    // Box2D.destroy(b2bodyDef);

    body.SetUserData(id);

    if(!PERFECT) {
      body.ApplyTorque(noise(Math.PI/2));
    }

		/*
		let circleShape = new Box2D.b2CircleShape();
		circleShape.set_m_radius(radius);

		let bd = new Box2D.b2BodyDef();
		let box2dPos = new Box2D.b2Vec2(pos.x, pos.y);
		bd.set_type(Box2D.b2_dynamicBody);
		bd.set_position(box2dPos);
		let body = this.world.CreateBody(bd);

		// let fixtureDef = new Box2D.b2FixtureDef();
		// fixtureDef.set_density(1);
		// fixtureDef.set_friction(0.6);
		// fixtureDef.set_restitution(1.0);
		// fixtureDef.set_shape(circleShape);
		// body.CreateFixture(fixtureDef);

		body.CreateFixture(circleShape, 1.0);

		// let b = Matter.Bodies.circle(pos.x, pos.y, radius)
		// b.restitution = 0;
		// b.friction = 0.05;
		// b.frictionAir = 0.05;
		// b.agentIsAgent = true;
		// b.agentActive = true;
		// b.agentBrain = botProg;
		// b.agentAge = 0;
		// b.agentLastActions = [];
		// Matter.World.add(this.engine.world, b);
		*/

    return new Body(body, radius)

      /*
    let b = new Body(body, radius);
    b.robot = new SelfAssemblyRobot();
    b.robot._uid = id;
    b.robot._phys = body;
    b.robot._Box2D = Box2D;
    return b;
    */
	}
}

class Body {
  constructor(body, radius) {
    this.body = body;
    this.label = 'Circle Body';
    this.circleRadius = radius;
  }

    /*
  setAgentActive(value) {
    if(this.agentActive == value) {
      return;
    } else {
      this.agentActive = value;
      this.agentActiveChanged = true;
    }
  }
  */

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

