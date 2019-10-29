class ImageEditor {
  constructor() {
    this.size = {
      w: 160,
      h: 420,
    }
    this.app = new PIXI.Application({
      width: this.size.w,
      height: this.size.h,
      // backgroundColor: 0xfff000,
      resolution: window.devicePixelRatio || 1,
    });
    this.app.stage.sortableChildren = true;


    document.body.appendChild(this.app.view);
    const container = new PIXI.Container();
    this.app.stage.addChild(container);

    const texture = PIXI.Texture.from('/pattern1.png');
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0);
    this.sprite.alpha = 1; // 0.75;
    this.sprite.zIndex = 1;
    this.sprite.x = 0 - 1;
    this.sprite.y = 0;

    this.app.stage.interactive = true;
    this.app.stage.on("pointerdown", (e) => {
      console.log('click', e.data.global);
      this.printPixel(e.data.global);
    });
    
    container.addChild(this.sprite);
  }

  drawGrid() {
    const grid = new PIXI.Graphics();
    this.app.stage.addChild(grid);
    grid.lineStyle(1, 0x000000);

    let gap = 6.35;
    for(let top = 0; top < this.size.h;) {
      top += gap;
      grid.moveTo(0, top);
      grid.lineTo(this.size.w, top);
    }
    for(let left = 0; left < this.size.w;) {
      left += gap;
      grid.moveTo(left, 0);
      grid.lineTo(left, this.size.h);
    }
  }

  printPixel(pos) {
    let pixels = this.app.renderer.extract.pixels(this.sprite);
    let per_row = this.size.w*4;
    let k = Math.floor(pos.x) % per_row + Math.floor(pos.y) * per_row; 
    // for(let k = 0; k < this.size.w; k+=4) {
      let pixel = {
        r: pixels[k+0],
        g: pixels[k+1],
        b: pixels[k+2],
        a: pixels[k+3],
      };
      console.log(pos, pixel);
    // }
  }

  convert() {
    const img = new PIXI.Graphics();
    this.app.stage.addChild(img);
    img.alpha = 0.5;

    let pixels = this.app.renderer.extract.pixels(this.app.stage);
    console.log('pixels.length', pixels.length, pixels);

    console.log(this.sprite.height);

    let unit = 6;

    let asciiShape = [];
    let root = {row: 0, col: 0};

    let offset = {x: 0, y: unit/2};
    for(let y = offset.y; y < this.sprite.height; y+=unit) {
      let row = [];
      for(let x = offset.x; x < this.sprite.width; x+=unit) {

        let k = y*this.sprite.width*4 + x*4;
        let pixel = {
          r: pixels[k+0],
          g: pixels[k+1],
          b: pixels[k+2],
          a: pixels[k+3],
        };

        if(pixel.r < 255*0.5 && pixel.g < 255*0.5 && pixel.b < 255*0.5) {
          row.push('#');
          img.beginFill(0x00ff00);
          img.lineStyle(1, 0x000000);
          img.drawRect(x, y, 6.35, 6.35);

          if(root.row != asciiShape.length) {
            root.row = asciiShape.length;
            root.col = row.length-1;
          }
        } else {
          row.push(' ');
        }
      }
      asciiShape.push(row);
    }

    asciiShape[root.row][root.col] = 'R';
    console.log(root, asciiShape);
    return asciiShape;


    /*
    let pixels = this.app.renderer.extract.pixels(this.app.stage);

    for(let rowi = 0; rowi < this.size.h; rowi++) {
      for(let coli = 0; coli < 4 * this.size.w; coli+=4) {
        let k = rowi*(this.size.w*4) + coli;

        let pixel = {
          r: pixels[k+0],
          g: pixels[k+1],
          b: pixels[k+2],
          a: pixels[k+3],
        };

        console.log(pixel);

        if(pixel.r < 100 && pixel.g < 100 && pixel.b < 100) {
          img.drawCircle(
            coli/4, 
            rowi,
            1);
        } else {
          img.beginFill(0xff0000);
          img.drawCircle(
            coli/4, 
            rowi,
            1);
        }
      }
    }
    */
  }
}
