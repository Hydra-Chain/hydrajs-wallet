import { IProvider } from "./Provider";
import { CancelTokenSource } from "axios";
import { Insight } from "./Insight";
import { Wallet } from "./Wallet";
export declare class WalletRPCProvider implements IProvider {
    wallet: Wallet;
    constructor(wallet: Wallet);
    rawCall(method: string, params?: any[], opts?: any): Promise<Insight.IContractCall | Insight.ISendRawTxResult>;
    cancelTokenSource(): CancelTokenSource;
}
