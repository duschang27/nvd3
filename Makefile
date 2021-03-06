JS_FILES = \
	src/intro.js \
	src/core.js \
	src/tooltip.js \
	src/utils.js \
	src/models/axis.js \
	src/models/legend.js \
	src/models/line.js \
	src/models/lineTimeSeriesChart.js \
	src/models/lineWithFocusChart.js \
	src/models/scatter.js \
	src/models/parallelCoordinates.js \
	src/models/pie.js \
	src/models/pieChart.js \
	src/models/multiBar.js \
	src/models/multiBarChart.js \
	src/models/discreteBar.js \
	src/models/discreteBarChart.js \
	src/models/funnelBarChart.js \
	src/outro.js

JS_COMPILER = \
	uglifyjs

all: nv.d3.js nv.d3.min.js
nv.d3.js: $(JS_FILES)
nv.d3.min.js: $(JS_FILES)

nv.d3.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) >> $@

%.min.js:: Makefile
	rm -f $@
	$(JS_COMPILER) nv.d3.js >> $@

clean:
	rm -rf nv.d3.js nv.d3.min.js


