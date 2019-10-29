build:
	echo "const VERSION = '$(shell git rev-parse HEAD)';" > version.js
