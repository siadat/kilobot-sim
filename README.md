- Example program:

```c
#include <kilolib.h>

void setup() {
    // put your setup code here, to be run only once
}

void loop() {
    // put your main code here, to be run repeatedly
}

int main() {
    // initialize hardware
    kilo_init();
    // start program
    kilo_start(setup, loop);

    return 0;
}
```

- `set_color`
  Each color has a 2-bit resolution, from 0 (off) to 3 (full-brightness).
  Eg:
    RGB(0, 0, 0) // off
    RGB(3, 3, 3) // white
    RGB(0, 3, 0) // green

  // blink dim RED once per second
  while (1) {
    set_color(RGB(1,0,0));
    delay(500);
    set_color(RGB(0,0,0));
    delay(500);
  }

- `set_motors`

