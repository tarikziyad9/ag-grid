"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var chartBuilder_1 = require("../../../../charts/chartBuilder");
var cartesianChartProxy_1 = require("./cartesianChartProxy");
var timeAxis_1 = require("../../../../charts/chart/axis/timeAxis");
var categoryAxis_1 = require("../../../../charts/chart/axis/categoryAxis");
var typeChecker_1 = require("../../typeChecker");
var LineChartProxy = /** @class */ (function (_super) {
    __extends(LineChartProxy, _super);
    function LineChartProxy(params) {
        var _this = _super.call(this, params) || this;
        _this.initChartOptions();
        _this.recreateChart();
        return _this;
    }
    LineChartProxy.prototype.createChart = function (options) {
        var _a = this.chartProxyParams, grouping = _a.grouping, parentElement = _a.parentElement;
        return chartBuilder_1.ChartBuilder[grouping ? "createGroupedLineChart" : "createLineChart"](parentElement, options);
    };
    LineChartProxy.prototype.update = function (params) {
        var _this = this;
        if (params.fields.length === 0) {
            this.chart.removeAllSeries();
            return;
        }
        this.updateAxes(params.data[0], params.category.id);
        var chart = this.chart;
        var fieldIds = params.fields.map(function (f) { return f.colId; });
        var _a = this.getPalette(), fills = _a.fills, strokes = _a.strokes;
        var data = this.transformData(params.data, params.category.id);
        var existingSeriesById = chart.series.reduceRight(function (map, series, i) {
            var id = series.yKey;
            if (fieldIds.indexOf(id) === i) {
                map.set(id, series);
            }
            else {
                chart.removeSeries(series);
            }
            return map;
        }, new Map());
        var previousSeries = undefined;
        params.fields.forEach(function (f, index) {
            var lineSeries = existingSeriesById.get(f.colId);
            var fill = fills[index % fills.length];
            var stroke = strokes[index % strokes.length];
            if (lineSeries) {
                lineSeries.title = f.displayName;
                lineSeries.data = data;
                lineSeries.xKey = params.category.id;
                lineSeries.xName = params.category.name;
                lineSeries.yKey = f.colId;
                lineSeries.yName = f.displayName;
                lineSeries.fill = fill;
                lineSeries.stroke = fill; // this is deliberate, so that the line colours match the fills of other series
            }
            else {
                var seriesDefaults = _this.chartOptions.seriesDefaults;
                var options = __assign(__assign({}, seriesDefaults), { type: 'line', title: f.displayName, data: data, field: {
                        xKey: params.category.id,
                        xName: params.category.name,
                        yKey: f.colId,
                        yName: f.displayName,
                    }, fill: __assign(__assign({}, seriesDefaults.fill), { color: fill }), stroke: __assign(__assign({}, seriesDefaults.stroke), { color: fill }), marker: __assign(__assign({}, seriesDefaults.marker), { stroke: stroke }) });
                lineSeries = chartBuilder_1.ChartBuilder.createSeries(options);
                chart.addSeriesAfter(lineSeries, previousSeries);
            }
            previousSeries = lineSeries;
        });
        this.updateLabelRotation(params.category.id);
    };
    LineChartProxy.prototype.updateAxes = function (testDatum, categoryKey) {
        var chartOptions = this.chartOptions;
        if (chartOptions.xAxis.type) {
            return;
        }
        var xAxis = this.chart.axes.filter(function (a) { return a.position === 'bottom'; })[0];
        if (!xAxis) {
            return;
        }
        var categoryIsDate = typeChecker_1.isDate(testDatum && testDatum[categoryKey]);
        if (categoryIsDate && !(xAxis instanceof timeAxis_1.TimeAxis)) {
            var options = __assign(__assign({}, this.chartOptions), { xAxis: __assign(__assign({}, this.chartOptions.xAxis), { type: 'time' }) });
            this.recreateChart(options);
        }
        else if (!categoryIsDate && !(xAxis instanceof categoryAxis_1.CategoryAxis)) {
            this.recreateChart();
        }
    };
    LineChartProxy.prototype.getDefaultOptions = function () {
        var options = this.getDefaultCartesianChartOptions();
        options.xAxis.label.rotation = 335;
        options.seriesDefaults = __assign(__assign({}, options.seriesDefaults), { stroke: __assign(__assign({}, options.seriesDefaults.stroke), { width: 3 }), marker: {
                enabled: true,
                type: 'circle',
                size: 6,
                strokeWidth: 1,
            }, tooltip: {
                enabled: true,
            } });
        return options;
    };
    return LineChartProxy;
}(cartesianChartProxy_1.CartesianChartProxy));
exports.LineChartProxy = LineChartProxy;
//# sourceMappingURL=lineChartProxy.js.map