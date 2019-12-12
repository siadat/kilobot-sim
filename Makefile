SHELL := /bin/bash # reason: make "source" work (reason: avoid putting it in my ~/.bashrc)
homepageDir = /home/sina/go/src/github.com/siadat/siadat.github.io/kilobots

dev: update_version
	npx webpack -w --config webpack.dev.js

all:
	ag -o --js 'window..(Experiment\w+)' | tee | grep -Po 'Experiment\w+' | sort | uniq

build:
	source /home/sina/kilobot-sim/emsdk/emsdk_env.sh && \
		emcc -O3 robustc.c -o robustc.html -s EXPORTED_FUNCTIONS='["_isTriangleRobustC"]'  -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'
	# cp $(GOROOT)/misc/wasm/wasm_exec.js .
	# GOARCH=wasm GOOS=js go build -o robust.wasm robust.go

deploy: update_version
	npx webpack --config webpack.prod.js

	mkdir -p $(homepageDir)/dist
	cp dist/bundle.min.js $(homepageDir)/dist

	cp index.html $(homepageDir)/
	cp main.js $(homepageDir)/
	cp normalize.css $(homepageDir)/
	cp homepage.css $(homepageDir)/
	cp -r vendor $(homepageDir)/
	cp -r experiments/*.js $(homepageDir)/experiments/

update_version:
	echo "// Build stuff" > version.js
	echo "export const VERSION = '$(shell git rev-parse HEAD)';" >> version.js
	echo "export const BUILTAT = '$(shell date +%Y-%m-%d-at-%H-%M-%S)';" >> version.js

dependencies: node_modules

node_modules:
	npm i

package.json:
	npm init

share:
	~/Downloads/ngrok http 8080

physics/vendor/box2d.jsm:
	wget -c https://raw.githubusercontent.com/kripken/box2d.js/master/build/Box2D_v2.3.1_min.js
	mkdir -p physics/vendor/
	cat Box2D_v2.3.1_min.js > physics/vendor/box2d.jsm
	echo "module.exports = Box2D;" >> physics/vendor/box2d.jsm
	rm Box2D_v2.3.1_min.js
