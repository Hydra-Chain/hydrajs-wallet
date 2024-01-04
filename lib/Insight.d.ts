import { INetworkInfo } from "./Network";
import { IContractSendTXOptions } from "./tx";
export declare class Insight {
    private baseURL;
    static forNetwork(network: INetworkInfo): Insight;
    private axios;
    constructor(baseURL: string);
    getBlockchainInfo(): Promise<Insight.IBlockchainInfo>;
    getAddressBalanceHistory(address: string): Promise<Insight.IBalanceHistory[]>;
    getAddressTokenBalanceHistory(address: string, token: string): Promise<Insight.ITokenBalanceHistory[]>;
    listUTXOs(address: string): Promise<Insight.IUTXO[]>;
    getInfo(address: string): Promise<Insight.IGetInfo>;
    sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult>;
    contractCall(address: string, encodedData: string, opts?: IContractSendTXOptions): Promise<Insight.IContractCall>;
    /**
     * Get single transaction's info
     * @param id
     */
    getTransactionInfo(id: string): Promise<Insight.IRawTransactionInfo>;
    /**
     * Get multiple Transaction info (paginated)
     * @param address
     * @param pageNum
     */
    getTransactions(address: string): Promise<Insight.IRawTransactions>;
}
export declare namespace Insight {
    type Foo = string;
    interface ISendRawTxResult {
        txid: string;
    }
    interface IBlockchainInfo {
        height: number;
        supply: number;
        netStakeWeight: number;
        feeRate: number;
        gasPrice: string;
        circulatingSupply: number;
    }
    interface IBalanceHistory {
        transactionId: string;
        blockHash: string;
        blockHeight: number;
        timestamp: number;
        amount: string;
        balance: string;
    }
    interface ITokenBalanceHistory {
        transactionId: string;
        blockhash: string;
        blockHeight: number;
        timestamp: number;
        tokens: ITokenBalance[];
    }
    interface ITokenBalance {
        address: string;
        addressHex: string;
        name: string;
        symbol: string;
        decimals: number;
        amount: string;
        balance: string;
    }
    interface IUTXO {
        address: string;
        transactionId: string;
        outputIndex: number;
        /**
         * Public key that controls this UXTO, as hex string.
         */
        scriptPubKey: string;
        amount: number;
        value: number;
        isStake: boolean;
        height: number;
        confirmations: number;
    }
    interface IExecutionResult {
        gasUsed: number;
        excepted: string;
        newAddress: string;
        output: string;
        codeDeposit: number;
        gasRefunded: number;
        depositSize: number;
        gasForDeposit: number;
    }
    interface ITransactionReceipt {
        blockHash: string;
        blockNumber: number;
        transactionHash: string;
        transactionIndex: number;
        from: string;
        to: string;
        cumulativeGasUsed: string;
        gasUsed: number;
        contractAddress: string;
        excepted: string;
        log: any[];
    }
    interface IContractCall {
        address: string;
        executionResult: any;
    }
    interface IGetInfo {
        addrStr: string;
        /**
         * balance of address in loc
         */
        balance: number;
        /**
         * Balance of address in satoshi
         */
        balanceSat: number;
        totalReceived: number;
        totalReceivedSat: number;
        totalSet: number;
        totalSentSat: number;
        unconfirmedBalance: number;
        unconfirmedBalanceSat: number;
        unconfirmedTxApperances: number;
        txApperances: number;
        /**
         * List of transaction IDs
         */
        transactions: string[];
    }
    interface IVin {
        txid: string;
        address: string;
        value: string;
    }
    interface IVout {
        value: string;
        scriptPubKey: IScriptPubKey;
        address: string;
    }
    interface IScriptPubKey {
        addresses: string[];
    }
    interface IRawTransactionInfo {
        txid: string;
        version: number;
        locktime: number;
        receipt: ITransactionReceipt[];
        vin: IVin[];
        vout: IVout[];
        confirmations: number;
        time: number;
        valueOut: number;
        valueIn: number;
        fees: number;
        blockhash: string;
        blockheight: number;
        isqrc20Transfer: boolean;
    }
    interface IRawTransactions {
        pagesTotal: number;
        txs: IRawTransactionInfo[];
    }
}
