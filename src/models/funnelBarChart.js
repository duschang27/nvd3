
nv.models.funnelBarChart = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var discretebar = nv.models.discreteBar()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    ;

  var margin = {top: 10, right: 40, bottom: 30, left: 40}
    , width = null
    , height = null
    , color = nv.utils.getColor()
    , staggerLabels = false
    , valueFormat = d3.format(',.2f')
    , tooltips = true
    , tooltip = function(key, x, y, e, graph) {
        return '<span>' + x + ' - <b>' + valueFormat(e.value) + ' </b></span>'
      }
    , x
    , y
    , noData = "No Data Available."
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'beforeUpdate')
    ;

  xAxis
    .orient('bottom')
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(function(d) { return d })
    ;
  yAxis
    .orient('left')
    .tickFormat(d3.format(',.1f'))
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
  };

  //============================================================

  var funnelHelper = function() {
    var width, height;

    function funnelFn(selection) {
      selection.each(function(data) {
        var container = d3.select(this);

        var funnel = container.selectAll('.nv-funnel').data(data);
        var funnelEnter = funnel.enter().append('g').attr('class', 'nv-funnel')

        funnelEnter.append('path')
          .attr('fill', '#555')
          .attr('stroke', 'none')
          .attr('d', "M16,1.466C7.973,1.466,1.466,7.973,1.466,16C1.466,24.027,7.973,30.534,16,30.534C24.027,30.534,30.534,24.027,30.534,15.999999999999998C30.534,7.973,24.027,1.466,16,1.466ZM13.665,25.725L10.129,22.186L16.316,15.998999999999999L10.128999999999998,9.811999999999998L13.664999999999997,6.275999999999998L23.388999999999996,15.998999999999999L13.665,25.725Z")
        funnelEnter.append('text')
          .attr('fill', '#555')
          .attr('dy', '3.75em')
          .style('font-size', '14px')
          .style('font-weight', '600');

        funnel.exit().remove();
        funnel.select('text').text(function(d) { return d.delta; });

        funnel.attr('transform', function(d, i){
          xpos = x(d.prev.label) + x.rangeBand();
          ypos = height / 2 - 20;
          return 'translate(' + xpos + ',' + ypos + ')';
        });
      });

      return funnel;
    }

    funnelFn.width = function(_) {
      if (!arguments.length) return width;
      width = _;
      return funnelFn;
    };

    funnelFn.height = function(_) {
      if (!arguments.length) return height;
      height = _;
      return funnelFn;
    };

    return funnelFn;
  }


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;


      chart.update = function() { dispatch.beforeUpdate(); selection.transition().call(chart); };
      chart.container = this;


      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Scales

      x = discretebar.xScale();
      y = discretebar.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-discreteBarWithAxes').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discreteBarWithAxes').append('g');
      var defsEnter = gEnter.append('defs');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-funnelWrap');

      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Main Chart Component(s)

      var firstValue = null,
          prevItem = null,
          funnelData = [];

      data[0].values.forEach(function(item) {
        if (prevItem != null) {
          delta = Math.round(item.value / prevItem.value * 1000) / 10;
          obj = {
            delta: delta + '%',
            prev: prevItem,
            next: item
          }
          funnelData.push(obj);
        } else {
          firstValue = item.value;
        }
        prevItem = item;
      });


      valueFormat = function(value) {
        delta = Math.round(value / firstValue * 1000) / 10;
        return [d3.format(',.2f')(value),' (', delta, '%)'].join('');
      }

      var barValueFormat = function(value) {
        delta = Math.round(value / firstValue * 1000) / 10;
        return [yAxis.tickFormat()(value),' (', delta, '%)'].join('');
      }

      discretebar
        .valueFormat(barValueFormat)
        .width(availableWidth)
        .height(availableHeight)
        .widthRatio(0.5)
        .offsetRatio(0.25);

      data = data.filter(function(d) { return !d.disabled })
      var barsWrap = g.select('.nv-barsWrap')
          .datum(data)

      d3.transition(barsWrap).call(discretebar);

      var funnelWrap = g.select('.nv-funnelWrap')
          .datum(funnelData)

      funnel = funnelHelper()
        .width(availableWidth)
        .height(availableHeight);

      d3.transition(funnelWrap).call(funnel);

      defsEnter.append('clipPath')
          .attr('id', 'nv-x-label-clip-' + discretebar.id())
        .append('rect');

      g.select('#nv-x-label-clip-' + discretebar.id() + ' rect')
          .attr('width', x.rangeBand() * (staggerLabels ? 2 : 1))
          .attr('height', 16)
          .attr('x', -x.rangeBand() / (staggerLabels ? 1 : 2 ));

      //------------------------------------------------------------
      // Setup Axes

      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')');
      //d3.transition(g.select('.nv-x.nv-axis'))
      g.select('.nv-x.nv-axis').transition().duration(0)
          .call(xAxis);


      var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

      if (staggerLabels) {
        xTicks
            .selectAll('text')
            .attr('transform', function(d,i,j) { return 'translate(0,' + (j % 2 == 0 ? '5' : '17') + ')' })
      }

      yAxis
        .scale(y)
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-y.nv-axis'))
          .call(yAxis);

      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      //============================================================


    });

    return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  discretebar.dispatch.on('elementMouseover.tooltip', function(e) {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  discretebar.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.discretebar = discretebar;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, discretebar, 'x', 'y', 'xDomain', 'yDomain', 'forceX', 'forceY', 'id', 'showValues', 'valueFormat');

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    discretebar.color(color);
    return chart;
  };

  chart.staggerLabels = function(_) {
    if (!arguments.length) return staggerLabels;
    staggerLabels = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  //============================================================


  return chart;
}
