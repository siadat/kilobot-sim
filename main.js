Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  TOTAL_MEMORY: 1024 * 1024 * 32, // default value is 1024 * 1024 * 16.
}).then(function(Box2D) {
  if(false) {
    let imageEditor = new ImageEditor();
    setTimeout(() => { console.log(JSON.stringify(imageEditor.convert())); }, 500);
    return;
  }

  console.log("Loaded.");

  class ExperimentAssembly {
    constructor() {
      this.selectedUID = null;
    }

    clickedOutside() {
      this.selectedUID = null;
    }

    createRobots(newRobot) {
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
      let bodyCounter = 0;
      [
        {isSeed: true, isRoot: true,  x: 0*INITIAL_DIST/2, y: INITIAL_DIST/2 * 0},
        {isSeed: true, isRoot: false, x: 2*INITIAL_DIST/2, y: INITIAL_DIST/2 * 0},
        {isSeed: true, isRoot: false, x: 1*INITIAL_DIST/2, y: INITIAL_DIST/2 * +Math.sqrt(3)},
        {isSeed: true, isRoot: false, x: 1*INITIAL_DIST/2, y: INITIAL_DIST/2 * -Math.sqrt(3)},
        // {isSeed: false,isRoot: false, x: 1*RADIUS, y: RADIUS * -Math.sqrt(3) - 1*INITIAL_DIST},
        // {isSeed: false,isRoot: false, x: 1*RADIUS, y: RADIUS * -Math.sqrt(3) - 2*INITIAL_DIST},
      ].forEach(shapePos => {
        bodyCounter++;

        if(!PERFECT) {
          // shapePos.x += noise(0.1 * RADIUS);
          // shapePos.y += noise(0.1 * RADIUS);
        }

        newRobot(
          shapePosToPhysPos(shapePos),
          new GradientAndAssemblyRobot({
            isInsideShape: isInsideShape,
            shapePos: shapePos.isSeed ? {x: shapePos.x, y: shapePos.y} : null,
            isGradientSeed: shapePos.isSeed && shapePos.isRoot,
            isSeed: shapePos.isSeed,
          }),
        );
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

      let assemblyCount = COUNT - bodyCounter;
      let gridPosToPhysPos = (gridPos) => {
        let pos = {
          x: (RootSeedPos.x + INITIAL_DIST/2),
          y: (RootSeedPos.y + Math.sqrt(3) * INITIAL_DIST/2 + 2*INITIAL_DIST/2),
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


          if(!true) {
            if(check.y < 0) return null;
          } else {
            let seedAreaWidth = Math.floor(NEIGHBOUR_DISTANCE/INITIAL_DIST) * 2;
            if(check.x < -seedAreaWidth/2 || check.x > +seedAreaWidth/2 || check.y < 0) {
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
          }

          let distToOrigin = calcDist(gridPosToPhysPos(check), gridPosToPhysPos({x: 0, y: 0}));

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

        /*
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
          pos.x += noise(0.2 * RADIUS);
          pos.y += noise(0.2 * RADIUS);
        }

        newRobot(
          pos,
          new GradientAndAssemblyRobot({
            isInsideShape: isInsideShape,
            shapePos: null,
            isSeed: false,
          }),
        );
      }
    }

    setupGraphics(
      PIXI,
      pixiApp,
      platformGraphics,
      bodies,
      bodyIDs,
      setDisplayedData,
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
        pixiApp.ticker.add(() => { agentGraphicsTick(b) });
      }


      if(DRAW_SHAPE_DESCRIPTION) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = zIndexOf('Shape');
        g.alpha = 0.3;
        // g.drawn = false;
        g.lastView = null;


        platformGraphics.addChild(g);
        pixiApp.ticker.add(() => {
          // if(g.drawn) return;
          // else g.drawn = true;

          if(equalZooms(g.lastView, V)) return;
          g.lastView = copyView(V);

          g.clear();
          if(!DRAW_SHAPE_DESCRIPTION) return;

          let highlightJoined = false;

          let shapeMarks = {};
          if(highlightJoined) {
            forEachObj(bodies, b => {
              // if(b.robot._uid != 1) return;
              let p = b.body.GetPosition();
              let i = Math.floor(+(p.get_x() - ShapePosOffset.x)/_ShapeScale);
              let j = Math.floor(-(p.get_y() - ShapePosOffset.y)/_ShapeScale);
              let key = `${ShapeDesc.length - 1 - j}:${i}`;
              shapeMarks[key] = (shapeMarks[key] || 0) + 1
            });
          }

          g.lineStyle(0, 0x000000);

          if(DARK_MODE) {
            g.beginFill(0x000000);
          } else {
            g.beginFill(0x888888);
          }

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
                +V.ZOOM * x,
                +V.ZOOM * y - V.ZOOM * _ShapeScale,
                +(V.ZOOM * _ShapeScale - 1),
                +(V.ZOOM * _ShapeScale - 1),
              );
            }
          }
        });
      }

      if(DRAW_LOCALIZATION_ERROR) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = zIndexOf('LocalizationError');
        g.alpha = 0.75; // 0.25;
        let color = 0x008400; // 0xff0000

        platformGraphics.addChild(g);
        pixiApp.ticker.add(() => {
          g.clear();
          if(!DRAW_LOCALIZATION_ERROR) return;

          // let errorMagnitude = 0;
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
              x: + pos.x * V.ZOOM,
              y: + pos.y * V.ZOOM,
            }
            let posEstimated = {
              x: + (RootSeedPos.x + shapePos.x) * V.ZOOM,
              y: + (RootSeedPos.y + shapePos.y) * V.ZOOM,
            }
            let dist = calcDist(posActual, posEstimated);
            // errorMagnitude += dist
            if(dist < RADIUS*V.ZOOM) correctlyLocalizedCount++;

            if(this.selectedUID && this.selectedUID != b.robot._uid)
              return;

            const MAX = 100000;
            if(posEstimated.x > +MAX) posEstimated.x = +MAX;
            if(posEstimated.x < -MAX) posEstimated.x = -MAX;
            if(posEstimated.y > +MAX) posEstimated.y = +MAX;
            if(posEstimated.y < -MAX) posEstimated.y = -MAX;

            let thickness = RADIUS*V.ZOOM * 0.2; // 2
            color = 0xff0000; // b.robot.led.toHexDark();
            g.endFill();
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
          // let errMag = errorMagnitude/Object.keys(bodies).length/RADIUS;
          // setDisplayedData('Avg localization err', `${Math.round(errMag * 10)/10} radius`);
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

          g.lineStyle(V.ZOOM * RADIUS/4/4, 0xffffff);
          bodyPositions.forEach(p => {
            g.moveTo(
              + b.body.GetPosition().get_x()*V.ZOOM,
              + b.body.GetPosition().get_y()*V.ZOOM,
            );
            g.lineTo(
              + p.get_x()*V.ZOOM,
              + p.get_y()*V.ZOOM,
            );
          });


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
              + p1.get_x()*V.ZOOM,
              + p1.get_y()*V.ZOOM,
            );
            g.lineTo(
              + p2.get_x()*V.ZOOM,
              + p2.get_y()*V.ZOOM,
            );
          });
        });
      }

      {
        if(DRAW_CONNS_AND_BOUNDS) {
          let connGraphics = new PIXI.Graphics()
          connGraphics.zIndex = zIndexOf('ConnsAndBouns');
          connGraphics.alpha = 0.5;
          platformGraphics.addChild(connGraphics);
          pixiApp.ticker.add(() => {
            connGraphics.clear();
            if(!DRAW_CONNS_AND_BOUNDS) return;

            let bounds = [];
            for(let i = 0; i < bodyIDs.length; i++) {
              if(this.selectedUID != null && this.selectedUID != bodyIDs[i]) {
                continue;
              }
              let body = bodies[bodyIDs[i]].body;
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
                + V.ZOOM * (bound.aabb.get_lowerBound().get_x()),
                + V.ZOOM * (bound.aabb.get_lowerBound().get_y()),
                V.ZOOM * (bound.aabb.get_upperBound().get_x() - bound.aabb.get_lowerBound().get_x()),
                V.ZOOM * (bound.aabb.get_upperBound().get_y() - bound.aabb.get_lowerBound().get_y()),
              );
            });

            /*
            this.connections.forEach(conn => {
              if(this.selectedUID != null && (this.selectedUID != conn.from)) { // && this.selectedUID != conn.to
                return;
              }
              let pos1 = bodies[conn.from].body.GetPosition();
              let pos2 = bodies[conn.to].body.GetPosition();
              connGraphics.lineStyle(V.ZOOM * RADIUS/4, bodies[conn.from].robot.led.toHex());
              connGraphics.moveTo(+ pos1.get_x() * V.ZOOM, + pos1.get_y() * V.ZOOM);
              connGraphics.lineTo(+ pos2.get_x() * V.ZOOM, + pos2.get_y() * V.ZOOM);
            });
            */

          });
        }
      }
    }
  }

  let pitch = new Pitch(Box2D);
  window.pitch = pitch;
  pitch.run(new ExperimentAssembly(), GradientAndAssemblyRobot); // .then(pitch.destroy());
  // pitch.run(RobotLab0, experimentAssembly); // .then(pitch.destroy());
});
