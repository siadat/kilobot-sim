package main

import (
	"fmt"
	"math"
	"syscall/js"
)

func main() {
	fmt.Println("wow I am from Go WASM")
	window := js.Global().Get("window")
	window.Set("isTriangleRobust", js.FuncOf(isTriangleRobustGo))
	select {}
}

func isTriangleRobustGo(this js.Value, args []js.Value) interface{} {
	// fmt.Println("ok...")
	points_x := args[0]
	points_y := args[1]
	triangle_a := []float64{0, 0, 0}
	triangle_e := []float64{0, 0, 0}
	triangle_e2 := []float64{0, 0, 0}

	triangle_e2[0] = math.Pow(points_x.Index(1).Float()-points_x.Index(2).Float(), 2) + math.Pow(points_y.Index(1).Float()-points_y.Index(2).Float(), 2)
	triangle_e2[1] = math.Pow(points_x.Index(0).Float()-points_x.Index(2).Float(), 2) + math.Pow(points_y.Index(0).Float()-points_y.Index(2).Float(), 2)
	triangle_e2[2] = math.Pow(points_x.Index(0).Float()-points_x.Index(1).Float(), 2) + math.Pow(points_y.Index(0).Float()-points_y.Index(1).Float(), 2)

	triangle_e[0] = math.Sqrt(triangle_e2[0])
	triangle_e[1] = math.Sqrt(triangle_e2[1])
	triangle_e[2] = math.Sqrt(triangle_e2[2])

	triangle_a[0] = math.Acos((triangle_e2[1] + triangle_e2[2] - triangle_e2[0]) / (2 * triangle_e[1] * triangle_e[2]))
	triangle_a[1] = math.Acos((triangle_e2[0] + triangle_e2[2] - triangle_e2[1]) / (2 * triangle_e[0] * triangle_e[2]))
	triangle_a[2] = math.Acos((triangle_e2[1] + triangle_e2[0] - triangle_e2[2]) / (2 * triangle_e[1] * triangle_e[0]))

	minAngle := math.Min(triangle_a[0], triangle_a[1])
	minAngle = math.Min(minAngle, triangle_a[2])

	minEdge := math.Min(triangle_e[0], triangle_e[1])
	minEdge = math.Min(minEdge, triangle_e[2])

	// if isNaN(minAngle) {
	// 	return false
	// }
	return minAngle > math.Pi*15/180
}
