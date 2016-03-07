/**
 * Concrete row chart implementation.
 *
 * Examples:
 * - {@link http://dc-js.github.com/dc.js/ Nasdaq 100 Index}
 * @class rowChart
 * @memberof dc
 * @mixes dc.rowMixin
 * @mixes dc.capMixin
 * @mixes dc.marginMixin
 * @mixes dc.colorMixin
 * @mixes dc.baseMixin
 * @example
 * // create a row chart under #chart-container1 element using the default global chart group
 * var chart1 = dc.rowChart('#chart-container1');
 * // create a row chart under #chart-container2 element using chart group A
 * var chart2 = dc.rowChart('#chart-container2', 'chartGroupA');
 * @param {String|node|d3.selection} parent - Any valid
 * {@link https://github.com/mbostock/d3/wiki/Selections#selecting-elements d3 single selector} specifying
 * a dom block element such as a div; or a dom element or d3 selection.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @return {dc.rowChart}
 */
dc.rowChart = function (parent, chartGroup) {
    var _chart = dc.rowMixin(parent, chartGroup);

    var _rowCssClass = 'row';

    _chart._doRender = function () {
        _chart.resetSvg();

        var _g = _chart.svg()
            .append('g')
            .attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');

        _chart.g(_g);

        _chart._drawChart();

        return _chart;
    };

    _chart.axisWidth = function() {
        return _chart.effectiveWidth();
    };

    _chart._drawChart = function () {
        _chart._drawAxis(_chart.g());
        _chart._drawGridLines(_chart.g());

        var rows = _chart.g().selectAll('g.' + _rowCssClass)
            .data(_chart.data());

        _chart._createElements(rows);
        _chart._removeElements(rows);
        _chart._updateElements(rows);
    };

    return _chart;
};
