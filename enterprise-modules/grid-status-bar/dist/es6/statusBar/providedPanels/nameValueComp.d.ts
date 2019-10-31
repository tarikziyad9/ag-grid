import { Component, GridOptionsWrapper } from '@ag-community/grid-core';
export declare class NameValueComp extends Component {
    protected gridOptionsWrapper: GridOptionsWrapper;
    private static TEMPLATE;
    private eLabel;
    private eValue;
    constructor();
    setLabel(key: string, defaultValue: string): void;
    setValue(value: any): void;
}