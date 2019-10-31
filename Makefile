dev: update_version
	npx webpack -w --config webpack.dev.js

deploy: update_version
	npx webpack --config webpack.prod.js

update_version:
	echo "export const VERSION = '$(shell git rev-parse HEAD)';" > version.js

dependencies: node_modules

node_modules:
	npm i

package.json:
	npm init

physics/vendor/box2d.jsm:
	wget -c https://raw.githubusercontent.com/kripken/box2d.js/master/build/Box2D_v2.3.1_min.js
	mkdir -p physics/vendor/
	cat Box2D_v2.3.1_min.js > physics/vendor/box2d.jsm
	echo "module.exports = Box2D;" >> physics/vendor/box2d.jsm
	rm Box2D_v2.3.1_min.js
