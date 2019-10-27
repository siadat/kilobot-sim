console.log("started...");
let array = [];
let count = 100000

let buf = new ArrayBuffer(count * 2 * Int32Array.BYTES_PER_ELEMENT);
let array_x = new Int32Array(buf, (0 * count) * Int32Array.BYTES_PER_ELEMENT, count);
let array_y = new Int32Array(buf, (1 * count) * Int32Array.BYTES_PER_ELEMENT, count);

for(let i = 0; i < count; i++) {
  array.push({
    x: i,
    y: i,
  });
}


{
  let time0 = new Date();
  let sum = 0;
  for(let it = 0; it < 1000; it++)
    for(let i = 0; i < count; i++) {
      sum += array[i].x + array[i].y;
    }
  console.log(`duration: ${(new Date() - time0)/1000}s`);
  console.log(`sum: ${sum}`);
}

{
  let time0 = new Date();
  let sum = 0;
  for(let it = 0; it < 1000; it++)
    for(let i = 0; i < count; i++) {
      sum += array_x[i] + array_y[i];
    }
  console.log(`duration: ${(new Date() - time0)/1000}s`);
  console.log(`sum: ${sum}`);
}
