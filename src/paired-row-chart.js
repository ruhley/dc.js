/**
 * Concrete paired row chart implementation.
 *
 * @class pairedRowChart
 * @memberof dc
 * @mixes dc.rowMixin
 * @mixes dc.capMixin
 * @mixes dc.marginMixin
 * @mixes dc.colorMixin
 * @mixes dc.baseMixin
 * @example
 * // create a row chart under #chart-container1 element using the default global chart group
 * var chart1 = dc.pairedRowChart('#chart-container1');
 * // create a row chart under #chart-container2 element using chart group A
 * var chart2 = dc.pairedRowChart('#chart-container2', 'chartGroupA');
 * @param {String|node|d3.selection} parent - Any valid
 * {@link https://github.com/mbostock/d3/wiki/Selections#selecting-elements d3 single selector} specifying
 * a dom block element such as a div; or a dom element or d3 selection.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @return {dc.pairedRowChart}
 */
dc.pairedRowChart = function (parent, chartGroup) {
    var _chart = dc.rowMixin(parent, chartGroup);

    var _rowCssClass = 'row';

    var _gLeft;
    var _gRight;

    // we need a way to know which data belongs on the left chart and which data belongs on the right
    var _leftKeyFilter = function (d) {
        return d.key[0];
    };

    var _rightKeyFilter = function (d) {
        return d.key[0];
    };

    /**
    #### .leftKeyFilter([value]) - **mandatory**
    Set or get the left key filter attribute of a chart.
    For example
    function(d) {
        return d.key[0] === 'Male';
    }
    If a value is given, then it will be used as the new left key filter. If no value is specified then
    the current left key filter will be returned.
    **/
    _chart.leftKeyFilter = function (_) {
        if (!arguments.length) {
            return _leftKeyFilter;
        }

        _leftKeyFilter = _;
        return _chart;
    };

    /**
    #### .rightKeyFilter([value]) - **mandatory**
    Set or get the right key filter attribute of a chart.
    For example
    function(d) {
        return d.key[0] === 'Female';
    }
    If a value is given, then it will be used as the new right key filter. If no value is specified then
    the current right key filter will be returned.
    **/
    _chart.rightKeyFilter = function (_) {
        if (!arguments.length) {
            return _rightKeyFilter;
        }

        _rightKeyFilter = _;
        return _chart;
    };

    _chart._doRender = function () {
        _chart.resetSvg();

        var _g = _chart.svg()
            .append('g')
            .attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');

        _chart.g(_g);

        _gLeft = _g
            .append('g')
            .attr('transform', 'translate(0, 0)')
            .attr('class', 'dc-paired-row-left');

        _gRight = _g
            .append('g')
            .attr('transform', 'translate(' + _chart.axisWidth() + ', 0)')
            .attr('class', 'dc-paired-row-right');

        _chart._drawChart();

        return _chart;
    };

    _chart.axisWidth = function() {
        return _chart.effectiveWidth() / 2;
    };

    _chart._drawChart = function () {
        _chart.useRightYAxis(true);
        _chart._drawChartLeft();
        _chart.useRightYAxis(false);
        _chart._drawChartRight();
    };

    _chart._drawChartLeft = function () {
        var data = _chart.data().filter(function (d) {
            return _chart.leftKeyFilter()(d);
        });

        _chart._drawAxis(_gLeft);

        _chart._drawGridLines(_gLeft);

        var rowsLeft = _gLeft.selectAll('g.' + _rowCssClass).data(data);

        _chart._createElements(rowsLeft);
        _chart._removeElements(rowsLeft);
        _chart._updateElements(rowsLeft);
    };

    _chart._drawChartRight = function () {
        var data = _chart.data().filter(function (d) {
            return _chart.rightKeyFilter()(d);
        });

        dc.transition(_gRight, _chart.transitionDuration())
            .attr('transform', 'translate(' + _chart.axisWidth() + ', 0)');

        _chart._drawAxis(_gRight);

        _chart._drawGridLines(_gRight);

        var rowsRight = _gRight.selectAll('g.' + _rowCssClass).data(data);

        _chart._createElements(rowsRight);
        _chart._removeElements(rowsRight);
        _chart._updateElements(rowsRight);
    };

    return _chart;
};
