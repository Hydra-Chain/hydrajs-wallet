import axios, { AxiosInstance } from "axios"

import { INetworkInfo } from "./Network"
import { NetworkNames } from "./constants"
import { IContractSendTXOptions } from "./tx"

const INSIGHT_BASEURLS: { [key: string]: string } = {
  [NetworkNames.MAINNET]: "https://explorer.hydrachain.org/api",
  [NetworkNames.TESTNET]: "https://testexplorer.hydrachain.org/api"
}

export class Insight {
  // public static mainnet(): Insight {
  //   return new Insight(MAINNET_API_BASEURL)
  // }

  // public static testnet(): Insight {
  //   return new Insight(TESTNET_API_BASEURL)
  // }

  public static forNetwork(network: INetworkInfo): Insight {
    const baseURL = INSIGHT_BASEURLS[network.name]
    if (baseURL == null) {
      throw new Error(`No Insight API defined for network: ${network.name}`)
    }

    return new Insight(baseURL)
  }

  private axios: AxiosInstance

  constructor(private baseURL: string) {
    this.axios = axios.create({
      baseURL,
      // don't throw on non-200 response
      // validateStatus: () => true,
    })
  }

  public async getBlockchainInfo(): Promise<Insight.IBlockchainInfo> {
    const res = await this.axios.get('/info')
    return res.data as Insight.IBlockchainInfo
  }

  public async getAddressBalanceHistory(address: string): Promise<Insight.IBalanceHistory[]> {
    const res = await this.axios.get(`/address/${address}/balance-history`)
    return res.data.transactions as Insight.IBalanceHistory[]
  }

  public async getAddressTokenBalanceHistory(address: string, token: string): Promise<Insight.ITokenBalanceHistory[]> {
    const res = await this.axios.get(`/address/${address}/qrc20-balance-history/${token}`)
    return res.data.transactions as Insight.ITokenBalanceHistory[]
  }

  public async listUTXOs(address: string): Promise<Insight.IUTXO[]> {
    const res = await this.axios.get(`/address/${address}/utxo`)
    return res.data
  }

  public async getInfo(address: string): Promise<Insight.IGetInfo> {
    const res = await this.axios.get(`/address/${address}`)
    let retVal = res.data;
    retVal.addrStr = address;
    return retVal;
  }

  public async sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult> {
    const res = await this.axios.post("/tx/send", {
      rawtx,
    })

    return res.data
  }

  public async contractCall(
    address: string,
    encodedData: string,
    opts: IContractSendTXOptions = {}
  ): Promise<Insight.IContractCall> {
    const res = await this.axios.post(`/contract/${address}/call`, {
      data: encodedData,
      sender: opts.sender || undefined
    })

    return res.data
  }

  /**
   * Get single transaction's info
   * @param id
   */
  public async getTransactionInfo(
    id: string,
  ): Promise<Insight.IRawTransactionInfo> {
    const res = await this.axios.get(`/tx/${id}`)
    return res.data as Insight.IRawTransactionInfo
  }

  /**
   * Get multiple Transaction info (paginated)
   * @param address
   * @param pageNum
   */
  public async getTransactions(
    address: string
  ): Promise<Insight.IRawTransactions> {
    const result = await this.axios.get(`/address/${address}/basic-txs/`)
    return result.data as Insight.IRawTransactions
  }
}

export namespace Insight {
  export type Foo = string

  export interface ISendRawTxResult {
    txid: string
  }

  export interface IBlockchainInfo {
    height: number
    supply: number
    netStakeWeight: number
    feeRate: number
    gasPrice: string
    circulatingSupply: number
  }

  export interface IBalanceHistory {
    transactionId: string
    blockHash: string
    blockHeight: number
    timestamp: number
    amount: string
    balance: string
  }

  export interface ITokenBalanceHistory {
    transactionId: string
    blockhash: string
    blockHeight: number
    timestamp: number
    tokens: ITokenBalance[]
  }

  export interface ITokenBalance {
    address: string
    addressHex: string
    name: string
    symbol: string
    decimals: number
    amount: string
    balance: string
  }

  export interface IUTXO {
    address: string
    transactionId: string
    outputIndex: number

    /**
     * Public key that controls this UXTO, as hex string.
     */
    scriptPubKey: string

    amount: number
    value: number

    isStake: boolean
    height: number
    confirmations: number
  }

  export interface IExecutionResult {
    gasUsed: number
    excepted: string
    newAddress: string
    output: string
    codeDeposit: number
    gasRefunded: number
    depositSize: number
    gasForDeposit: number
  }

  export interface ITransactionReceipt {
    blockHash: string
    blockNumber: number
    transactionHash: string
    transactionIndex: number
    from: string
    to: string
    cumulativeGasUsed: string
    gasUsed: number
    contractAddress: string
    excepted: string
    log: any[]
  }

  export interface IContractCall {
    address: string
    executionResult: any
  }

  export interface IGetInfo {
    addrStr: string

    /**
     * balance of address in loc
     */
    balance: number

    /**
     * Balance of address in satoshi
     */
    balanceSat: number

    totalReceived: number
    totalReceivedSat: number
    totalSet: number
    totalSentSat: number

    unconfirmedBalance: number
    unconfirmedBalanceSat: number

    unconfirmedTxApperances: number
    txApperances: number

    /**
     * List of transaction IDs
     */
    transactions: string[]
  }

  export interface IVin {
    txid: string
    address: string
    value: string
  }

  export interface IVout {
    value: string
    scriptPubKey: IScriptPubKey
    address: string
  }

  export interface IScriptPubKey {
    addresses: string[]
  }

  export interface IRawTransactionInfo {
    txid: string
    version: number
    locktime: number
    receipt: ITransactionReceipt[]
    vin: IVin[] // 入账，[交易, ...]
    vout: IVout[] // 出账，[交易, ...]
    confirmations: number
    time: number
    valueOut: number // 扣除手续费的余额（发送方）
    valueIn: number // 交易前余额（发送方）
    fees: number // 手续费
    blockhash: string
    blockheight: number
    isqrc20Transfer: boolean
  }

  export interface IRawTransactions {
    pagesTotal: number
    txs: IRawTransactionInfo[]
  }
}
