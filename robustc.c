#include <stdio.h>
#include <math.h>

int main() {
  printf("Hello from robustc.c\n");
  return 0;
}

int isTriangleRobustC(double x0, double y0, double x1, double y1, double x2, double y2) {
  double triangle_a_0 = 0.0;
  double triangle_a_1 = 0.0;
  double triangle_a_2 = 0.0;

  double triangle_e_0 = 0.0;
  double triangle_e_1 = 0.0;
  double triangle_e_2 = 0.0;

  double triangle_e2_0 = 0.0;
  double triangle_e2_1 = 0.0;
  double triangle_e2_2 = 0.0;

  triangle_e2_0 = pow(x1 - x2, 2) + pow(y1 - y2, 2);
  triangle_e2_1 = pow(x0 - x2, 2) + pow(y0 - y2, 2);
  triangle_e2_2 = pow(x0 - x1, 2) + pow(y0 - y1, 2);

  triangle_e_0 = sqrt(triangle_e2_0);
  triangle_e_1 = sqrt(triangle_e2_1);
  triangle_e_2 = sqrt(triangle_e2_2);

  triangle_a_0 = acos((triangle_e2_1 + triangle_e2_2 - triangle_e2_0) / (2 * triangle_e_1 * triangle_e_2));
  triangle_a_1 = acos((triangle_e2_0 + triangle_e2_2 - triangle_e2_1) / (2 * triangle_e_0 * triangle_e_2));
  triangle_a_2 = acos((triangle_e2_1 + triangle_e2_0 - triangle_e2_2) / (2 * triangle_e_1 * triangle_e_0));

  double minAngle = triangle_a_0;
  if(minAngle > triangle_a_1) minAngle = triangle_a_1;
  if(minAngle > triangle_a_2) minAngle = triangle_a_2;

  double minEdge = triangle_e_0;
  if(minEdge > triangle_e_1) minEdge = triangle_e_1;
  if(minEdge > triangle_e_2) minEdge = triangle_e_2;

  // if(isNaN(minAngle)) return false;
  return minAngle > M_PI * 15 / 180 ? 1 : 0;
}
