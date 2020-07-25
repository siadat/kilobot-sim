const RADIUS = 1; // best performance
const NEIGHBOUR_DISTANCE = 11 * RADIUS;
const DAMPING = 1000;

const TICKS_BETWEEN_MSGS = 30/2;
const TICKS_BETWEEN_AMB_LIGHT = 5;
const LOOP_PER_SECOND = 30;
const lightColor = 0xffff00;
const graphColor = 0xb83c3a;
const selectedColor = 0xb83c3a;

let DRAW_SHADOW = !false;
let DRAW_CONNS_AND_BOUNDS = false;
let BENCHMARKING = true;


const DEV = false;
const SIZE = () => {
  let s = {
    w: window.innerWidth,
    h: window.innerHeight,
  };
  console.log("SIZE func", s);
  return s;
}

const ContinueQuery = true;
const StopQuery = false;
const BODY_ID_IGNORE = 0;

const calcDist = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
}

export class Pitch {
  constructor(Box2D, perfectStart, randomSeed) {
    this.Box2D = Box2D;

    this.destroyFuncs = [];
    this.selectedUID = null;

    this.lightSources = [];
    this.connections = [];
    this.deltaTime = null;
    this.speedX = null;
    this.fps = 60;
    this.metaData = {};
    this.tickBatchCount = 1;
    this.randomSeed = randomSeed;
    this.MathRandom = new Math.seedrandom(this.randomSeed);
    this.perfectStart = perfectStart;
    this.LayersOrder = [
      '_Origin',
      '_Shadow',
      '_TraversedPath',
      '_Robots',
      '_LightSources',
      '_Selection',
    ];

    if(true) {
      localStorage.setItem('V.ZOOM', 1 * Math.max(SIZE().w, SIZE().h) / (60 * 2*RADIUS));
      localStorage.setItem('V.PAN.x', SIZE().w * 0.5);
      localStorage.setItem('V.PAN.y', SIZE().h * 0.5);
    }

    this.V = {
      PAN: {
        x: (1*localStorage.getItem('V.PAN.x')) || SIZE().w*0.5,
        y: (1*localStorage.getItem('V.PAN.y')) || SIZE().h*0.5,
      },
      ZOOM: (1*localStorage.getItem('V.ZOOM')) || 20.0,
    };

  }

  setDrawConnsAndBounds(v) {
    DRAW_CONNS_AND_BOUNDS = v;
  }

  // setDarkMode(v) {
  //   this.darkMode = v;
  // }

  setDrawShadow(v) {
    DRAW_SHADOW = v;
  }

  getLayersOrder() {
    return this.LayersOrder;
  }

  setLayersOrder(v) {
    this.LayersOrder = v;
  }

  zIndexOf(name) {
    let zIndex = this.LayersOrder.indexOf(name);
    if(zIndex == -1) {
      console.error(`name=${name} not found in order list`, this.LayersOrder);
    }
    return zIndex;
  }

  setDisplayedData(key, value, options) {
    options = Object.assign({
      graph: false,
    }, options)

    let maxHistory = 2*70;
    if(value == null) {
      delete(this.metaData[key]);

      if(this.metaGraphs[key]) {
        this.metaGraphs[key].removeChildren();
        this.metaContainer.removeChild(this.metaGraphs[key]);
        this.metaGraphs[key].destroy(true);
        delete(this.metaGraphs[key]);
      }
    } else if(options.graph) {
      if(!this.metaData[key]) {
        this.metaData[key] = [];
      }
      this.metaData[key].push(value);
      if(this.metaData[key].length > maxHistory) {
        this.metaData[key] = this.metaData[key].slice(this.metaData[key].length - maxHistory, this.metaData[key].length);
      }
    } else {
      if(this.metaData[key] == value) {
        return;
      } else {
        this.metaData[key] = value;
      }
    }

    let newText = Object
      .keys(this.metaData)
      .filter(k => !Array.isArray(this.metaData[k]))
      .sort()
      .map(k => {
        let v = this.metaData[k];
        if(Array.isArray(this.metaData[k]) && this.metaData[k].length > 0) {
          let idx = this.metaData[k].length - 1;
          v = this.metaData[k][idx];
          v = Math.round(v * 100)/100.0;
        }
        return `${k}: ${v}`
      })
      .join('\n');

    // if(this.metaPixiText.text == newText) return;

    let textMetricsOld = new PIXI.TextMetrics.measureText(
      this.metaPixiText.text,
      this.metaPixiText.style,
    );

    let textMetricsNew = new PIXI.TextMetrics.measureText(
      newText,
      this.metaPixiText.style,
    );

    let width = textMetricsNew.width;
    if(width < 130)
      width = 130;

    if(
      textMetricsOld.width != width
      ||
      textMetricsOld.lines.length != textMetricsNew.lines.length
      ||
      this.metaContainer.lastDarkMode != this.darkMode
    ) {
      let lineCount = textMetricsNew.lines.length;
      this.metaContainer.clear();
      if(this.darkMode) {
        this.metaContainer.beginFill(0x000000, 0.75);
        this.metaPixiText.style.fill = 0xcccccc;
      } else {
        this.metaContainer.beginFill(0xffffff, 0.75);
        this.metaPixiText.style.fill = 0x000000;
      }
      this.metaContainer.drawRect(
        MetaOpts.margin, MetaOpts.margin,
        width + 2*MetaOpts.padding, MetaOpts.lineHeight*lineCount + 2*MetaOpts.padding,
      );
      this.metaContainer.lastDarkMode = this.darkMode;
    }

    this.metaPixiText.text = newText;

    this.metaGraphs = this.metaGraphs || {};

    let top = textMetricsNew.height + 1*MetaOpts.margin + 2*MetaOpts.padding;
    let h = 70;
    let w = width + 2*MetaOpts.padding;

    Object
      .keys(this.metaData)
      .filter(k => Array.isArray(this.metaData[k]))
      .sort()
      .forEach((k, idx) => {
        let value = this.metaData[k];
        if(!this.metaGraphs[k]) {
          this.metaGraphs[k] = new PIXI.Graphics();;

          let txt = new PIXI.Text(k, {
            // fontFamily: 'Arial',
            fontSize: MetaOpts.fontSize,
            align: 'left',
            lineHeight: MetaOpts.lineHeight,
            fill: this.darkMode ? 0xffffff : 0x000000
          });
          txt.position = {
            x: MetaOpts.padding, // MetaOpts.margin + MetaOpts.padding,
            y: MetaOpts.padding, // MetaOpts.margin + MetaOpts.padding,
          }

          this.metaGraphs[k].addChild(txt);
          this.metaContainer.addChild(this.metaGraphs[k]);
        } else if(value == null) {
          this.metaGraphs[k].removeChildren();
          this.metaContainer.removeChild(this.metaGraphs[k]);
          this.metaGraphs[k].destroy(true);
          delete(this.metaGraphs[k]);
        } else {
          this.metaGraphs[k].clear();
          // this.metaGraphs[k].removeChildren();

          this.metaGraphs[k].position.x = MetaOpts.margin;
          this.metaGraphs[k].position.y = MetaOpts.margin + top + idx * (h + MetaOpts.padding);

          this.metaGraphs[k].lineStyle(0);
          this.metaGraphs[k].beginFill(this.darkMode ? 0x000000 : 0xffffff, 0.5);
          this.metaGraphs[k].drawRect(0, 0, w, h);

          let thickness = w/maxHistory;
          if(thickness < 1) thickness = 1;
          this.metaGraphs[k].endFill();
          let min = Math.min.apply(null, this.metaData[k]);
          let max = Math.max.apply(null, this.metaData[k]);

          let lastV = null;
          for(let i = 0; i < this.metaData[k].length; i++) {
            let x = w * (i + maxHistory-this.metaData[k].length)/maxHistory + thickness*0.5;
            let v = this.metaData[k][i];
            let y = h - h*(v-min)/(max-min);

            this.metaGraphs[k].lineStyle(thickness, graphColor, 1);
            this.metaGraphs[k].moveTo(x, h);
            this.metaGraphs[k].lineTo(x, y);

            // this.metaGraphs[k].lineStyle(thickness, lightColor, 1.0);
            // this.metaGraphs[k].moveTo(x, y);
            // this.metaGraphs[k].lineTo(x, y-1);

            if(lastV != null) {
              if(v > lastV) {
                this.metaGraphs[k].lineStyle(thickness, 0x33ff66, 0.5);
                this.metaGraphs[k].moveTo(x, h+10);
                this.metaGraphs[k].lineTo(x, 0-10);
              } else if(v < lastV) {
                this.metaGraphs[k].lineStyle(thickness, 0xff6633, 0.5);
                this.metaGraphs[k].moveTo(x, h+10);
                this.metaGraphs[k].lineTo(x, 0-10);
              }
            }
            lastV = v;
          }
        }
      });
  }

