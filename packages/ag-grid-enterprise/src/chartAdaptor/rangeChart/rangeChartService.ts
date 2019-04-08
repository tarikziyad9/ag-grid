import {
    _,
    Autowired,
    Bean,
    CellRange,
    ChartRangeParams,
    ChartRef,
    ChartType, Column,
    Context,
    GridOptionsWrapper,
    IAggFunc,
    IRangeChartService,
    PreDestroy
} from "ag-grid-community";
import {RangeController} from "../../rangeController";
import {ChartModel} from "../chartComp/chartModel";
import {ChartOptions, GridChartComp} from "../chartComp/gridChartComp";
import {RangeChartDatasource} from "./rangeChartDatasource";

export interface ChartDatasource {
    getChartData(): ChartData;
    getErrors(): string[];
    destroy(): void;
}

export interface ChartData {
    colIds: string[];
    colDisplayNames: string[];
    dataGrouped: any[];
    colsMapped: {[colId: string]: Column}
    categoryCols: Column[];
}

@Bean('rangeChartService')
export class RangeChartService implements IRangeChartService {

    @Autowired('rangeController') private rangeController: RangeController;
    @Autowired('context') private context: Context;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;

    // we destroy all charts bound to this grid when grid is destroyed. activeCharts contains all charts, including
    // those in developer provided containers.
    private activeCharts: ChartRef[] = [];

    public chartCurrentRange(chartType: ChartType = ChartType.GroupedBar): ChartRef | undefined {
        const selectedRange = this.getSelectedRange();
        return this.chartRange(selectedRange, chartType);
    }

    public chartCellRange(params: ChartRangeParams): ChartRef | undefined {
        const cellRange = this.rangeController.createCellRangeFromCellRangeParams(params.cellRange);

        let chartType: ChartType;
        switch (params.chartType) {
            case 'groupedBar':
                chartType = ChartType.GroupedBar;
                break;
            case 'stackedBar':
                chartType = ChartType.StackedBar;
                break;
            case 'pie':
                chartType = ChartType.Pie;
                break;
            case 'line':
                chartType = ChartType.Line;
                break;
            default:
                chartType = ChartType.GroupedBar;
        }

        if (cellRange) {
            return this.chartRange(cellRange, chartType, params.chartContainer, params.aggFunc);
        }
    }

    public chartRange(cellRange: CellRange, chartType: ChartType, container?: HTMLElement, aggFunc?: IAggFunc | string): ChartRef | undefined {

        const createChartContainerFunc = this.gridOptionsWrapper.getCreateChartContainerFunc();

        const chartOptions: ChartOptions = {
            insideDialog: !(container || createChartContainerFunc),
            height: 400, width: 800
        };

        const ds = new RangeChartDatasource(cellRange, aggFunc);
        this.context.wireBean(ds);

        const chartModel = new ChartModel(chartType, ds);
        this.context.wireBean(chartModel);

        const chartComp = new GridChartComp(chartOptions, chartModel);
        this.context.wireBean(chartComp);

        const chartRef = this.createChartRef(chartComp);

        if (container) {
            // if container exists, means developer initiated chart create via API, so place in provided container
            container.appendChild(chartComp.getGui());
        } else if (createChartContainerFunc) {
            // otherwise user created chart via grid UI, check if developer provides containers (eg if the application
            // is using it's own dialog's rather than the grid provided dialogs)
            createChartContainerFunc(chartRef);
        } else {
            // remove charts that get destroyed from the active charts list
            chartComp.addEventListener(GridChartComp.EVENT_DESTROYED, () => {
                _.removeFromArray(this.activeCharts, chartRef);
            });
        }

        return chartRef;
    }

    private createChartRef(chartComp: GridChartComp): ChartRef {
        const chartRef: ChartRef = {
            destroyChart: () => {
                if (this.activeCharts.indexOf(chartRef) >= 0) {
                    chartComp.destroy();
                    _.removeFromArray(this.activeCharts, chartRef);
                }
            },
            chartElement: chartComp.getGui()
        };

        this.activeCharts.push(chartRef);
        return chartRef;
    }

    private getSelectedRange(): CellRange {
        const ranges = this.rangeController.getCellRanges();
        return ranges.length > 0 ? ranges[0] : {} as CellRange;
    }

    @PreDestroy
    private destroyAllActiveCharts(): void {
        // we take copy as the forEach is removing from the array as we process
        const activeCharts = this.activeCharts.slice();
        activeCharts.forEach(chart => chart.destroyChart());
    }
}