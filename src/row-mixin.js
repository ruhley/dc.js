/**
 * Row is a mixin that provides utility functions for both the Row Chart and Paired Row Chart
 * @name rowMixin
 * @memberof dc
 * @mixin
 * @param {String|node|d3.selection} parent - Any valid
 * {@link https://github.com/mbostock/d3/wiki/Selections#selecting-elements d3 single selector} specifying
 * a dom block element such as a div; or a dom element or d3 selection.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @return {dc.rowChart}
 */
dc.rowMixin = function (parent, chartGroup) {
    var X_AXIS_LABEL_CLASS = 'x-axis-label';
    var AXIS_LABEL_PADDING = 10;

    var _labelOffsetX = 10;
    var _labelOffsetY = 15;
    var _hasLabelOffsetY = false;
    var _dyOffset = '0.35em';  // this helps center labels https://github.com/mbostock/d3/wiki/SVG-Shapes#svg_text
    var _titleLabelOffsetX = 2;

    var _gap = 5;

    var _fixedBarHeight = false;
    var _rowCssClass = 'row';
    var _titleRowCssClass = 'titlerow';
    var _renderTitleLabel = false;

    var _chart = dc.capMixin(dc.marginMixin(dc.colorMixin(dc.baseMixin({}))));

    var _x;

    var _elasticX;
    var _xAxisLabel;

    var _xAxis = d3.svg.axis().orient('bottom');


    var _useRightYAxis = false;

    _chart.rowsCap = _chart.cap;

    function calculateAxisScale () {
        if (!_x || _elasticX) {
            var extent = d3.extent(_chart.data(), _chart.cappedValueAccessor);
            if (extent[0] > 0) {
                extent[0] = 0;
            }
            var domain = d3.scale.linear().domain(extent);

            if (_chart.useRightYAxis()) {
                _x = domain.range([_chart.axisWidth(), 0]);
            } else {
                _x = domain.range([0, _chart.axisWidth()]);
            }
        }
        _xAxis.scale(_x);
    }

    _chart._drawAxis = function (g) {
        var axisG = g.select('g.axis');

        renderXAxisLabel();

        calculateAxisScale();

        if (axisG.empty()) {
            axisG = g.append('g').attr('class', 'axis');
        }
        axisG.attr('transform', 'translate(0, ' + _chart.effectiveHeight() + ')');

        dc.transition(axisG, _chart.transitionDuration())
            .call(_xAxis);
    }

    function renderXAxisLabel () {
        var text = _chart.xAxisLabel();

        if (text) {
            var axisXLab = _chart.g().selectAll('text.' + X_AXIS_LABEL_CLASS);

            if (axisXLab.empty()) {
                axisXLab = _chart.g().append('text')
                    .attr('class', X_AXIS_LABEL_CLASS)
                    .attr('text-anchor', 'middle');
            }

            if (axisXLab.text() !== text) {
                axisXLab.text(text);
            }

            // wrap the x axis label
            _chart._wrapLabels(axisXLab, _chart.effectiveWidth());

            // calculate the height of the x axis label
            _chart.xAxisLabelPadding = axisXLab.node().getBBox().height + AXIS_LABEL_PADDING + AXIS_LABEL_PADDING;

            axisXLab.attr('transform',
                'translate(' + (_chart.axisWidth() / 2) +
                ',' + (_chart.height() - _chart.xAxisLabelPadding + AXIS_LABEL_PADDING) + ')'
            );

            dc.transition(axisXLab, _chart.transitionDuration())
                .attr('transform', 'translate(' + (_chart.axisWidth() / 2) + ',' +
                    (_chart.height() - _chart.xAxisLabelPadding + AXIS_LABEL_PADDING) + ')');
        }
    }

    _chart.title(function (d) {
        return _chart.cappedKeyAccessor(d) + ': ' + _chart.cappedValueAccessor(d);
    });

    _chart.label(_chart.cappedKeyAccessor);

    /**
     * Gets or sets the x scale. The x scale can be any d3
     * {@link https://github.com/mbostock/d3/wiki/Quantitative-Scales quantitive scale}
     * @method x
     * @memberof dc.rowChart
     * @instance
     * @see {@link https://github.com/mbostock/d3/wiki/Quantitative-Scales quantitive scale}
     * @param {d3.scale} [scale]
     * @return {d3.scale}
     * @return {dc.rowChart}
     */
    _chart.x = function (scale) {
        if (!arguments.length) {
            return _x;
        }
        _x = scale;
        return _chart;
    };

    _chart._drawGridLines = function (g) {
        g.selectAll('g.tick')
            .select('line.grid-line')
            .remove();

        g.selectAll('g.tick')
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', function () {
                return -_chart.effectiveHeight();
            });
    }

    _chart._createElements = function (rows) {
        var rowEnter = rows.enter()
            .append('g')
            .attr('class', function (d, i) {
                return _rowCssClass + ' _' + i;
            });

        rowEnter.append('rect').attr('width', 0);

        createLabels(rowEnter);
        updateLabels(rows);
    }

    _chart._removeElements = function (rows) {
        rows.exit().remove();
    }

    function rootValue () {
        var root = _x(0);
        return (root === -Infinity || root !== root) ? _x(1) : root;
    }

    _chart._updateElements = function (rows) {
        var n = rows.size();

        var height;
        if (!_fixedBarHeight) {
            height = (_chart.effectiveHeight() - (n + 1) * _gap) / n;
        } else {
            height = _fixedBarHeight;
        }

        // vertically align label in center unless they override the value via property setter
        if (!_hasLabelOffsetY) {
            _labelOffsetY = height / 2;
        }

        var rect = rows.attr('transform', function (d, i) {
            var h = ((i + 1) * _gap + i * height),
                w = _chart.useRightYAxis() ? _chart.axisWidth() : 0;
            return 'translate(' + w + ',' + h + ')';
            }).select('rect')
            .attr('height', height)
            .attr('fill', _chart.getColor)
            .on('click', onClick)
            .classed('deselected', function (d) {
                return (_chart.hasFilter()) ? !isSelectedRow(d) : false;
            })
            .classed('selected', function (d) {
                return (_chart.hasFilter()) ? isSelectedRow(d) : false;
            });

        dc.transition(rect, _chart.transitionDuration())
            .attr('width', function (d) {
                return Math.abs(rootValue() - _x(_chart.valueAccessor()(d)));
            })
            .attr('transform', translateX);

        _chart._attachTitle(rows);
        updateLabels(rows);
    }

    function createLabels (rowEnter) {
        if (_chart.renderLabel()) {
            rowEnter.append('text')
                .on('click', onClick);
        }
        if (_chart.renderTitleLabel()) {
            rowEnter.append('text')
                .attr('class', _titleRowCssClass)
                .on('click', onClick);
        }
    }

    function updateLabels (rows) {
        if (_chart.renderLabel()) {
            var lab = rows.select('text')
                .attr('x', _chart.useRightYAxis() ? -_labelOffsetX : _labelOffsetX)
                .attr('y', _labelOffsetY)
                .attr('dy', _dyOffset)
                .attr('text-anchor', _chart.useRightYAxis() ? 'end' : 'start')
                .on('click', onClick)
                .attr('class', function (d, i) {
                    return _rowCssClass + ' _' + i;
                })
                .text(function (d) {
                    return _chart.label()(d);
                });
            dc.transition(lab, _chart.transitionDuration())
                .attr('transform', function(d) {
                    if (_chart.useRightYAxis()) {
                        return 'translate(0,0)';
                    }
                    return translateX(d);
                });
        }
        if (_chart.renderTitleLabel()) {
            var titlelab = rows.select('.' + _titleRowCssClass)
                    .attr('x', _chart.useRightYAxis() ?
                      _titleLabelOffsetX - _chart.axisWidth() :
                      _chart.axisWidth() - _titleLabelOffsetX
                    )
                    .attr('y', _labelOffsetY)
                    .attr('text-anchor', _chart.useRightYAxis() ? 'start' : 'end')
                    .on('click', onClick)
                    .attr('class', function (d, i) {
                        return _titleRowCssClass + ' _' + i ;
                    })
                    .text(function (d) {
                        return _chart.title()(d);
                    });
            dc.transition(titlelab, _chart.transitionDuration())
                .attr('transform', function (d) {
                    if (_chart.useRightYAxis()) {
                        return 'translate(0,0)';
                    }
                    return translateX(d);
                });
        }
    }

    /**
     * Turn on/off Title label rendering (values) using SVG style of text-anchor 'end'
     * @method renderTitleLabel
     * @memberof dc.rowChart
     * @instance
     * @param {Boolean} [renderTitleLabel=false]
     * @return {Boolean}
     * @return {dc.rowChart}
     */
    _chart.renderTitleLabel = function (renderTitleLabel) {
        if (!arguments.length) {
            return _renderTitleLabel;
        }
        _renderTitleLabel = renderTitleLabel;
        return _chart;
    };

    function onClick (d) {
        _chart.onClick(d);
    }

    function translateX (d) {
        var x = _x(_chart.cappedValueAccessor(d)),
            x0 = rootValue(),
            s = x > x0 ? x0 : x;

        if (_chart.useRightYAxis()) {
            s -= _chart.axisWidth();
        }

        return 'translate(' + s + ',0)';
    }

    _chart._doRedraw = function () {
        _chart._drawChart();
        return _chart;
    };

    /**
     * Get the x axis for the row chart instance.  Note: not settable for row charts.
     * See the {@link https://github.com/mbostock/d3/wiki/SVG-Axes#wiki-axis d3 axis object}
     * documention for more information.
     * @method xAxis
     * @memberof dc.rowChart
     * @instance
     * @see {@link https://github.com/mbostock/d3/wiki/SVG-Axes#wiki-axis d3.svg.axis}
     * @example
     * // customize x axis tick format
     * chart.xAxis().tickFormat(function (v) {return v + '%';});
     * // customize x axis tick values
     * chart.xAxis().tickValues([0, 100, 200, 300]);
     * @return {d3.svg.axis}
     */
    _chart.xAxis = function () {
        return _xAxis;
    };

    /**
     * Set or get the x axis label. If setting the label, you may optionally include additional padding to
     * the margin to make room for the label. By default the padded is set to 12 to accomodate the text height.
     * @name xAxisLabel
     * @memberof dc.coordinateGridMixin
     * @instance
     * @param {String} [labelText]
     * @param {Number} [padding=12]
     * @return {String}
     */
    _chart.xAxisLabel = function (labelText, padding) {
        if (!arguments.length) {
            return _xAxisLabel;
        }
        _xAxisLabel = labelText;
        return _chart;
    };

    /**
     * Get or set the fixed bar height. Default is [false] which will auto-scale bars.
     * For example, if you want to fix the height for a specific number of bars (useful in TopN charts)
     * you could fix height as follows (where count = total number of bars in your TopN and gap is
     * your vertical gap space).
     * @method fixedBarHeight
     * @memberof dc.rowChart
     * @instance
     * @example
     * chart.fixedBarHeight( chartheight - (count + 1) * gap / count);
     * @param {Boolean|Number} [fixedBarHeight=false]
     * @return {Boolean|Number}
     * @return {dc.rowChart}
     */
    _chart.fixedBarHeight = function (fixedBarHeight) {
        if (!arguments.length) {
            return _fixedBarHeight;
        }
        _fixedBarHeight = fixedBarHeight;
        return _chart;
    };

    /**
     * Get or set the vertical gap space between rows on a particular row chart instance
     * @method gap
     * @memberof dc.rowChart
     * @instance
     * @param {Number} [gap=5]
     * @return {Number}
     * @return {dc.rowChart}
     */
    _chart.gap = function (gap) {
        if (!arguments.length) {
            return _gap;
        }
        _gap = gap;
        return _chart;
    };

    /**
     * Get or set the elasticity on x axis. If this attribute is set to true, then the x axis will rescle to auto-fit the
     * data range when filtered.
     * @method elasticX
     * @memberof dc.rowChart
     * @instance
     * @param {Boolean} [elasticX]
     * @return {Boolean}
     * @return {dc.rowChart}
     */
    _chart.elasticX = function (elasticX) {
        if (!arguments.length) {
            return _elasticX;
        }
        _elasticX = elasticX;
        return _chart;
    };

    /**
     * Get or set the x offset (horizontal space to the top left corner of a row) for labels on a particular row chart.
     * @method labelOffsetX
     * @memberof dc.rowChart
     * @instance
     * @param {Number} [labelOffsetX=10]
     * @return {Number}
     * @return {dc.rowChart}
     */
    _chart.labelOffsetX = function (labelOffsetX) {
        if (!arguments.length) {
            return _labelOffsetX;
        }
        _labelOffsetX = labelOffsetX;
        return _chart;
    };

    /**
     * Get or set the y offset (vertical space to the top left corner of a row) for labels on a particular row chart.
     * @method labelOffsetY
     * @memberof dc.rowChart
     * @instance
     * @param {Number} [labelOffsety=15]
     * @return {Number}
     * @return {dc.rowChart}
     */
    _chart.labelOffsetY = function (labelOffsety) {
        if (!arguments.length) {
            return _labelOffsetY;
        }
        _labelOffsetY = labelOffsety;
        _hasLabelOffsetY = true;
        return _chart;
    };

    /**
     * Get of set the x offset (horizontal space between right edge of row and right edge or text.
     * @method titleLabelOffsetX
     * @memberof dc.rowChart
     * @instance
     * @param {Number} [titleLabelOffsetX=2]
     * @return {Number}
     * @return {dc.rowChart}
     */
    _chart.titleLabelOffsetX = function (titleLabelOffsetX) {
        if (!arguments.length) {
            return _titleLabelOffsetX;
        }
        _titleLabelOffsetX = titleLabelOffsetX;
        return _chart;
    };

    /**
     #### .useRightYAxis()
     Gets or sets whether the chart should be drawn with a right axis instead of a left axis.
     **/

    _chart.useRightYAxis = function (_) {
        if (!arguments.length) {
            return _useRightYAxis;
        }
        _useRightYAxis = _;
        return _chart;
    };

    function isSelectedRow (d) {
        return _chart.hasFilter(_chart.cappedKeyAccessor(d));
    }

    return _chart.anchor(parent, chartGroup);
};