  destroy() {
    this.destroyFuncs.forEach(cb => cb());
  }

  forEachBody(f) {
    for(let i = 0; i < this.bodyIDs.length; i++) {
      let id = this.bodyIDs[i];
      f(this.bodies[id], id, i)
    }
  }

  setup() {
    if(true /*graphical*/) {
      PIXI.utils.skipHello();
      this.pixiApp = new PIXI.Application({
        backgroundColor: 0xffffff,
        autoStart: true,
        width: SIZE().w,
        height: SIZE().h,
        antialias: !false,
      });
      this.pixiApp.sortableChildren = true;
      // this.pixiApp.interactive = true;
      window.pixiApp = this.pixiApp;
      document.body.appendChild(this.pixiApp.view);


      let updateZoom = (nextZoom, screenCenter) => {
        if(nextZoom < 2) nextZoom = 2;
        if(nextZoom > 40) nextZoom = 40;

        let centerWithoutZoom = {
          // x: (this.V.PAN.x-SIZE().w/2)/this.V.ZOOM,
          // y: (this.V.PAN.y-SIZE().h/2)/this.V.ZOOM,
          x: (this.V.PAN.x - screenCenter.x)/this.V.ZOOM,
          y: (this.V.PAN.y - screenCenter.y)/this.V.ZOOM,
        }

        this.V.PAN.x += (centerWithoutZoom.x * nextZoom - centerWithoutZoom.x * this.V.ZOOM);
        this.V.PAN.y += (centerWithoutZoom.y * nextZoom - centerWithoutZoom.y * this.V.ZOOM);
        this.platformGraphics.position = this.V.PAN;

        this.V.ZOOM = nextZoom;

        localStorage.setItem('V.ZOOM', this.V.ZOOM);
        localStorage.setItem('V.PAN.x', this.V.PAN.x);
        localStorage.setItem('V.PAN.y', this.V.PAN.y);
      }

      this.pixiApp.view.addEventListener('mousewheel', ev => {
        let nextZoom = this.V.ZOOM * (1 + ev.wheelDelta/1000.0);
        updateZoom(nextZoom, {
          x: ev.clientX,
          y: ev.clientY,
        });

        /*
        let centerWithoutZoom = {
          // x: (this.V.PAN.x-SIZE().w/2)/this.V.ZOOM,
          // y: (this.V.PAN.y-SIZE().h/2)/this.V.ZOOM,
          x: (this.V.PAN.x - ev.clientX)/this.V.ZOOM,
          y: (this.V.PAN.y - ev.clientY)/this.V.ZOOM,
        }

        this.V.PAN.x += (centerWithoutZoom.x * nextZoom - centerWithoutZoom.x * this.V.ZOOM);
        this.V.PAN.y += (centerWithoutZoom.y * nextZoom - centerWithoutZoom.y * this.V.ZOOM);
        this.platformGraphics.position = this.V.PAN;

        this.V.ZOOM = nextZoom;

        localStorage.setItem('V.ZOOM', this.V.ZOOM);
        localStorage.setItem('V.PAN.x', this.V.PAN.x);
        localStorage.setItem('V.PAN.y', this.V.PAN.y);
        */
      });


      {
        this.clickArea = new PIXI.Container();
        this.clickArea.interactive = true;
        this.clickArea.cursor = 'grab';
        this.clickArea.hitArea = new PIXI.Rectangle(0, 0, SIZE().w, SIZE().h);
        this.pixiApp.stage.addChild(this.clickArea);

        this.touches = {};

        let pointerdown = ev => {
          this.touches[ev.data.pointerId] = {
            p1: {
              x: ev.data.global.x,
              y: ev.data.global.y,
              zoomBeforePinch: this.V.ZOOM,
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
            panX: this.V.PAN.x,
            panY: this.V.PAN.y,
          };
          ev.stopPropagation();
        };

        let pointerup = ev => {
          delete(this.touches[ev.data.pointerId]);

          if(this.pointerDownStart == null) return;

          let clicked = this.pointerDownStart.x == ev.data.global.x && this.pointerDownStart.y == ev.data.global.y;
          if(clicked) {
            if(this.selectedUID != null) {
              this.bodies[this.selectedUID].robot._graphics_must_update  = true;
            }
            this.selectedUID = null;
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
              zoomBeforePinch: this.V.ZOOM,
            },
            p2: {
              x: ev.data.global.x,
              y: ev.data.global.y,
            },
          };

          this.V.PAN.x = this.pointerDownStart.panX + (ev.data.global.x - this.pointerDownStart.x);
          this.V.PAN.y = this.pointerDownStart.panY + (ev.data.global.y - this.pointerDownStart.y);
          localStorage.setItem('V.PAN.x', this.V.PAN.x);
          localStorage.setItem('V.PAN.y', this.V.PAN.y);
          this.platformGraphics.position = this.V.PAN;
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
        this.platformGraphics.position = this.V.PAN;
        this.platformGraphics.sortableChildren = true;

        // this.platformGraphics.interactive = true;
        // this.platformGraphics.hitArea = new PIXI.Rectangle(0, 0, SIZE().w, SIZE().h);

        this.pixiApp.stage.addChild(this.platformGraphics);
      }

      {
        // displayed data meta box:
        this.metaContainer = new PIXI.Graphics()
        this.metaContainer.zIndex = 2;

        this.metaPixiText = new PIXI.Text('', {
          // fontFamily: 'Arial',
          fontSize: MetaOpts.fontSize,
          align: 'left',
          lineHeight: MetaOpts.lineHeight,
          fill: this.darkMode ? 0xffffff : 0x000000
        });
        this.metaPixiText.position = {
          x: MetaOpts.margin + MetaOpts.padding,
          y: MetaOpts.margin + MetaOpts.padding,
        }
        this.metaContainer.addChild(this.metaPixiText);
        this.pixiApp.stage.addChild(this.metaContainer);

        // this.pixiApp.ticker.add(() => {
        //   this.setDisplayedData('Renderer frames/second', `${Math.floor(1/this.deltaTime)}/s`);
        // });

        // // speed diagram
        // this.graph = new PIXI.Graphics()
        // this.graph.zIndex = 2;
        // this.graph.position = {x: 0, y: 0};
        // this.metaContainer.addChild(this.graph);
      }

      {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = this.zIndexOf('_TraversedPath');
        g.alpha = 0.3;
        // g.beginFill(toHexDark(b.robot.led));
        g.endFill();

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();
          if(!this.experiment.runnerOptions.traversedPath) return;
          this.forEachBody(b => {
            g.lineStyle(2, toHexDark(b.robot.led));

            let lastPosX = null;
            let lastPosY = null;
            let len = b.posHistoryX.length;

            let indexFirst = 0;
            let indexLast = b.posHistoryCursor;

            if(b.posHistoryFilled) {
              indexFirst = (b.posHistoryCursor + 1) % len;
              indexLast = b.posHistoryCursor;
            }

            // if(b.robot.kilo_uid == 1) {
            //   console.log(indexFirst, indexLast, b.posHistoryFilled, len);
            // }

            let counter = 0;
            for(let i = indexFirst; (i%len) != indexLast; i++) {
              counter += 1.0/len;
              let index = i % len;
              let px = b.posHistoryX[index];
              let py = b.posHistoryY[index];
              let color = b.posHistoryColor[index];
              let angle = b.posHistoryAngle[index];

              if(lastPosX == null) {
                lastPosX = px;
                lastPosY = py;
                g.moveTo(+ px * this.V.ZOOM, + py * this.V.ZOOM);
                continue;
              }
              // g.drawCircle(+ px * this.V.ZOOM, + py * this.V.ZOOM, 2);
              g.lineStyle(counter * RADIUS * this.V.ZOOM, color);
              g.moveTo(+ lastPosX * this.V.ZOOM, + lastPosY * this.V.ZOOM);
              g.lineTo(+ px * this.V.ZOOM, + py * this.V.ZOOM);

              /*
              {
                g.moveTo(
                  + px * this.V.ZOOM - Math.cos(angle * Math.PI/180.0 + Math.PI/2) * RADIUS * this.V.ZOOM * 0.1,
                  + py * this.V.ZOOM - Math.sin(angle * Math.PI/180.0 + Math.PI/2) * RADIUS * this.V.ZOOM * 0.1,
                );
                g.lineTo(
                  + px * this.V.ZOOM + Math.cos(angle * Math.PI/180.0 + Math.PI/2) * RADIUS * this.V.ZOOM * 0.1,
                  + py * this.V.ZOOM + Math.sin(angle * Math.PI/180.0 + Math.PI/2) * RADIUS * this.V.ZOOM * 0.1,
                );
              }
              */

              lastPosX = px;
              lastPosY = py;
              g.moveTo(+ px * this.V.ZOOM, + py * this.V.ZOOM);
            }

            if(lastPosX != null) {
              g.lineStyle(counter * RADIUS * this.V.ZOOM, toHex(b.robot.led));
              g.lineTo(+ b.body.GetPosition().get_x() * this.V.ZOOM, + b.body.GetPosition().get_y() * this.V.ZOOM);
            }
          });
        });
      }

      { // light sources
        let g = new PIXI.Graphics()
        g.alpha = 0.75;
        g.lastLightSources = JSON.stringify(this.lightSources);

        /*
        g.clickArea.cursor = 'grab';
        g.on('pointerdown', (ev) => {
          g.clickArea.cursor = 'grabbing';
          g.startPos = {
            x: ev.data.global.x,
            y: ev.data.global.y,
          };
          g.startTouch = {
            x: ev.data.global.x,
            y: ev.data.global.y,
          };
        });

        g.on('pointermove', (ev) => {
          g.clickArea.cursor = 'grab';

          g.position.x = ev.data.global.x

          delete(g.startTouch);
        });
        */

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          if(g.lastLightSources == JSON.stringify(this.lightSources))
            return;

          g.clear();
          g.zIndex = this.zIndexOf('_LightSources');

          let count = 6;
          let r = 2 * RADIUS;

          // g.beginFill(0x0fBfF0, 1);
          g.beginFill(lightColor, 1);
          this.lightSources.forEach(ls => {
            // g.lineStyle(0);
            // g.drawCircle(
            //   ls.pos.x * this.V.ZOOM,
            //   ls.pos.y * this.V.ZOOM,
            //   2 * RADIUS * this.V.ZOOM,
            // );

            for(let i = 0; i < count; i++) {

              g.lineStyle(0.5*RADIUS*this.V.ZOOM, lightColor);

              // if(i % 2 == 0) { g.lineStyle(0.5*RADIUS*this.V.ZOOM, lightColor); }

              g.moveTo(
                (ls.pos.x-r*Math.cos(i/count * Math.PI)) * this.V.ZOOM,
                (ls.pos.y-r*Math.sin(i/count * Math.PI)) * this.V.ZOOM,
              );

              g.lineTo(
                (ls.pos.x+r*Math.cos(i/count * Math.PI)) * this.V.ZOOM,
                (ls.pos.y+r*Math.sin(i/count * Math.PI)) * this.V.ZOOM,
              );
            }
          });
        });
      }

      if(!true) { // origin grid
        let g = new PIXI.Graphics()
        g.zIndex = this.zIndexOf('_Origin');
        g.alpha = 0.5;
        // g.lastView = null;

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          // if(equalZooms(g.lastView, this.V)) return;
          g.clear();
          g.endFill();

          let s = 1;
          let max = 30;
          for(let i = -max; i <= max; i++) {
            if(i % 5 == 0) {
              g.lineStyle(0.5*0.2*this.V.ZOOM, 0x000000);
            } else {
              g.lineStyle(0.5*0.1*this.V.ZOOM, 0x000000);
            }
            if(i == 0) {
              g.lineStyle(0.5*0.4*this.V.ZOOM, 0x000000);
            }

            g.moveTo(-max * s * this.V.ZOOM, i*s*this.V.ZOOM);
            g.lineTo(+max * s * this.V.ZOOM, i*s*this.V.ZOOM)

            g.moveTo(i*s*this.V.ZOOM, -max * s * this.V.ZOOM);
            g.lineTo(i*s*this.V.ZOOM, +max * s * this.V.ZOOM);
          }
        });
      }

      {
        let g = new PIXI.Graphics()
        g.zIndex = this.zIndexOf('_Selection');
        g.alpha = 0.9;

        let counter = 0;

        // this.metaContainer.addChild(g);
        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          g.clear();

          if(!this.selectedUID) {
            return;
          }
          counter++;
          let b = this.bodies[this.selectedUID];

          let pos = b.position;
          let angle = 0;
          if(!b.position && b.getData) {
            let data = b.getData();
            pos = data.pos;
            angle = data.angle;
          }

          // g.endFill();
          // g.lineStyle((0.5 + Math.sin(10 * Math.PI * counter/360)*0.2) * this.V.ZOOM, selectedColor, 1);
          // g.drawCircle(
          //   /*this.V.PAN.x + */ pos.x * this.V.ZOOM,
          //   /*this.V.PAN.y + */ pos.y * this.V.ZOOM,
          //   (2 * b.circleRadius + 0) * this.V.ZOOM
          // );

          g.lineStyle(0.5 * this.V.ZOOM, selectedColor, 1);
          // g.beginFill(selectedColor, 0.9);
          for(let a = 0, count = 8; a < 2*Math.PI;) {
            let r = (2 * b.circleRadius);
            g.moveTo(
              (pos.x + Math.cos(a) * r) * this.V.ZOOM,
              (pos.y + Math.sin(a) * r) * this.V.ZOOM,
            );

            a += (2*Math.PI * 1/count) * 0.25;
            g.lineTo(
              (pos.x + Math.cos(a) * r) * this.V.ZOOM,
              (pos.y + Math.sin(a) * r) * this.V.ZOOM,
            );

            a += (2*Math.PI * 1/count) * 0.25;
          }
        });
      }


      // TODO: create a layer here, but move drawing's to the robot's graphics loop
      if(DRAW_SHADOW) {
        // position vectors
        let g = new PIXI.Graphics()
        g.zIndex = this.zIndexOf('_Shadow');
        g.alpha = 0.25;
        g.graphicShadoes = {};

        this.platformGraphics.addChild(g);
        this.pixiApp.ticker.add(() => {
          if(g.children.length == 0) {
            this.forEachBody(b => {
              this.lightSources.forEach((_, i) => {
                let gsh = new PIXI.Graphics()
                let key = `${b.robot._uid}:${i}`;
                gsh.beginFill(0x000000, 1.0);
                gsh.drawCircle(0, 0, b.circleRadius);
                g.graphicShadoes[key] = gsh;
                g.addChild(gsh);
              });
            });
          }

          this.forEachBody(b => {
            this.lightSources.forEach((ls, i) => {
              let key = `${b.robot._uid}:${i}`;
              let gsh = g.graphicShadoes[key];

              // let gsh = new PIXI.Graphics()

              let pos = {
                x: b.body.GetPosition().get_x(),
                y: b.body.GetPosition().get_y(),
              };

              let dx = pos.x - ls.pos.x;
              let dy = pos.y - ls.pos.y;
              let d = Math.sqrt(dx*dx + dy*dy);
              if(d < 1) d = 1; // do not scale up

              let scale = d * 0.1;
              if(scale < 1) scale = 1;
              else if(scale > 1000) scale = 1000;

              gsh.scale.x = scale * this.V.ZOOM;
              gsh.scale.y = this.V.ZOOM;
              gsh.angle = Math.atan(dy/dx) * 180 / Math.PI;
              gsh.alpha = 2/scale;

              let newWidth = scale * b.circleRadius * this.V.ZOOM;

              gsh.position.x = pos.x*this.V.ZOOM + (dx/d)*newWidth - (dx/d)*b.circleRadius * this.V.ZOOM;
              gsh.position.y = pos.y*this.V.ZOOM + (dy/d)*newWidth - (dy/d)*b.circleRadius * this.V.ZOOM;

            });
          });
        });
      }

      {
        if(DRAW_CONNS_AND_BOUNDS) {
          let connGraphics = new PIXI.Graphics()
          connGraphics.zIndex = this.zIndexOf('ConnsAndBouns');
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
                + this.V.ZOOM * (bound.aabb.get_lowerBound().get_x()),
                + this.V.ZOOM * (bound.aabb.get_lowerBound().get_y()),
                this.V.ZOOM * (bound.aabb.get_upperBound().get_x() - bound.aabb.get_lowerBound().get_x()),
                this.V.ZOOM * (bound.aabb.get_upperBound().get_y() - bound.aabb.get_lowerBound().get_y()),
              );
            });

            /*
          this.connections.forEach(conn => {
            if(this.selectedUID != null && (this.selectedUID != conn.from)) { // && this.selectedUID != conn.to
              return;
            }
            let pos1 = bodies[conn.from].body.GetPosition();
            let pos2 = bodies[conn.to].body.GetPosition();
            connGraphics.lineStyle(this.V.ZOOM * RADIUS/4, toHex(bodies[conn.from].robot.led));
            connGraphics.moveTo(+ pos1.get_x() * this.V.ZOOM, + pos1.get_y() * this.V.ZOOM);
            connGraphics.lineTo(+ pos2.get_x() * this.V.ZOOM, + pos2.get_y() * this.V.ZOOM);
          });
          */

          });
        }
      }

      // update at least once:
      this.destroyFuncs.push(() => this.pixiApp.ticker.update());
      // destroy
      this.destroyFuncs.push(() => this.pixiApp.destroy());
    }

    this.physics = new Box2DPhysics(this.Box2D, this.MathRandom);
    this.destroyFuncs.push(() => this.physics.destroy());
  }

  run(experiment) {
    this.setup();

    this.bodies = {};
    this.experiment = experiment;
    this.experiment.runnerOptions = Object.assign({
      limitSpeed: false,
      traversedPath: false,
      traversedPathLen: 20,
      darkMode: false,
      selectedUID: null,
    }, this.experiment.runnerOptions);

    this.darkMode = this.experiment.runnerOptions.darkMode;
    this.pixiApp.renderer.backgroundColor = this.darkMode ? 0x111111 : 0xeeeeee;

    this.selectedUID = this.experiment.runnerOptions.selectedUID;

    this.experiment.V = this.V;
    this.experiment.equalZooms = equalZooms;
    this.experiment.copyView = copyView;
    let uidCounter = 0;

    let newLightFunc = (pos) => {
      this.lightSources.push({
        pos: pos,
        // intensity: intensity,
      })
    }

    let newRobotFunc = (pos, angle, robot) => {
        uidCounter++;
        let b = this.physics.circle(pos, angle, RADIUS, uidCounter);
        b.robot = robot;
        b.robot._uid = uidCounter;
        b.robot._phys = b.body;
        b.robot._Box2D = this.Box2D;
        b.robot._MathRandom = this.MathRandom;
        b.robot._RADIUS = RADIUS;
        b.robot._DAMPING = DAMPING;
        // b.robot._err_message_sending = this.MathRandom();
        // b.robot._PERFECT = this.perfectStart;
        b.robot._LOOP_PER_SECOND = LOOP_PER_SECOND ;
        if(false && this.experiment.runnerOptions.traversedPath) {
          let max = this.experiment.runnerOptions.traversedPathLen;
          b.posHistoryCursor = -1;
          b.posHistoryFilled = false;
          b.posHistoryX = new Float64Array(max);
          b.posHistoryY = new Float64Array(max);
          b.posHistoryAngle = new Float64Array(max);
          b.posHistoryColor = new Array(); // string
        }

        this.bodies[b.robot._uid] = b;
        this.createBodyGraphic(b);
    };
    experiment.createRobots(
      newRobotFunc,
      newLightFunc,
      RADIUS,
      NEIGHBOUR_DISTANCE,
      TICKS_BETWEEN_MSGS,
      // LOOP_PER_SECOND,
    );

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

    this.experiment.setupGraphics && this.experiment.setupGraphics(
      PIXI,
      Box2D,
      this.pixiApp,
      this.platformGraphics,
      this.bodies,
      this.bodyIDs,
      this.setDisplayedData.bind(this),
      this.zIndexOf.bind(this),
      this.V,
    );

    if(this.perfectStart) {
      this.forEachBody(b => {
        b.robot.setup();
        b.robot._started = true;
      });
    }
      /*
    for(let i = 0; i < this.bodyIDs.length; i++) {
      let b = this.bodies[this.bodyIDs[i]];
      b.toStartAt = 5 + (this.perfectStart ? 0 : Math.floor(30 * this.MathRandom()));
    }
    for(let i = 0; i < this.bodyIDs.length; i++) {
      let b = this.bodies[this.bodyIDs[i]];

      if(b.toStartAt == this.frameCount) {
        b.robot.setup();
        b.robot._started = true;
      }

      if(b.robot._started) {
        b.robot.loop();
        b.robot._internal_loop();
        continue;
      }

    }
    */


    this.setDisplayedData('Count', `${this.bodyIDs.length} ${this.bodyIDs.length == 1 ? 'robot' : 'robots'}`);
    this.setDisplayedData('Random seed', `${this.randomSeed}`);
    this.setDisplayedData('Version', `${VERSION.substr(0, 8)}`);
    console.log(VERSION);

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
        }

        if(fixtureB.IsSensor()) {
        }

        return;
      }
      this.physics.world.SetContactListener(listener);
      */
    }

    // let messageTxCount = 0;
    // let messageRxCount = 0;

    this.aabb = new this.Box2D.b2AABB();
    this.lowerBound = new this.Box2D.b2Vec2(0, 0);
    this.upperBound = new this.Box2D.b2Vec2(0, 0);

    this.queryCallback = new this.Box2D.JSQueryCallback();
    this.queryCallback.ReportFixture = function(fixturePtr) {
      let fixture = this.Box2D.wrapPointer(fixturePtr, this.Box2D.b2Fixture);
      let id = fixture.GetBody().GetUserData();
      if(id == BODY_ID_IGNORE) {
        return ContinueQuery;
      }
      sendMessage(this.broadcastingBody, id, this.message);
      return ContinueQuery;
    }

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

      // if(this.MathRandom() > 0.95) {
      //   distance += (this.MathRandom()-0.5) * 0.1 * distance;
      // }

      // messageRxCount++;
      receiverBody.robot.message_rx(message, distance);

      if(DRAW_CONNS_AND_BOUNDS) {
        this.connections.push({
          from: broadcastingBody.body.GetUserData(),
          to: receiverBody.body.GetUserData(),
        });
      }
    };

    return new Promise((resolve, reject) => {

      this.startDate = performance.now();
      this.frameCount = -1;
      this.tickFunc(true);
    });

    // this.Box2D.destroy(this.queryCallback);
    // this.Box2D.destroy(this.lowerBound);
    // this.Box2D.destroy(this.upperBound);
    // this.Box2D.destroy(this.aabb);
  }

  tickFunc(recursive) {
    if(this.paused) {
      // resolve();
      return;
    }

    if(this.playUntil != null && this.frameCount == this.playUntil) {
      this.paused = true;
      return;
    }

    if(window._state_stop) {
      // resolve();
      return;
    }

    this.frameCount++;

    {
      let virtualSeconds = Math.floor(this.frameCount/LOOP_PER_SECOND);
      let ourSeconds = (performance.now() - this.startDate)/1000;
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
      this.setDisplayedData('Simulation speed', `${this.speedX > 2 ? Math.round(this.speedX) : Math.round(this.speedX*10)/10}x`);
    }

    {
      if(this.selectedUID) {
        this.setDisplayedData('[Selected] ID', this.selectedUID)
        // STRANGE: any of these two lines improves performance of the Replicator experiment!
        // Try clicking on a robot to set this.selectedUID.
        // NOTE: on this comment it doesn't make any different! maybe because I restarted the computer.
        // also, even before that restart it used to make no difference on Safari on Mac.
        // The only observed difference was on Chrome on Mac on commit 2d2c062432768d19bc9f942d49529d6fbf943100 ("ok")
        // this.setDisplayedData('[Selected] State', this.bodies[this.selectedUID].robot.state)
        // this.setDisplayedData('[Selected] Closest Dist', this.bodies[this.selectedUID].robot.closestDist || 0, {graph: true})
        if(false && this.bodies[this.selectedUID].robot.abilityAttract) {
          this.setDisplayedData('[Selected] Last Value 1', this.bodies[this.selectedUID].robot.abilityAttract.last_value1 || 0, {graph: true})
          this.setDisplayedData('[Selected] Last Value 2', this.bodies[this.selectedUID].robot.abilityAttract.last_value2 || 0, {graph: true})
          this.setDisplayedData('[Selected] Last Value 2-1',
            ( this.bodies[this.selectedUID].robot.abilityAttract.last_value2 || 0)
            -
            (this.bodies[this.selectedUID].robot.abilityAttract.last_value1 || 0)
          , {graph: true})
          // this.setDisplayedData('[Selected] Did Something', this.bodies[this.selectedUID].robot.abilityAttract.didSomething, {graph: true})
          this.setDisplayedData('[Selected] Direction', this.bodies[this.selectedUID].robot.abilityAttract.direction, {graph: true})
        }
        if(this.bodies[this.selectedUID].robot._ambientlight_ready) {
          this.setDisplayedData('[Selected] Ambient Light', this.bodies[this.selectedUID].robot._ambientlight, {graph: true})
        }
        // this.setDisplayedData('[Selected] Robot', this.bodies[this.selectedUID].robot.toString())
      } else {
        this.setDisplayedData('[Selected] ID', null);
        // this.setDisplayedData('[Selected] State', null);
        // this.setDisplayedData('[Selected] Robot', null);
        this.setDisplayedData('[Selected] Ambient Light', null, {graph: true});
      }
    }

    if(false){
      for(let i = 0; i < this.bodyIDs.length; i++) {
        let id = this.bodyIDs[i]
        // if(id != 14) continue;
        let b = this.bodies[id];
        let v = b.body.GetLinearVelocity();
        // console.log(id, v.Length(), v.get_x(), v.get_y());
        if(v.Length() < 50) {
          // if(id == 15) {
          // console.log("ok", b.robot._uid, v.Length());
          v.set_x(- (2.0/1) * DAMPING * b.body.GetMass() * v.get_x());
          v.set_y(- (2.0/1) * DAMPING * b.body.GetMass() * v.get_y());
          b.body.ApplyForceToCenter(v, true);
          // b.body.ApplyLinearImpulse(v, b.body.GetWorldCenter(), true);
          // b.body.SetLinearVelocity(v);
        }
        // let newV = new this.Box2D.b2Vec2(10, 10);
        // b.body.SetLinearVelocity(newV);
        // console.log(f.get_x(), f.get_y());
        // let f = new this.Box2D.b2Vec2(-1000*v.get_x(), -1000*v.get_y());
        // let f = new this.Box2D.b2Vec2(1000, 1000);
        // b.body.ApplyForceToCenter(f, true);
        // this.Box2D.destroy(f);
      }
    }
    this.physics.update();

    if(this.experiment.runnerOptions.traversedPath && this.frameCount % (this.experiment.runnerOptions.limitSpeed ? 10 : 30) == 0) {
      let max = this.experiment.runnerOptions.traversedPathLen;

      this.forEachBody(b => {
        if(true && b.posHistoryX == null) {
          b.posHistoryCursor = -1;
          b.posHistoryFilled = false;
          b.posHistoryX = new Float64Array(max);
          b.posHistoryY = new Float64Array(max);
          b.posHistoryAngle = new Float64Array(max);
          b.posHistoryColor = new Array(); // string
        }

        let pos = b.body.GetPosition();
        let newPos = {
          x: pos.get_x(),
          y: pos.get_y(),
          angle: b.body.GetAngle(),
        };

        /*
        if(newPos.x == b.posHistoryX[b.posHistoryCursor]
          && newPos.y == b.posHistoryY[b.posHistoryCursor]
          // && newPos.angle == b.posHistoryAngle[b.posHistoryCursor]
        ) {
          return;
        }
        */

        if(b.posHistoryCursor == max - 1) {
          b.posHistoryFilled = true;
        }

        b.posHistoryCursor = (b.posHistoryCursor+1) % max;

        b.posHistoryX[b.posHistoryCursor] = newPos.x;
        b.posHistoryY[b.posHistoryCursor] = newPos.y;
        b.posHistoryAngle[b.posHistoryCursor] = newPos.angle;
        b.posHistoryColor[b.posHistoryCursor] = toHex(b.robot.led);
      });
    }

    // ******
    for(let i = 0; i < this.bodyIDs.length; i++) {
      let r = this.bodies[this.bodyIDs[i]].robot;
      if(r._started) {
        r.loop();
        r._internal_loop();
        continue;
      }

      if(this.MathRandom() < 0.75) {
        r.setup();
        r._started = true;
      }
    }

    // ******
    this.connections = [];
    // messageTxCount = 0;
    // messageRxCount = 0;

    {
      /*
      if(this.frameCount % 2 == 0) {
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
      if(this.frameCount % 1 == 0) {
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
    if(this.lightSources.length > 0) {
      for(let i = 0; i < this.bodyIDs.length; i++) {
        let b = this.bodies[this.bodyIDs[i]];
        if(this.frameCount < b.lastAmbientLightSetAt + TICKS_BETWEEN_AMB_LIGHT) {
          continue;
        }

        let mult = 10;
        let v = mult * 1024 * this.lightSources.length;

        this.lightSources.forEach(ls => {
          let pos = {
            x: b.body.GetPosition().get_x(),
            y: b.body.GetPosition().get_y(),
          };

          let dx = pos.x - ls.pos.x;
          let dy = pos.y - ls.pos.y;
          let d = Math.sqrt(dx*dx + dy*dy);
          v -= mult * d;
        });

        if(this.MathRandom() > 0.9) {
          v += (this.MathRandom()-0.5) * 5;
        }

        b.lastAmbientLightSetAt = this.frameCount;

        let newValue = v|0;

        if(newValue < 0|0)
          newValue = 0|0;

        b.robot._ambientlight = newValue|0;
        b.robot._ambientlight_ready = 1|0;
      }
    }

    if(true) {
      for(let i = 0; i < this.bodyIDs.length; i++) {

        // NOTE: a robot can receive 2 messages without its loop func being called between them.
        // This might happen in the real robots as well, but it probably happens here more often.
        // When writing robot code, make sure you do not assume that loop() is called between message_rx calls.

        let b = this.bodies[this.bodyIDs[i]];
        if(this.frameCount < b.lastMessageSentAt + TICKS_BETWEEN_MSGS) {
          continue;
        }
        // if(this.frameCount > 60 * 5) { continue; }

        b.lastMessageSentAt = this.frameCount - Math.floor(this.MathRandom() * 2);

        let broadcastingBody = b;

        if(!broadcastingBody) {
          console.error("deleted robot fetched");
          continue;
        }

        if(!broadcastingBody.robot._started) {
          continue;
        }

        // messageTxCount++;
        let message = broadcastingBody.robot.message_tx();
        message = JSON.parse(JSON.stringify(message));
        if(message == null) {
          continue;
        }
        broadcastingBody.robot.message_tx_success();

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

          this.lowerBound.set_x(pos_x-NEIGHBOUR_DISTANCE);
          this.lowerBound.set_y(pos_y-NEIGHBOUR_DISTANCE);

          this.upperBound.set_x(pos_x+NEIGHBOUR_DISTANCE);
          this.upperBound.set_y(pos_y+NEIGHBOUR_DISTANCE);

          this.aabb.set_lowerBound(this.lowerBound);
          this.aabb.set_upperBound(this.upperBound);

          this.queryCallback.message = message;
          this.queryCallback.broadcastingBody = broadcastingBody;
          this.queryCallback.Box2D = this.Box2D;
          this.physics.world.QueryAABB(this.queryCallback, this.aabb);
        }
      }
    }

    if(DEV) {
      // this.setDisplayedData('message_tx()', messageTxCount);
      // this.setDisplayedData('message_tx()/robot', Math.round(messageTxCount/this.bodyIDs.length * 100)/100);
      // this.setDisplayedData('message_rx()', messageRxCount);
      // this.setDisplayedData('message_rx()/robot', Math.round(messageRxCount/this.bodyIDs.length * 100)/100);
    }

    if(!recursive) {
      return;
    }

    {
      let time0 = performance.now();
      if(false) {
        this.tickFunc(false);

        setTimeout(() => {
          this.tickFunc(true);
          let dt = (performance.now() - time0)/1000;
          if(this.deltaTime == null) {
            this.deltaTime = dt;
          } else {
            this.deltaTime += (dt - this.deltaTime) * 0.2;
          }
        }, 1);
      } else {
        let fn = () => {
          for(let i = 0; i < this.tickBatchCount - 1; i++) {
            this.tickFunc(false);
          }
          this.tickFunc(true);
          let dt = (performance.now() - time0)/1000;
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

          if(this.experiment.runnerOptions.limitSpeed)
            this.tickBatchCount = 1;

          if(DEV) {
            this.setDisplayedData('Tick batch', Math.round(this.tickBatchCount));
          }

          // if(BENCHMARKING) {
          //   console.log(`FPS: ${Math.floor(1/this.deltaTime)}/s`);
          // }
        };
        // this.setDisplayedData('Frame', this.frameCount);
        window.requestAnimationFrame(() => fn());
        // if(this.frameCount < 300) {
        //   this.tickBatchCount = 10;
        //   window.requestAnimationFrame(() => fn());
        // } else {
        //   setTimeout(() => {
        //     window.requestAnimationFrame(() => fn());
        //   }, 100);
        // }
      }
    }
  }

  toggleLimitSpeed() {
    this.experiment.runnerOptions.limitSpeed = !this.experiment.runnerOptions.limitSpeed;
  }

  doTick(count) {
    this.paused = false;
    this.tickBatchCount = 1;
    this.playUntil = this.frameCount+1 + (count || 1);
    this.tickFunc(true);
  }

  togglePause() {
    this.paused = !this.paused;
    this.playUntil = null;

    if(this.paused) {
      this.tickBatchCount = 1;
    } else {
      this.tickFunc(true);
    }
  }

  createBodyGraphic(b) {
    // if(BENCHMARKING) return;
    switch(b.label) {
      case "Circle Body":
        const g = new PIXI.Graphics();
        g.lastView = null;
        b.g = g;

        g.on('pointerdown', (ev) => {
          if(this.selectedUID != null) {
            this.bodies[this.selectedUID].robot._graphics_must_update  = true;
          }
          this.selectedUID = b.robot._uid;
          b.robot._graphics_must_update = true;
        });

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
            g.x = + pos.x * this.V.ZOOM;
            g.y = + pos.y * this.V.ZOOM;
            g.angle = angle;
            g.zIndex = this.zIndexOf('_Robots');

            if(!b.robot._graphics_must_update) {
              return;
            } else {
              b.robot._updated_graphics();
            }

            g.clear();
            g.removeChildren();

            g.lineStyle(0);
            if(false && b.robot.state == States.JoinedShape) {
              g.beginFill(toHex(b.robot.led), 1.0);
            } else {
              g.beginFill(toHex(b.robot.led), 0.5);
            }
            g.drawCircle(0, 0, b.circleRadius * this.V.ZOOM);

            g.lineStyle(b.circleRadius*this.V.ZOOM/2.0, 1.0);
            g.moveTo(0, 0);
            g.lineTo(b.circleRadius*this.V.ZOOM, 0);
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
          g.x = + pos.x * this.V.ZOOM;
          g.y = + pos.y * this.V.ZOOM;
          g.angle = angle;
          g.zIndex = this.zIndexOf('_Robots');

          if(equalZooms(g.lastView, this.V)) {
            if(!b.robot._graphics_must_update) {
              return;
            } else {
              b.robot._updated_graphics();
            }
          }

          g.lastView = copyView(this.V);

          g.clear();
          g.removeChildren();

          // if(this.selectedUID == b.robot._uid) {
          //   g.endFill();
          //   g.lineStyle(10, selectedColor, 1);
          //   g.drawCircle(0, 0, (2 * b.circleRadius + 0) * this.V.ZOOM);
          // }

          let thickness = 0;

          if(this.darkMode) {
            g.beginFill(0x000000);
          } else {
            thickness = 1;
            g.lineStyle(thickness, toHexDark(b.robot.led), 0.5); // toHexDark(b.robot.led));
            g.beginFill(0xffffff);
            // g.beginFill(0x000000);
          }

          g.drawCircle(0, 0, b.circleRadius * this.V.ZOOM - thickness/2);

          g.lineStyle(0);
          if(this.darkMode){
            g.beginFill(toHex(b.robot.led), 0.4);
            let glowRadius = b.circleRadius * this.V.ZOOM - thickness/2
            // if(b.robot.led.r > 0 || b.robot.led.g > 0 || b.robot.led.b > 0) {
            //   glowRadius = glowRadius * 2;
            // }
            g.drawCircle(0, 0, glowRadius);
          } else {
            g.beginFill(toHex(b.robot.led), 0.2);
            let glowRadius = b.circleRadius * this.V.ZOOM - thickness/2
            g.drawCircle(0, 0, glowRadius);
          }

          /*
          if(toHex(b.robot.led)) != 0x000000) {
            g.filters = [
              new PIXI.filters.GlowFilter(2, 2, 1, toHex(b.robot.led), 0.5),
            ];
          } else {
            g.filters = [];
          }
          */

          // line direction indicator
          if(this.V.ZOOM * b.circleRadius > 10) {
            g.endFill();
            g.lineStyle(b.circleRadius*this.V.ZOOM*0.25, 0x000000, 1.0);
            // g.lineStyle(b.circleRadius*this.V.ZOOM*0.25, toHex(b.robot.led), 1);
            g.moveTo(0, 0);
            g.lineTo(b.circleRadius*this.V.ZOOM - thickness, 0);
          }

          // legs
          if(this.V.ZOOM * b.circleRadius > 10) {
            g.beginFill(0x000000, 1);
            g.lineStyle(0);
            let r = b.circleRadius*this.V.ZOOM*0.15;
            let R = b.circleRadius*this.V.ZOOM - r;
            [/*0,*/ 2/3*Math.PI, 4/3*Math.PI].forEach(a => {
              g.drawCircle(R * Math.cos(a), R * Math.sin(a), r);
            });
          }

          if(true) { // led
            // g.lineStyle(thickness);
            // g.lineStyle(0);
            let ledRadius = b.circleRadius * 0.4 * this.V.ZOOM;
            // g.lineStyle(0.1 * this.V.ZOOM, 0x000000, 0.5);
            g.lineStyle(2, 0x000000, 0.3);
            if(this.darkMode) {
              g.beginFill(toHex(b.robot.led));
            } else {
              // g.beginFill(0x000000);
              g.beginFill(toHex(b.robot.led));
            }
            g.drawCircle(
              0,
              0,
              ledRadius,
            );
          }

          if(false && this.V.ZOOM > 20) {
            const t = new PIXI.Text(`${b.robot._uid || '0'}`, {fontSize: 0.4 * this.V.ZOOM, align: 'center', fill: 0xaabbcc});
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
	constructor(Box2D, MathRandom) {
    this.Box2D = Box2D;
    this.MathRandom = MathRandom;
		this.currentFrame = 0;
		this.destroyFuncs = [];

		// Box2D-interfacing code
		let gravity = new this.Box2D.b2Vec2(0, 0);
		this.world = new this.Box2D.b2World(gravity);
    window.world = this.world;

    if(false /* edge/wall */) {
      let left   = -SIZE().w * 0.5;
      let right  = +SIZE().w * 0.5;
      let top    = -SIZE().h * 0.5;
      let bottom = +SIZE().h * 0.5;

      this.edgeShape({x: left, y: top}, {x: right, y: top});
      this.edgeShape({x: left, y: top}, {x: left, y: bottom});

      this.edgeShape({x: right, y: bottom}, {x: right, y: top});
      this.edgeShape({x: right, y: bottom}, {x: left, y: bottom});
    }

    {
      let boxShape = new this.Box2D.b2PolygonShape();
      boxShape.SetAsBox(100, 100);
      let bdef = new this.Box2D.b2BodyDef();
      bdef.set_type(this.Box2D.b2_staticBody);
      this.surfaceBody = this.world.CreateBody(bdef);

      this.zero = new this.Box2D.b2Vec2(0, 0);
      // this.Box2D.destroy(this.zero);
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

	circle(pos, angle, radius, id) {
		let b2bodyDef = new this.Box2D.b2BodyDef();
    b2bodyDef.set_linearDamping(DAMPING);
		b2bodyDef.set_angularDamping(DAMPING);
    // if(BENCHMARKING) {
    //   b2bodyDef.set_type(this.Box2D.b2_staticBody);
    // } else {
    if(false && (id == 1 || id == 2 || id == 3 || id == 4)) {
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

    if(true) { // id != 2) {
      let fj = new this.Box2D.b2FrictionJointDef();
      fj.Initialize(body, this.surfaceBody, this.zero);
      fj.set_localAnchorA(this.zero);
      fj.set_localAnchorB(this.zero);

      fj.set_maxForce(DAMPING * 0.4);
      // fj.set_maxTorque(DAMPING * 0.5);

      this.world.CreateJoint(fj);
      this.Box2D.destroy(fj);
    }


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
    // let angle = this.MathRandom() * 2*Math.PI /*Math.PI/2*/;
    body.SetTransform(
      body.GetPosition(),
      180 * angle / Math.PI,
    );

    return new Body(body, radius, this.MathRandom)
	}
}

class Body {
  constructor(body, radius, MathRandom) {
    this.body = body;
    this.label = 'Circle Body';
    this.circleRadius = radius;
    this.posHistoryCursor = null;
    this.posHistoryFilled = false;
    this.posHistoryX = null;
    this.posHistoryY = null;
    this.posHistoryAngle = null;
    this.lastMessageSentAt = Math.floor(MathRandom() * 60);
    this.lastAmbientLightSetAt = Math.floor(MathRandom() * 60);
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

const formatSeconds = (totalSeconds, full) => {
  let h = Math.floor(totalSeconds/3600);
  let m = Math.floor((totalSeconds - h*3600)/60);
  let s = Math.floor(totalSeconds % 60);

  if(s < 10) s = `0${s}`;
  if(m < 10) m = `0${m}`;
  if(h < 10) h = `0${h}`;
  if(full) {
    return `${h}:${m}:${s}`;
  }

  if(h > 0) {
    return `${h}:${m}:${s}`;
  } else if(m > 0) {
    return `${m}m:${s}s`;
  } else {
    return `${s}s`;
  }
}

const MetaOpts = {
  fontSize: 12,
  lineHeight: 20,
  padding: 20,
  margin: 20,
};

let CATS = {
  NONE: 0,
  ROBOT: 0b01,
  NEIGHBOR: 0b10,
}

const equalZooms = (v1, v2) => {
  if(v1 == null || v2 == null)
    return false;

  return v1.ZOOM == v2.ZOOM;
}

const copyView = (v) =>{
  return {
    PAN: {
      x: v.PAN.x,
      y: v.PAN.y,
    },
    ZOOM: v.ZOOM,
  }
}

const calcDistBox2D = function(pos1, pos2) {
  return Math.sqrt(
    Math.pow(pos1.get_x() - pos2.get_x(), 2) + Math.pow(pos1.get_y() - pos2.get_y(), 2)
  );
}

function toHex(led) {
  let r = Math.floor(0xff * led.r / 3.0).toString(16);
  let g = Math.floor(0xff * led.g / 3.0).toString(16);
  let b = Math.floor(0xff * led.b / 3.0).toString(16);
  if(r.length == 1) r = `0${r}`;
  if(g.length == 1) g = `0${g}`;
  if(b.length == 1) b = `0${b}`;
  return `0x${r}${g}${b}`;
}

function toHexDark(led) {
  let r = Math.floor(0xff * led.r / 3.0 / 2).toString(16);
  let g = Math.floor(0xff * led.g / 3.0 / 2).toString(16);
  let b = Math.floor(0xff * led.b / 3.0 / 2).toString(16);
  if(r.length == 1) r = `0${r}`;
  if(g.length == 1) g = `0${g}`;
  if(b.length == 1) b = `0${b}`;
  return `0x${r}${g}${b}`;
}
