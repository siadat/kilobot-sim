class MatterPhysics {
  constructor() {
    this.movingBodies = [];
    this.destroyFuncs = [];
    let world = Matter.World.create({
      gravity: {
        // scale: 0.001,
        scale: 0,
      },
    });
    world.currentFrame = 0;
    this.engine = Matter.Engine.create({world: world});

    let wallThickness = 300;
    let wallBodies = [];
    /*
    wallBodies.push(
      Matter.Bodies.rectangle(SIZE.w+wallThickness*0.5, SIZE.h*0.5, wallThickness, SIZE.h, { isStatic: true }),
      Matter.Bodies.rectangle(      -wallThickness*0.5, SIZE.h*0.5, wallThickness, SIZE.h, { isStatic: true }),

      Matter.Bodies.rectangle(SIZE.w*0.5,       -wallThickness*0.5, SIZE.w, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(SIZE.w*0.5, SIZE.h+wallThickness*0.5, SIZE.w, wallThickness, { isStatic: true }),
    );
    */
    Matter.World.add(this.engine.world, wallBodies);

    Matter.Events.on(this.engine, "beforeUpdate", event => {
      if(this.engine.world.currentFrame % 16 != 0) {
        return;
      }
        /*
        */
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

        // let force = b.agentBrain.TickBrain(this.engine.world, b, this);
        // Matter.Body.applyForce(b, b.position, force);
      });
    });


    this.destroyFuncs.push(() => Matter.World.clear(this.engine.world));
    this.destroyFuncs.push(() => Matter.Engine.clear(this.engine));
    this.destroyFuncs.push(() => delete(this.engine.world));
    this.destroyFuncs.push(() => delete(this.engine));
  }

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }
  update() {
    this.engine.world.currentFrame++;
    {
      let b = randomItem(this.movingBodies);
      const coef = 0.00000001;
      let force = {
        x: coef * (MathRandom()-0.5),
        y: coef * (MathRandom()-0.5),
      };
      Matter.Body.applyForce(b, b.position, force);
    }
    Matter.Engine.update(this.engine, 16, 1);
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
    this.movingBodies.push(b);
    return b;
  }
}

