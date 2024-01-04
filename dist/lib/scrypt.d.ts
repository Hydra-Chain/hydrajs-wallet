export interface IScryptParams {
    N: number;
    r: number;
    p: number;
}
export declare const params: {
    bip38: IScryptParams;
    golang: IScryptParams;
    noop: IScryptParams;
};
declare const _default: IScryptParams;
export default _default;
interface IScryptProgress {
    current: number;
    total: number;
    percent: number;
}
declare type ScryptProgressCallbackFunction = (report: IScryptProgress) => any;
interface IScryptOptions {
    /**
     * Parameters to the scrypt function.
     *
     * N = round
     * r = memory factor
     * p = CPU parallelism factor
     */
    params?: IScryptParams;
    /**
     * The length of the result hash in bytes
     */
    length?: number;
    /**
     * Progress callback that's invoked every 1000 rounds
     */
    progress?: ScryptProgressCallbackFunction;
}
export declare function scrypt(data: string, opts?: IScryptOptions): string;
