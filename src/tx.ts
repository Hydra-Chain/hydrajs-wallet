import { ECPair, TransactionBuilder, script as BTCScript } from "bitcoinjs-lib"

import { encode as encodeCScriptInt } from "bitcoinjs-lib/src/script_number"

import { BigNumber } from "bignumber.js"

import { Buffer } from "buffer"

import { OPS } from "./opcodes"

import { Insight } from "./Insight"

import coinSelect = require("coinselect")
import { INetworkInfo } from "."

/**
 * Options for a payment transaction
 */
export interface ISendTxOptions {
  /**
   * Fee rate to pay for the raw transaction data (satoshi per byte). The
   * default value is the query result of the network's fee rate.
   */
  feeRate?: number
}

export interface IContractSendTXOptions {
  /**
   * unit: satoshi
   */
  amount?: number

  /**
   * unit: satoshi
   */
  gasLimit?: number

  /**
   * unit: satoshi / kilobyte
   */
  feeRate?: number
}

export interface IContractCreateTXOptions {
  /**
   * unit: satoshi
   */
  gasLimit?: number

  /**
   * unit: satoshi / kilobyte
   */
  feeRate?: number
}

export interface IUTXO {
  // This structure is slightly different from that returned by Insight API
  address: string
  transactionId: string
  hash: string // txid

  outputIndex: number // vout (insight)

  /**
   * Public key that controls this UXTO, as hex string.
   */
  scriptPubKey: string

  amount: number
  value: number // satoshi (insight)

  isStake: boolean
  confirmations: number
}

function ensureAmountInteger(n: number) {
  if (!Number.isInteger(n)) {
    throw new Error(`Expect tx amount to be an integer, got: ${n}`)
  }
}

export function estimatePubKeyHashTransactionMaxSend(
  utxos: IUTXO[],
  to: string,
  feeRate: number,
) {
  let maxAmount = 0
  for (const utxo of utxos) {
    maxAmount += utxo.value
  }

  while (maxAmount > 0) {
    const { inputs, fee: txfee } = coinSelect(
      utxos,
      [{ value: maxAmount, address: to }],
      feeRate,
    )

    if (inputs != null) {
      return maxAmount
    }

    // step down by 0.001 hydra
    maxAmount = maxAmount - 100000
  }

  return 0
}

/**
 * Build a pay-to-pubkey-hash transaction
 *
 * @param keyPair
 * @param to
 * @param amount (unit: satoshi)
 * @param feeRate
 * @param utxoList
 */
export function buildPubKeyHashTransaction(
  utxos: IUTXO[],
  keyPair: ECPair,
  to: string,
  amount: number,
  feeRate: number,
) {
  ensureAmountInteger(amount)

  const senderAddress = keyPair.getAddress()

  const { inputs, fee: txfee } = coinSelect(
    utxos,
    [{ value: amount, address: to }],
    feeRate,
  )

  if (inputs == null) {
    throw new Error("could not find UTXOs to build transaction")
  }

  const txb = new TransactionBuilder(keyPair.getNetwork())

  let vinSum = new BigNumber(0)
  for (const input of inputs) {
    txb.addInput(input.hash, input.outputIndex)
    vinSum = vinSum.plus(input.value)
  }

  txb.addOutput(to, amount)

  const change = vinSum
    .minus(txfee)
    .minus(amount)
    .toNumber()
  if (change > 0) {
    txb.addOutput(senderAddress, change)
  }

  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, keyPair)
  }
  return txb.build().toHex()
}

/**
 * Build a create-contract transaction
 *
 * @param keyPair
 * @param code The contract byte code
 * @param feeRate Fee per byte of tx. (unit: satoshi)
 * @param utxoList
 * @returns the built tx
 */
export async function buildCreateContractTransaction(
  utxos: IUTXO[],
  keyPair: ECPair,
  code: string,
  feeRate: number,
  opts: IContractCreateTXOptions = {},
  network: INetworkInfo
): Promise<string> {
  const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit
  const infoRes = await Insight.forNetwork(network).getBlockchainInfo()
  const gasPrice = Math.round(parseFloat(infoRes.gasPrice) * 1e8)
  const gasLimitFee = new BigNumber(gasLimit).times(gasPrice).toNumber()

  const createContractScript = BTCScript.compile([
    OPS.OP_4,
    encodeCScriptInt(gasLimit),
    Buffer.from(code, "hex"),
    OPS.OP_CREATE,
  ])

  const fromAddress = keyPair.getAddress()
  const amount = 0

  const { inputs, fee: txfee } = coinSelect(
    utxos,
    [
      // gas fee
      { value: gasLimitFee },
      // script + transfer amount to contract
      { script: createContractScript, value: amount },
    ],
    feeRate,
  )

  if (inputs == null) {
    throw new Error("could not find UTXOs to build transaction")
  }

  const txb = new TransactionBuilder(keyPair.getNetwork())

  let totalValue = new BigNumber(0)
  for (const input of inputs) {
    txb.addInput(input.hash, input.outputIndex)
    totalValue = totalValue.plus(input.value)
  }

  // create-contract output
  txb.addOutput(createContractScript, 0)

  const change = totalValue
    .minus(txfee)
    .minus(gasLimitFee)
    .toNumber()

  if (change > 0) {
    txb.addOutput(fromAddress, change)
  }

  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, keyPair)
  }

  return txb.build().toHex()
}

