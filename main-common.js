class Pitch {
  constructor(Box2D) {
    this.Box2D = Box2D;

    this.destroyFuncs = [];

    this.connections = [];
    this.deltaTime = null;
    this.speedX = null;
    this.fps = 60;
    this.metaData = {};
    this.tickBatchCount = 1;

    if(true /*graphical*/) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: DARK_MODE ? 0x222222 : 0xdddddd,
        autoStart: true,
        width: SIZE.w,
        height: SIZE.h,
        antialias: !false,
      });
      this.pixiApp.sortableChildren = true;
      // this.pixiApp.interactive = true;
      window.pixiApp = this.pixiApp;
      document.body.appendChild(this.pixiApp.view);

      let updateZoom = (nextZoom, screenCenter) => {
        if(nextZoom < 2) nextZoom = 2;
        if(nextZoom > 20) nextZoom = 20;

        let centerWithoutZoom = {
          // x: (V.PAN.x-SIZE.w/2)/V.ZOOM,
          // y: (V.PAN.y-SIZE.h/2)/V.ZOOM,
          x: (V.PAN.x - screenCenter.x)/V.ZOOM,
          y: (V.PAN.y - screenCenter.y)/V.ZOOM,
        }

        V.PAN.x += (centerWithoutZoom.x * nextZoom - centerWithoutZoom.x * V.ZOOM);
        V.PAN.y += (centerWithoutZoom.y * nextZoom - centerWithoutZoom.y * V.ZOOM);
        this.platformGraphics.position = V.PAN;

        V.ZOOM = nextZoom;

        localStorage.setItem('V.ZOOM', V.ZOOM);
        localStorage.setItem('V.PAN.x', V.PAN.x);
        localStorage.setItem('V.PAN.y', V.PAN.y);
      }

      this.pixiApp.view.addEventListener('mousewheel', ev => {
        let nextZoom = V.ZOOM * (1 + ev.wheelDelta/1000.0);
        updateZoom(nextZoom, {
          x: ev.clientX,
          y: ev.clientY,
        });

        /*
        let centerWithoutZoom = {
          // x: (V.PAN.x-SIZE.w/2)/V.ZOOM,
          // y: (V.PAN.y-SIZE.h/2)/V.ZOOM,
          x: (V.PAN.x - ev.clientX)/V.ZOOM,
          y: (V.PAN.y - ev.clientY)/V.ZOOM,
        }

        V.PAN.x += (centerWithoutZoom.x * nextZoom - centerWithoutZoom.x * V.ZOOM);
        V.PAN.y += (centerWithoutZoom.y * nextZoom - centerWithoutZoom.y * V.ZOOM);
        this.platformGraphics.position = V.PAN;

        V.ZOOM = nextZoom;

        localStorage.setItem('V.ZOOM', V.ZOOM);
        localStorage.setItem('V.PAN.x', V.PAN.x);
        localStorage.setItem('V.PAN.y', V.PAN.y);
        */
      });


      {
        this.clickArea = new PIXI.Container();
        this.clickArea.interactive = true;
        this.clickArea.cursor = 'grab';
        this.clickArea.hitArea = new PIXI.Rectangle(0, 0, SIZE.w, SIZE.h);
        this.pixiApp.stage.addChild(this.clickArea);

        this.touches = {};

        let pointerdown = ev => {
          this.touches[ev.data.pointerId] = {
            p1: {
              x: ev.data.global.x,
              y: ev.data.global.y,
              zoomBeforePinch: V.ZOOM,
            },
            p2: {
              x: ev.data.global.x,
              y: ev.data.global.y,
            },
          };

          this.clickArea.cursor = 'grabbing';
          this.pointerDownStart = {
            x: ev.data.global.x,
            y: ev.data.global.y,
            panX: V.PAN.x,
            panY: V.PAN.y,
          };
          ev.stopPropagation();
        };

        let pointerup = ev => {
          delete(this.touches[ev.data.pointerId]);

          if(this.pointerDownStart == null) return;

          let clicked = this.pointerDownStart.x == ev.data.global.x && this.pointerDownStart.y == ev.data.global.y;
          if(clicked) {
            this.experiment.clickedOutside && this.experiment.clickedOutside();
          }

          this.clickArea.cursor = 'grab';
          this.pointerDownStart = null;
        };

        if(DEV) {
          this.pixiApp.ticker.add(() => {
            this.setDisplayedData('Touches', `${Object.keys(this.touches).length} (${Object.keys(this.touches).join(',')})`);
          });
        }

        let pointermove = ev => {
          { // pinch zoom
            if(Object.keys(this.touches).length == 2) {
              let movedTouchEventID = ev.data.pointerId;
              let otherTouchEventID = Object.keys(this.touches).filter(id => id != movedTouchEventID)[0];

              if(!otherTouchEventID) {
                console.error("the other touch ID was not found");
                return;
              }

              let otherTouch = this.touches[otherTouchEventID];
              let movedTouch = this.touches[movedTouchEventID];
              movedTouch.p2 = { x: ev.data.global.x, y: ev.data.global.y, }

              let dist1 = Math.round(calcDist(otherTouch.p1, movedTouch.p1));
              let dist2 = Math.round(calcDist(otherTouch.p2, movedTouch.p2));


              let zoomOnScreenCenter = {
                x: (otherTouch.p2.x + movedTouch.p2.x)/2,
                y: (otherTouch.p2.y + movedTouch.p2.y)/2,
              };
              let zoomBeforePinch = otherTouch.p1.zoomBeforePinch; // == movedTouch.p1.zoom

              if(dist1 == 0) dist1 = 1; // avoid divide by 0
              let newZoom = zoomBeforePinch * dist2/dist1;
              updateZoom(newZoom, zoomOnScreenCenter);

              return;
            }
          }


          if(!this.pointerDownStart) return;
          this.touches[ev.data.pointerId] = {
            p1: {
              x: ev.data.global.x,
              y: ev.data.global.y,
              zoomBeforePinch: V.ZOOM,
            },
            p2: {
              x: ev.data.global.x,
              y: ev.data.global.y,
            },
          };

          V.PAN.x = this.pointerDownStart.panX + (ev.data.global.x - this.pointerDownStart.x);
          V.PAN.y = this.pointerDownStart.panY + (ev.data.global.y - this.pointerDownStart.y);
          localStorage.setItem('V.PAN.x', V.PAN.x);
          localStorage.setItem('V.PAN.y', V.PAN.y);
          this.platformGraphics.position = V.PAN;
        };

        this.clickArea.on('pointerdown', pointerdown);
        this.clickArea.on('pointerup', pointerup);
        this.clickArea.on('pointerupoutside', pointerup);
        this.clickArea.on('pointercancel', pointerup);
        this.clickArea.on('pointerout', pointerup);
        this.clickArea.on('pointermove', pointermove);

        this.clickArea.on('touchend', pointerup);
        this.clickArea.on('touchcancel', pointerup);
      }

      {
        this.platformGraphics = new PIXI.Container();
        this.platformGraphics.zIndex = 1;
        // this.platformGraphics.interactive = true;
        this.platformGraphics.position = V.PAN;
        this.platformGraphics.sortableChildren = true;

        // this.platformGraphics.interactive = true;
        // this.platformGraphics.hitArea = new PIXI.Rectangle(0, 0, SIZE.w, SIZE.h);

        this.pixiApp.stage.addChild(this.platformGraphics);
      }

      {
        // displayed data meta box:
        this.metaPixiGraphics = new PIXI.Graphics()
        this.metaPixiGraphics.zIndex = 2;

        this.metaPixiText = new PIXI.Text('', {
          // fontFamily: 'Arial',
          fontSize: MetaOpts.fontSize,
          align: 'left',
          lineHeight: MetaOpts.lineHeight,
          fill: DARK_MODE ? 0xffffff : 0x000000
        });
        this.metaPixiText.position = {
          x: MetaOpts.margin + MetaOpts.padding,
          y: MetaOpts.margin + MetaOpts.padding,
        }
        this.metaPixiGraphics.addChild(this.metaPixiText);
        this.pixiApp.stage.addChild(this.metaPixiGraphics);

        this.pixiApp.ticker.add(() => {
          this.setDisplayedData('Renderer frames/second', `${Math.floor(1/this.deltaTime)}/s`);
        });
      }

      if(DRAW_TRAVERSED_PATH) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = zIndexOf('TraversedPath');
        g.alpha = 0.5;
        // g.beginFill(b.robot.led.toHexDark());
        g.endFill();

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_TRAVERSED_PATH) return;
          forEachObj(this.bodies, b => {
            g.lineStyle(2, b.robot.led.toHexDark());

            let lastPos = null;
            b.posHistory.forEach(p => {
              if(lastPos == null) {
                lastPos = p;
                g.moveTo(+ p.x * V.ZOOM, + p.y * V.ZOOM);
                return;
              }
              // g.drawCircle(+ p.x * V.ZOOM, + p.y * V.ZOOM, 2);
              g.lineStyle(2, p.color);
              g.moveTo(+ lastPos.x * V.ZOOM, + lastPos.y * V.ZOOM);
              g.lineTo(+ p.x * V.ZOOM, + p.y * V.ZOOM);

              {
                g.moveTo(
                  + p.x * V.ZOOM - Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                  + p.y * V.ZOOM - Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                );
                g.lineTo(
                  + p.x * V.ZOOM + Math.cos(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                  + p.y * V.ZOOM + Math.sin(p.angle * Math.PI/180.0 + Math.PI/2) * RADIUS * V.ZOOM * 0.1,
                );
              }

              g.moveTo(+ p.x * V.ZOOM, + p.y * V.ZOOM);
              lastPos = p;
            });

            if(lastPos != null) {
              g.lineStyle(2, b.robot.led.toHex());
              g.lineTo(+ b.body.GetPosition().get_x() * V.ZOOM, + b.body.GetPosition().get_y() * V.ZOOM);
            }
          });
        });
      }

      if(false) { // origin grid
        let g = new PIXI.Graphics()
        g.zIndex = zIndexOf('OriginGrid');
        g.alpha = 0.5;
        g.lastView = null;

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          if(equalZooms(g.lastView, V)) return;
          g.clear();
          g.lineStyle(4, 0x000000);
          g.endFill();

          let s = 10 * _ShapeScale;
          g.moveTo(- s * V.ZOOM, + 0 * V.ZOOM);
          g.lineTo(+ s * V.ZOOM, + 0 * V.ZOOM)

          g.moveTo(+ 0 * V.ZOOM, - s * V.ZOOM);
          g.lineTo(+ 0 * V.ZOOM, + s * V.ZOOM);
        });
      }

      if(DRAW_SHADOW) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = zIndexOf('Shadow');
        g.alpha = 0.3;

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_SHADOW) return;

          forEachObj(this.bodies, b => {

            let shadowOffset = {
              x: + (b.body.GetPosition().get_x() + b.circleRadius*0.25) * V.ZOOM,
              y: + (b.body.GetPosition().get_y() + b.circleRadius*0.25) * V.ZOOM,
            }

            g.beginFill(0x000000)
            g.drawCircle(shadowOffset.x, shadowOffset.y, b.circleRadius * V.ZOOM);
          });
        });
      }

      // update at least once:
      this.destroyFuncs.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyFuncs.push(() => this.pixiApp.destroy());
    }

    // this.physics = new MatterPhysics();
    this.physics = new Box2DPhysics(this.Box2D);
    this.destroyFuncs.push(() => this.physics.destroy());
  }

  setDisplayedData(key, value) {
    if(this.metaData[key] == value) {
      return;
    }

    this.metaData[key] = value;
    let newText = Object
      .keys(this.metaData)
      .sort((a, b) => a.length - b.length)
      .map(key => `${key}: ${this.metaData[key]}`)
      .join('\n');

    if(this.metaPixiText.text == newText) {
      return;
    }

    let textMetricsOld = new PIXI.TextMetrics.measureText(
      this.metaPixiText.text,
      this.metaPixiText.style,
    );

    let textMetricsNew = new PIXI.TextMetrics.measureText(
      newText,
      this.metaPixiText.style,
    );

    if(textMetricsOld.lines.length != textMetricsNew.lines.length) {
      let lineCount = textMetricsNew.lines.length;
      this.metaPixiGraphics.clear();
      if(DARK_MODE) {
        this.metaPixiGraphics.beginFill(0x000000, 0.75);
      } else {
        this.metaPixiGraphics.beginFill(0xffffff, 0.75);
      }
      this.metaPixiGraphics.drawRect(
        MetaOpts.margin, MetaOpts.margin,
        textMetricsNew.width + 2*MetaOpts.padding, MetaOpts.lineHeight*lineCount + 2*MetaOpts.padding,
      );
    }

    this.metaPixiText.text = newText;
  }

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  run(experiment, RobotClass) {
		this.bodies = {};
    this.experiment = experiment;

    let uidCounter = 0;

    experiment.createRobots((pos, robot) => {
        uidCounter++;
        let b = this.physics.circle(pos, RADIUS, uidCounter);
        b.robot = robot;
        b.robot._uid = uidCounter;
        b.robot._phys = b.body;
        b.robot._Box2D = this.Box2D;

        this.bodies[b.robot._uid] = b;
        this.createBodyGraphic(b);
    });

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

    this.experiment.setupGraphics(
      PIXI,
      this.pixiApp,
      this.platformGraphics,
      this.bodies,
      this.bodyIDs,
      this.setDisplayedData.bind(this),
    );

    // if(PERFECT) {
      forEachObj(this.bodies, b => {
        b.robot.setup();
        b.robot._started = true;
      });
    // }

    this.setDisplayedData('Count', `${COUNT} ${COUNT == 1 ? 'robot' : 'robots'}`);
    this.setDisplayedData('Random seed', `${RANDOM_SEED}`);
    this.setDisplayedData('Version', `${VERSION.substr(0, 8)}`);

    {
      /*
      let listener = new this.Box2D.JSContactListener();
      listener.PreSolve = function(contact) { }
      listener.PostSolve = function(contact) { }
      listener.EndContact = function(contact) { }

      listener.BeginContact = (contactPtr) => {
        let contact = this.Box2D.wrapPointer( contactPtr, this.Box2D.b2Contact );
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
          this.setDisplayedData('Duration', `${formatSeconds(virtualSeconds, true)}`);
          if(DEV) {
            this.setDisplayedData('Duration (render)', `${formatSeconds(ourSeconds, true)}`);
          }
          this.setDisplayedData('Simulation speed', `${Math.round(this.speedX*10)/10}x`);
        }

        this.physics.update();

        if(DRAW_TRAVERSED_PATH && frameCount % 30 == 0) {
          let max = 5;
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

          if(MathRandom() < 0.1) {
            r.setup();
            r._started = true;
          }

          /*
          if(this.bodyRobotIsStarted[i] == 1) {
            r.loop();
            r._internal_loop();
            continue;
          }

          if(MathRandom() < 0.1) {
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

        let queryCallback = new this.Box2D.JSQueryCallback();
        queryCallback.ReportFixture = function(fixturePtr) {
          let fixture = this.Box2D.wrapPointer(fixturePtr, this.Box2D.b2Fixture);
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
              let fp = this.Box2D.getPointer(f);
              while(fp) {
                if(f.IsSensor()) {
                  let fd = f.GetFilterData();
                  fd.set_maskBits(CATS.NONE)
                  f.SetFilterData(fd);
                  break;
                }
                f = f.GetNext();
                fp = this.Box2D.getPointer(f);
              }
            }
          }
          */

          /*
          if(frameCount % 1 == 0) {
            for(let i = 0; i < this.bodyIDs.length; i++) {
              let body = this.bodies[this.bodyIDs[i]].body;
              let f = body.GetFixtureList();
              let fp = this.Box2D.getPointer(f);
              while(fp) {
                if(f.IsSensor()) {
                  body.DestroyFixture(f);
                  break;
                }
                f = f.GetNext();
                fp = this.Box2D.getPointer(f);
              }
            }
          }
          */
        }


        // ---
        let aabb = new this.Box2D.b2AABB();
        let lowerBound = new this.Box2D.b2Vec2(0, 0);
        let upperBound = new this.Box2D.b2Vec2(0, 0);

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
          let fp = this.Box2D.getPointer(f);
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
            fp = this.Box2D.getPointer(f);
          }
          */
            /*
            if(!this.filter2) {
              console.log("should be called ONCE");
            this.filter2 = new this.Box2D.b2Filter();
            this.filter2.set_categoryBits(CATS.NEIGHBOR);
            this.filter2.set_maskBits(CATS.ROBOT);
            this.sensorCircleShape = new this.Box2D.b2CircleShape();
            this.sensorCircleShape.set_m_radius(NEIGHBOUR_DISTANCE);
            this.fixtureSensor = new this.Box2D.b2FixtureDef();
            this.fixtureSensor.set_shape(this.sensorCircleShape);
            this.fixtureSensor.set_isSensor(true);
            this.fixtureSensor.set_filter(this.filter2);
            }
            broadcastingBody.body.CreateFixture(this.fixtureSensor);
            // this.Box2D.destroy(filter2);
            // this.Box2D.destroy(sensorCircleShape);
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
            queryCallback.Box2D = this.Box2D;
            this.physics.world.QueryAABB(queryCallback, aabb);
          }
        }

        if(DEV) {
          this.setDisplayedData('message_tx()', messageTxCount);
          this.setDisplayedData('message_tx()/robot', Math.round(messageTxCount/COUNT * 100)/100);
          this.setDisplayedData('message_rx()', messageRxCount);
          this.setDisplayedData('message_rx()/robot', Math.round(messageRxCount/COUNT * 100)/100);
        }

        this.Box2D.destroy(lowerBound);
        this.Box2D.destroy(upperBound);
        this.Box2D.destroy(aabb);
        this.Box2D.destroy(queryCallback);

        if(!recursive) {
          return;
        }

        {
          let time0 = new Date();
          if(false) {
            tickFunc(++frameCount, false);

            setTimeout(() => {
              tickFunc(++frameCount, true);
              let dt = (new Date() - time0)/1000;
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

              if(this.tickBatchCount < 1) this.tickBatchCount = 1;
              //if(this.tickBatchCount > 3) this.tickBatchCount = 3;

              if(DEV) {
                this.setDisplayedData('Tick batch', Math.round(this.tickBatchCount));
              }

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
    switch(b.label) {
      case "Circle Body":
        const g = new PIXI.Graphics();
        g.lastView = null;
        b.g = g;

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
            g.x = + pos.x * V.ZOOM;
            g.y = + pos.y * V.ZOOM;
            g.angle = angle;
            g.zIndex = zIndexOf('Robots');

            if(!b.robot._graphics_must_update) {
              return;
            } else {
              b.robot._updated_graphics();
            }

            g.clear();
            g.removeChildren();

            g.lineStyle(0);
            if(false && b.robot.state == States.JoinedShape) {
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
          this.platformGraphics.addChild(g);
          return;
        }

        const agentGraphicsTick = (b) => {
          let pos = b.position;
          let angle = 0;
          if(!b.position && b.getData) {
            let data = b.getData();
            pos = data.pos;
            angle = data.angle;
          }
          g.x = + pos.x * V.ZOOM;
          g.y = + pos.y * V.ZOOM;
          g.angle = angle;
          g.zIndex = zIndexOf('Robots');

          if(equalZooms(g.lastView, V)) {
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

          if(DARK_MODE) {
            g.beginFill(0x000000);
          } else {
            thickness = 1;
            g.lineStyle(thickness, 0x000000, 0.6); // b.robot.led.toHexDark());
            g.beginFill(0xffffff);
          }

          g.drawCircle(0, 0, b.circleRadius * V.ZOOM - thickness/2);

          g.lineStyle(0);
          if(false && b.robot.state == States.JoinedShape) {
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

          if(V.ZOOM * b.circleRadius > 10) { // line direction indicator
            g.endFill();
            g.lineStyle(b.circleRadius*V.ZOOM*0.25, 0x000000, 0.4);
            // g.lineStyle(b.circleRadius*V.ZOOM*0.25, b.robot.led.toHex(), 1);
            g.moveTo(0, 0);
            g.lineTo(b.circleRadius*V.ZOOM - thickness, 0);
          }

          // legs direction indicator
          if(V.ZOOM * b.circleRadius > 10) {
            g.beginFill(0x000000, 0.4);
            g.lineStyle(0);
            let r = b.circleRadius*V.ZOOM*0.1;
            let R = b.circleRadius*V.ZOOM - r;
            [0, 2/3*Math.PI, 4/3*Math.PI].forEach(a => {
              g.drawCircle(R * Math.cos(a), R * Math.sin(a), r);
            });
          }

          if(true) { // led
            // g.lineStyle(thickness);
            // g.lineStyle(0);
            g.lineStyle(1, 0x000000, 0.5);
            g.beginFill(b.robot.led.toHex());
            g.drawCircle(
              0,
              0,
              b.circleRadius * 0.4 * V.ZOOM,
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

        };
        this.pixiApp.ticker.add(() => {
          if(!agentGraphicsTick) {
            return;
          }
          agentGraphicsTick(b);
        });
        this.platformGraphics.addChild(g);
        break;
    }
  }
}

class Box2DPhysics {
	constructor(Box2D) {
    this.Box2D = Box2D;
		this.currentFrame = 0;
		this.destroyFuncs = [];

		// Box2D-interfacing code
		let gravity = new this.Box2D.b2Vec2(0, 0);
		this.world = new this.Box2D.b2World(gravity);
    window.world = this.world;

    if(false /* edge/wall */) {
      this.edgeShape({x: 0, y: 0}, {x: SIZE.w, y: 0});
      this.edgeShape({x: 0, y: 0}, {x: 0,      y: SIZE.h});

      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: 0, y: SIZE.h});
      this.edgeShape({x: SIZE.w, y: SIZE.h}, {x: SIZE.w, y: 0});
    }
	}

	edgeShape(from, to) {
		let bd_ground = new this.Box2D.b2BodyDef();
		bd_ground.set_type(this.Box2D.b2_staticBody);
		let ground = this.world.CreateBody(bd_ground);
    ground.SetUserData(BODY_ID_IGNORE);
		let shape0 = new this.Box2D.b2EdgeShape();
		shape0.Set(new this.Box2D.b2Vec2(from.x, from.y), new this.Box2D.b2Vec2(to.x, to.y));
		ground.CreateFixture(shape0, 0.0);
	}

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  update() {
    // if(!BENCHMARKING) {
    this.world.Step(1.0/60.0, 8, 3); // 8, 2
    // }
    this.currentFrame++;
  }

	circle(pos, radius, id) {
		let b2bodyDef = new this.Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(20.0);
		b2bodyDef.set_angularDamping(20.0);
    // if(BENCHMARKING) {
    //   b2bodyDef.set_type(this.Box2D.b2_staticBody);
    // } else {
    if(id == 1 || id == 2 || id == 3 || id == 4) {
      b2bodyDef.set_type(this.Box2D.b2_staticBody);
    } else {
      b2bodyDef.set_type(this.Box2D.b2_dynamicBody);
    }
    //   b2bodyDef.set_type(this.Box2D.b2_staticBody);
    // }

    let posVec = new this.Box2D.b2Vec2(pos.x, pos.y);
		b2bodyDef.set_position(posVec);
    this.Box2D.destroy(posVec);

    b2bodyDef.set_bullet(false);

    let filter1 = new this.Box2D.b2Filter();
    filter1.set_categoryBits(CATS.ROBOT);
    filter1.set_maskBits(CATS.ROBOT | CATS.NEIGHBOR);

    if(!this.circleShape) {
      this.circleShape = new this.Box2D.b2CircleShape();
      this.circleShape.set_m_radius(radius);
    }

		let fixtureDef = new this.Box2D.b2FixtureDef();
		fixtureDef.set_density(1.0);
		fixtureDef.set_friction(10);
		fixtureDef.set_restitution(0.0);
		fixtureDef.set_shape(this.circleShape);
    fixtureDef.set_filter(filter1);
    this.Box2D.destroy(filter1);
    // this.Box2D.destroy(this.circleShape);

		let body = this.world.CreateBody(b2bodyDef);
    body.CreateFixture(fixtureDef);
    // ---
    /*
    let filter2 = new this.Box2D.b2Filter();
    filter2.set_categoryBits(CATS.NEIGHBOR);
    filter2.set_maskBits(CATS.NONE);
    let sensorCircleShape = new this.Box2D.b2CircleShape();
    sensorCircleShape.set_m_radius(NEIGHBOUR_DISTANCE);
    let fixtureSensor = new this.Box2D.b2FixtureDef();
    fixtureSensor.set_shape(sensorCircleShape);
    fixtureSensor.set_isSensor(true);
    fixtureSensor.set_filter(filter2);
    body.CreateFixture(fixtureSensor);
    this.Box2D.destroy(filter2);
    this.Box2D.destroy(sensorCircleShape);
    */
		// ---

    body.SetUserData(id);
    let angle = MathRandom() * 2*Math.PI /*Math.PI/2*/;
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
    this.lastMessageSentAt = Math.floor(MathRandom() * 60);
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

function stop() {
  window._state_stop = true;
}
