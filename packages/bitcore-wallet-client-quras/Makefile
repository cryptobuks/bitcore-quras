.PHONY: cover

BIN_PATH:=node_modules/.bin/

all:	bitcore-wallet-client-quras.js

clean:
	rm bitcore-wallet-client-quras.js

bitcore-wallet-client-quras.js: index.js lib/*.js
	${BIN_PATH}browserify $< > $@

cover:
	./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- --reporter spec test
