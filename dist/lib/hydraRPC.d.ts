import RpcClient, { IConfig } from "hydrad-rpc";
import { Network } from "./Network";
export default class HydraRPC {
    rpc: RpcClient;
    constructor(config?: IConfig);
    generate(nblocks: number): Promise<any>;
}
export declare const rpcClient: HydraRPC;
export declare function generateBlock(network: Network): Promise<void>;