const defaultContractSendTxOptions = {
  gasLimit: 250000,
  amount: 0,

  // Wallet uses only one address. Can't really support senderAddress.
  // senderAddress
}

export async function estimateSendToContractTransactionMaxValue(
  utxos: IUTXO[],
  keyPair: ECPair,
  contractAddress: string,
  encodedData: string,
  feeRate: number,
  opts: IContractSendTXOptions = {},
  network: INetworkInfo
): Promise<number> {
  feeRate = Math.floor(feeRate)

  const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit
  const infoRes = await Insight.forNetwork(network).getBlockchainInfo()
  const gasPrice = Math.round(parseFloat(infoRes.gasPrice) * 1e8)

  let amount = 0
  for (const utxo of utxos) {
    amount += utxo.value
  }

  amount -= gasLimit * gasPrice
  ensureAmountInteger(amount)

  const senderAddress = keyPair.getAddress()

  // excess gas will refund in the coinstake tx of the mined block
  const gasLimitFee = new BigNumber(gasLimit).times(gasPrice).toNumber()

  const opcallScript = BTCScript.compile([
    OPS.OP_4,
    encodeCScriptInt(gasLimit),
    Buffer.from(encodedData, "hex"),
    Buffer.from(contractAddress, "hex"),
    OPS.OP_CALL,
  ])

  while (amount > 0) {
    const { inputs, fee: txfee } = coinSelect(
      utxos,
      [
        { value: gasLimitFee }, // gas fee
        { script: opcallScript, value: amount }, // script + transfer amount to contract
      ],
      feeRate,
    )

    if (inputs != null) {
      return amount
    }

    amount -= 10000
  }

  return 0
}
/**
 * Build a send-to-contract transaction
 *
 * @param keyPair
 * @param contractAddress
 * @param encodedData
 * @param feeRate Fee per byte of tx. (unit: satoshi / byte)
 * @param utxoList
 * @returns the built tx
 */
export async function buildSendToContractTransaction(
  utxos: IUTXO[],
  keyPair: ECPair,
  contractAddress: string,
  encodedData: string,
  feeRate: number,
  opts: IContractSendTXOptions = {},
  network: INetworkInfo
): Promise<string> {
  // feeRate must be an integer number, or coinselect would always fail
  feeRate = Math.floor(feeRate)

  const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit
  const infoRes = await Insight.forNetwork(network).getBlockchainInfo()
  const gasPrice = Math.round(parseFloat(infoRes.gasPrice) * 1e8)
  const amount = opts.amount || defaultContractSendTxOptions.amount

  ensureAmountInteger(amount)

  const senderAddress = keyPair.getAddress()

  // excess gas will refund in the coinstake tx of the mined block
  const gasLimitFee = new BigNumber(gasLimit).times(gasPrice).toNumber()

  const opcallScript = BTCScript.compile([
    OPS.OP_4,
    encodeCScriptInt(gasLimit),
    Buffer.from(encodedData, "hex"),
    Buffer.from(contractAddress, "hex"),
    OPS.OP_CALL,
  ])

  const { inputs, fee: txfee } = coinSelect(
    utxos,
    [
      { value: gasLimitFee }, // gas fee
      { script: opcallScript, value: amount }, // script + transfer amount to contract
    ],
    feeRate,
  )

  if (inputs == null) {
    throw new Error("could not find UTXOs to build transaction")
  }

  const txb = new TransactionBuilder(keyPair.getNetwork())

  // add inputs to txb
  let vinSum = new BigNumber(0)
  for (const input of inputs) {
    txb.addInput(input.hash, input.outputIndex)
    vinSum = vinSum.plus(input.value)
  }

  // send-to-contract output
  txb.addOutput(opcallScript, amount)

  // change output (in satoshi)
  const change = vinSum
    .minus(txfee)
    .minus(gasLimitFee)
    .minus(amount)
    .toNumber()
  if (change > 0) {
    txb.addOutput(senderAddress, change)
  }

  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, keyPair)
  }

  return txb.build().toHex()
}

// The prevalent network fee is 0.004 per KB. If set to 100 times of norm, assume error.
const MAX_FEE_RATE = Math.ceil((2.222222 * 100 * 1e8) / 1024)

function checkFeeRate(feeRate: number) {
  if (feeRate > MAX_FEE_RATE) {
    throw new Error("Excessive tx fees, is set to 100 times of norm.")
  }
}
