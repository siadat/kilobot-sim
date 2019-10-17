Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  // TOTAL_MEMORY: 1024 * 1024 * 16, // default value is 1024 * 1024 * 16.
}).then(function(Box2D) {
  window.box2D = Box2D;
// create two boxes and a ground
class Pitch {
  constructor(graphical, fastforward) {
    this.destroyCallbacks = [];

    this.graphical = graphical;
    this.fastforward = fastforward;

    if(this.graphical) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: 0xdddddd,
        autoStart: true,
        width: OFFSET.x + gSIZE.w,
        height: OFFSET.y + gSIZE.h,
        antialias: !false,
      });

      this.pixiApp.stage.sortableChildren = true;

      document.body.appendChild(this.pixiApp.view);

      // update at least once:
      this.destroyCallbacks.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyCallbacks.push(() => this.pixiApp.destroy());
    }

    // this.physics = new MatterPhysics();
    this.physics = new Box2DPhysics();
    this.destroyCallbacks.push(() => this.physics.destroy());
  }

  destroy() {
    this.destroyCallbacks.forEach(cb => cb());
  }

  run(botProg) {
		this.bodies = [];

    for(let i = 0; i < COUNT; i++) {
      let pos = {x: 0, y: 0};
      const PER_ROW = Math.floor(Math.sqrt(COUNT));
      let rowi = Math.floor(i/PER_ROW);
      pos.x = (i % PER_ROW) * (RADIUS*2) + SIZE.w/2 - PER_ROW*(RADIUS*2)/2 + RADIUS*(rowi%2);
      pos.y = SIZE.h/2 - (COUNT/PER_ROW) * 0.5 * (RADIUS*2);
      pos.y += rowi*(RADIUS*2);
      let b = this.physics.circle(pos, RADIUS, botProg);
      this.bodies.push(b);
      this.createGraphics(b);
    }

    if(PERFECT) {
      this.bodies.forEach(b => {
        b.robot.setup();
        b.robot._started = true;
      });
    }

    window.bodies = this.bodies;

    return new Promise((resolve, reject) => {
      const tickFunc = (frameCount) => {
        if(frameCount == FRAME_LIMIT) {
          resolve();
          return;
        }

        this.physics.update();

        let runningCount = 0;
        for(let i = 0; i < this.bodies.length; i++) {
          let b = this.bodies[i];
          if(b.robot._started) {
            runningCount++;
            b.robot.loop();
            continue;
          } 

          // like a wave: if(i < runningCount + this.bodies.length/10) {
          if(Math.random() < 0.05) {
            runningCount++;
            b.robot.setup();
            b.robot._started = true;
          }
        }

        if(this.fastforward) {
          // setTimeout(() => tickFunc(frameCount+1), 1);
          tickFunc(frameCount+1);
        } else {
          let time0 = new Date();
          window.requestAnimationFrame(() => {
            tickFunc(frameCount+1);
            let dt = (new Date() - time0)/1000;
            // console.log('fps', Math.floor(1.0/dt));
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
        const color = '0xffffff';

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

          if(!b.robot._graphics_must_update) {
            return;
          } else {
            b.robot._updated_graphics();
          }

          g.clear();
          g.removeChildren();
          g.beginFill(color);

          let thickness = 0;
          g.lineStyle(thickness, 0x000000);

          g.zIndex = 1;

          //g.alpha = 0.8;
          g.drawCircle(0, 0, b.circleRadius * SCALE - thickness/2);
          g.endFill();

          let ledRadius = b.circleRadius * 0.4;

          g.beginFill(b.robot.led.toHex());
          g.lineStyle(0);
          g.drawCircle(-(-b.circleRadius+ledRadius) * SCALE+thickness, 0, ledRadius * SCALE);


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
        this.pixiApp.ticker.add(() => agentGraphicsTick && agentGraphicsTick(b));
        this.pixiApp.stage.addChild(g);
        break;
    }
  }
}

class Box2DPhysics {
	constructor() {
		this.currentFrame = 0;
		this.destroyCallbacks = [];

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
    this.destroyCallbacks.forEach(cb => cb());
  }

  update() {
    this.world.Step(1.0/60.0, 2, 2);
    this.currentFrame++;
  }

	circle(pos, radius, botProg) {
		let b2bodyDef = new Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(10.0);
		b2bodyDef.set_angularDamping(10.0);
		b2bodyDef.set_type(Box2D.b2_dynamicBody);

    if(!PERFECT) {
      pos.x += noise(radius * 0.2);
      pos.y += noise(radius * 0.2);
    }

		b2bodyDef.set_position(new Box2D.b2Vec2(pos.x, pos.y));
    // b2bodyDef.set_bullet(true);


		let circleShape = new Box2D.b2CircleShape();
    circleShape.set_m_radius(radius);
    // if(!this.circleShape) {
    //   this.circleShape = new Box2D.b2CircleShape();
    //   this.circleShape.set_m_radius(radius);
    // }

		let fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(1.0);
		fixtureDef.set_friction(0.6);
		fixtureDef.set_restitution(0.0);
		fixtureDef.set_shape(circleShape);

		let body = this.world.CreateBody(b2bodyDef);
    body.CreateFixture(fixtureDef);

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

    let b = new Body(body, radius);
    b.robot = new MyRobot();
    b.robot._phys = body;
    b.robot._Box2D = Box2D;
    return b;
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
  showPitch({});
});
