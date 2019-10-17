// create two boxes and a ground
class Pitch {
  constructor(graphical, fastforward) {
    this.destroyCallbacks = [];

    this.graphical = graphical;
    this.fastforward = fastforward;

    if(this.graphical) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: 0xeeeeee,
        autoStart: true,
        width: OFFSET.x + SIZE.w,
        height: OFFSET.y + SIZE.h,
        antialias: !false,
      });

      this.pixiApp.stage.sortableChildren = true;

      document.body.appendChild(this.pixiApp.view);

      // update at least once:
      this.destroyCallbacks.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyCallbacks.push(() => this.pixiApp.destroy());
    }

    this.physics = new MatterPhysics();
    this.destroyCallbacks.push(() => this.physics.destroy());
  }

  destroy() {
    this.destroyCallbacks.forEach(cb => cb());
  }

  run(botProg) {

    for(let i = 0; i < COUNT; i++) {
      let radius = 5 * SCALE;
      let pos = {
        x: radius + Math.random() * (SIZE.w-2*radius),
        y: radius + Math.random() * (SIZE.h-2*radius),
      }
      // pos = {x: 0, y: 0};
      // const PER_ROW = 4;
      // pos.x = (targetBodyIndex % PER_ROW) * (r*2) + SIZE.w/2 - PER_ROW*(r*2)/2;
      // pos.y = SIZE.h/2;
      // pos.y += Math.floor(targetBodyIndex/PER_ROW)*(r*2);
      let b = this.physics.circle(pos, radius, botProg);
      this.createGraphics(b);
    }

    return new Promise((resolve, reject) => {
      const tickFunc = (frameCount) => {
        if(frameCount == FRAME_LIMIT) {
          resolve();
          // this.movingBodies.forEach(b => {
          //   b.agentActive = false;
          // });
          return;
        }

        // this.movingBodies.forEach(b => {
        //   if(b.agentActive) {
        //     b.agentAge += 1;
        //   }
        // });

        this.physics.update();
        if(this.fastforward) {
          // setTimeout(() => tickFunc(frameCount+1), 1);
          tickFunc(frameCount+1);
        } else {
          window.requestAnimationFrame(() => tickFunc(frameCount+1));
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
        const color = getRandomColor();

        const agentGraphicsTick = () => {
          g.x = b.position.x;
          g.y = b.position.y;

          g.clear();
          g.removeChildren();
          if(b.collisionFilter.category == 0x0002) {
            g.beginFill(0xffffff);
          } else {
            g.beginFill(color);
          }

          let thickness = 1;
          // g.drawCircle(0, 0, b.circleRadius-0.5*thickness);
          g.lineStyle(thickness, 0x000000);

          if(b.agentPheromone) {
            g.zIndex = 1;
            g.beginFill(0xffff00, 1.0);
            g.lineStyle(0, 0x000000);
          } else {
            g.zIndex = 2;
          }

          g.alpha = 0.5;
          g.drawCircle(0, 0, b.circleRadius);
          g.endFill();

          if(b.agentActive) {
            g.beginFill(0x000000);
            g.drawCircle(0, 0, b.circleRadius*0.1)
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
        this.pixiApp.ticker.add(() => agentGraphicsTick && agentGraphicsTick());
        this.pixiApp.stage.addChild(g);
        break;
    }
  }
}

class MatterPhysics {
  constructor() {
    this.destroyCallbacks = [];
    let world = Matter.World.create({
      gravity: {
        scale: 0.001,
        // scale: 0,
      },
    });
    world.currentFrame = 0;
    this.engine = Matter.Engine.create({world: world});

    let wallThickness = 300;
    let wallBodies = [];
    wallBodies.push(
      Matter.Bodies.rectangle(SIZE.w+wallThickness*0.5, SIZE.h*0.5, wallThickness, SIZE.h, { isStatic: true }),
      Matter.Bodies.rectangle(      -wallThickness*0.5, SIZE.h*0.5, wallThickness, SIZE.h, { isStatic: true }),

      Matter.Bodies.rectangle(SIZE.w*0.5,       -wallThickness*0.5, SIZE.w, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(SIZE.w*0.5, SIZE.h+wallThickness*0.5, SIZE.w, wallThickness, { isStatic: true }),
    );
    Matter.World.add(this.engine.world, wallBodies);

    Matter.Events.on(this.engine, "beforeUpdate", event => {
      this.engine.world.bodies.forEach(b => {
        // if(!b.agentActive) {
        //   return;
        // }

        /*
        if(b.agentAge > 1) {
          return;
        }

        if(b.agentAge % (FRAMES_PER_BODY/2) != 1) {
          return;
        }
        */

        if(this.engine.world.currentFrame % 16 != 0) {
          return;
        }
        // let force = b.agentBrain.TickBrain(this.engine.world, b, this);
        // Matter.Body.applyForce(b, b.position, force);
      });
    });

    this.destroyCallbacks.push(() => Matter.World.clear(this.engine.world));
    this.destroyCallbacks.push(() => Matter.Engine.clear(this.engine));
    this.destroyCallbacks.push(() => delete(this.engine.world));
    this.destroyCallbacks.push(() => delete(this.engine));
  }

  destroy() {
    this.destroyCallbacks.forEach(cb => cb());
  }
  update() {
    Matter.Engine.update(this.engine, 16, 1);
    this.engine.world.currentFrame++;
  }

  circle(pos, radius, botProg) {
    // let r = 20 * SCALE;
    let b = Matter.Bodies.circle(pos.x, pos.y, radius)
    b.restitution = 0;
    // Matter.Body.setDensity(b, 0.01);
    b.friction = 0.05;
    b.frictionAir = 0.05;
    // b.collisionFilter.category = NO_COLLISION; // 0x0001;
    b.agentIsAgent = true;
    b.agentActive = true;
    b.agentBrain = botProg;
    b.agentAge = 0;
    b.agentLastActions = [];
    Matter.World.add(this.engine.world, b);
    return b;
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
  let t0 = new Date();
  return pitch.run(botProg).then(() => {
    console.log("done");
    pitch.destroy();
  });
}

showPitch({});
