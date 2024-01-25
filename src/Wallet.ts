import * as bip38 from "bip38";
import * as wif from "wif";
import { BigNumber } from "bignumber.js";

import { ECPair, HDNode, TransactionBuilder, In } from "bitcoinjs-lib";
import bitcoinMessage from "bitcoinjs-message";

import { INetworkInfo } from "./Network";
import { Insight } from "./Insight";
import {
  buildSendToContractTransaction,
  buildPubKeyHashTransaction,
  IUTXO,
  IContractSendTXOptions,
  ISendTxOptions,
  buildCreateContractTransaction,
  IContractCreateTXOptions,
  estimatePubKeyHashTransactionMaxSend,
  estimateSendToContractTransactionMaxValue,
} from "./tx";

import { params, IScryptParams } from "./scrypt";
import { ISuite } from "mocha";

/**
 * The default relay fee rate (per byte) if network cannot estimate how much to use.
 *
 * This value will be used for testnet.
 */
const defaultTxFeePerByte = Math.ceil((2.222222 * 1e8) / 1024);

export class Wallet {
  public address: string;
  private insight: Insight;

  constructor(public keyPair: ECPair, public network: INetworkInfo) {
    this.address = this.keyPair.getAddress();
    this.insight = Insight.forNetwork(this.network);
  }

  public toWIF(): string {
    return this.keyPair.toWIF();
  }

  /**
   * Get basic information about the wallet address.
   */
  public async getInfo(): Promise<Insight.IGetInfo> {
    return this.insight.getInfo(this.address);
  }

  public async getUTXOs(): Promise<Insight.IUTXO[]> {
    return this.insight.listUTXOs(this.address);
  }

  /**
   * Get information about the balance history of an address
   */
  public async getBalanceHistory(): Promise<Insight.IBalanceHistory[]> {
    return this.insight.getAddressBalanceHistory(this.address);
  }

  public async getTokenBalanceHistory(
    token: string
  ): Promise<Insight.ITokenBalanceHistory[]> {
    return this.insight.getAddressTokenBalanceHistory(this.address, token);
  }

  /**
   * get transactions by wallet address
   * @param pageNum page number
   */
  public async getTransactions(
    pageNum?: number
  ): Promise<Insight.IRawTransactions> {
    return this.insight.getTransactions(this.address);
  }

  public async getTransactionInfo(
    id: string
  ): Promise<Insight.IRawTransactionInfo> {
    return this.insight.getTransactionInfo(id);
  }

  /**
   * bip38 encrypted wip
   * @param passphrase
   * @param params scryptParams
   */
  public toEncryptedPrivateKey(
    passphrase: string,
    scryptParams: IScryptParams = params.bip38
  ): string {
    const { privateKey, compressed } = wif.decode(this.toWIF());

    return bip38.encrypt(
      privateKey,
      compressed,
      passphrase,
      undefined,
      scryptParams
    );
  }

  /**
   * Generate and sign a payment transaction.
   *
   * @param to The receiving address
   * @param amount The amount to transfer (in satoshi)
   * @param opts
   *
   * @returns The raw transaction as hexadecimal string
   */
  public async generateTx(
    to: string,
    amount: number,
    opts: ISendTxOptions = {}
  ): Promise<string> {
    const utxos = await this.getBitcoinjsUTXOs();
    const infoRes = await this.insight.getBlockchainInfo();
    const feeRate = Math.ceil(infoRes.feeRate * 1e5);

    return buildPubKeyHashTransaction(utxos, this.keyPair, to, amount, feeRate);
  }

  /**
   * Estimate the maximum value that could be sent from this wallet address.
   *
   * @param to The receiving address
   * @param opts
   *
   * @returns satoshi
   */
  public async sendEstimateMaxValue(
    to: string,
    opts: ISendTxOptions = {}
  ): Promise<number> {
    const utxos = await this.getBitcoinjsUTXOs();

    const infoRes = await this.insight.getBlockchainInfo();
    const feeRate = Math.ceil(infoRes.feeRate * 1e5);

    return estimatePubKeyHashTransactionMaxSend(utxos, to, feeRate);
  }

  /**
   * Send payment to a receiving address. The transaction is signed locally
   * using the wallet's private key, and the raw transaction submitted to a
   * remote API (without revealing the wallet's secret).
   *
   * @param to The receiving address
   * @param amount The amount to transfer (in satoshi)
   * @param opts
   * @return The raw transaction as hexadecimal string
   */
  public async send(
    to: string,
    amount: number,
    opts: ISendTxOptions = {}
  ): Promise<Insight.ISendRawTxResult> {
    const rawtx = await this.generateTx(to, amount, opts);
    return this.sendRawTx(rawtx);
  }

  /**
   * Submit a signed raw transaction to the network.
   *
   * @param rawtx Hex encoded raw transaction data.
   */
  public async sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult> {
    return this.insight.sendRawTx(rawtx);
  }

  /**
   * Generate a raw a send-to-contract transaction that invokes a contract's method.
   *
   * @param contractAddress
   * @param encodedData
   * @param opts
   */
  public async generateContractSendTx(
    contractAddress: string,
    encodedData: string,
    opts: IContractSendTXOptions = {}
  ): Promise<string> {
    const utxos = await this.getBitcoinjsUTXOs();

    const infoRes = await this.insight.getBlockchainInfo();
    const feeRate = Math.ceil(infoRes.feeRate * 1e5);

    // TODO: estimate the precise gasLimit

    return await buildSendToContractTransaction(
      utxos,
      this.keyPair,
      contractAddress,
      encodedData,
      feeRate,
      opts,
      this.network
    );
  }

  /**
   * Query a contract's method. It returns the result and logs of a simulated
   * execution of the contract's code.
   *
   * @param contractAddress Address of the contract in hexadecimal
   * @param encodedData The ABI encoded method call, and parameter values.
   * @param opts
   */
  public async contractCall(
    contractAddress: string,
    encodedData: string,
    opts: IContractSendTXOptions = {}
  ): Promise<Insight.IContractCall> {
    return this.insight.contractCall(contractAddress, encodedData, opts);
  }

  /**
   * Create a send-to-contract transaction that invokes a contract's method.
   *
   * @param contractAddress Address of the contract in hexadecimal
   * @param encodedData The ABI encoded method call, and parameter values.
   * @param opts
   */
  public async contractSend(
    contractAddress: string,
    encodedData: string,
    opts: IContractSendTXOptions = {}
  ): Promise<Insight.ISendRawTxResult> {
    const rawTx = await this.generateContractSendTx(
      contractAddress,
      encodedData,
      opts
    );
    return this.sendRawTx(rawTx);
  }

  /**
   * Estimate the maximum value that could be sent to a contract, substracting the amount reserved for gas.
   *
   * @param contractAddress Address of the contract in hexadecimal
   * @param encodedData The ABI encoded method call, and parameter values.
   * @param opts
   *
   * @returns satoshi
   */
  public async contractSendEstimateMaxValue(
    contractAddress: string,
    encodedData: string,
    opts: IContractSendTXOptions = {}
  ): Promise<number> {
    const utxos = await this.getBitcoinjsUTXOs();

    const infoRes = await this.insight.getBlockchainInfo();
    const feeRate = Math.ceil(infoRes.feeRate * 1e5);

    // TODO: estimate the precise gasLimit

    return await estimateSendToContractTransactionMaxValue(
      utxos,
      this.keyPair,
      contractAddress,
      encodedData,
      feeRate,
      opts,
      this.network
    );
  }

  /**
   * Massage UTXOs returned by the Insight API to UTXO format accepted by the
   * underlying hydrajs-lib.
   */
  public async getBitcoinjsUTXOs(): Promise<IUTXO[]> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const utxos = (await this.getUTXOs()).filter(
      (e) => e.confirmations >= 2000 || e.isStake == false
    );
    // FIXME: Generating another raw tx before the previous tx had be mined
    // could cause overlapping UXTOs to be used.

    // FIXME: make the two compatible...
    // massage UXTO to format accepted by bitcoinjs
    const bitcoinjsUTXOs: IUTXO[] = utxos.map((utxo) => ({
      ...utxo,
      pos: utxo.outputIndex,
      value: Number(utxo.value),
      hash: utxo.transactionId,
    }));

    return bitcoinjsUTXOs;
  }

  /**
   * The BIP32 HDNode, which may be used to derive new key pairs
   */
  public hdnode(): HDNode {
    const seed = this.keyPair.getPublicKeyBuffer();
    const hdnode = HDNode.fromSeedBuffer(seed, this.network)!;
    return hdnode;
  }

  /**
   * Use BIP32 to derive child wallets from the current wallet's keypair.
   * @param n The index of the child wallet to derive.
   */
  public deriveChildWallet(n = 0): Wallet {
    const childKeyPair = this.hdnode().deriveHardened(n).keyPair;
    return new Wallet(childKeyPair, this.network);
  }

  public async contractCreate(
    code: string,
    opts: IContractCreateTXOptions = {}
  ): Promise<Insight.ISendRawTxResult> {
    const rawTx = await this.generateCreateContractTx(code, opts);
    return this.sendRawTx(rawTx);
  }

  public async generateCreateContractTx(
    code: string,
    opts: IContractCreateTXOptions = {}
  ): Promise<string> {
    const utxos = await this.getBitcoinjsUTXOs();

    const infoRes = await this.insight.getBlockchainInfo();
    const feeRate = Math.ceil(infoRes.feeRate * 1e5);

    // TODO: estimate the precise gasLimit

    return await buildCreateContractTransaction(
      utxos,
      this.keyPair,
      code,
      feeRate,
      opts,
      this.network
    );
  }

  public async signMessage(msg: string): Promise<string> {
    const privateKey = this.keyPair.d.toBuffer(32);
    const signature = await bitcoinMessage.signAsync(
      msg,
      privateKey,
      this.keyPair.compressed,
      "\u0016HYDRA Signed Message:\n"
    );
    return signature.toString("base64");
  }

  public verifyMessage(
    msg: string,
    address: string,
    signature: string
  ): boolean {
    return bitcoinMessage.verify(
      msg,
      address,
      signature,
      "\u0016HYDRA Signed Message:\n"
    );
  }

  public async optimizeUTXOS(
    utxos: IUTXO[],
    keyPair: ECPair,
    feeRate: number
  ): Promise<{ hex: string; error: string }> {
    var tx = new TransactionBuilder(keyPair.network);
    var UTXO_MIN_VALUE = 100;
    var UTXO_THRESHOLD = 150;
    var fee: BigNumber;
    const from: string = this.address;
    let walletBalance: BigNumber = sumUTXOs(utxos);

    if (walletBalance.lte(new BigNumber(UTXO_MIN_VALUE).times(1e8))) {
      return {
        hex: "",
        error: `User's Balance is below or equal to the threshold of ${UTXO_MIN_VALUE} HYDRA. No UTXOs to optimize.`,
      };
    }

    var validUTXOs = filterUtxos(utxos);

    if (validUTXOs.length == 0) {
      return {
        hex: "",
        error: "No UTXOs to optimize.",
      };
    }

    var balanceOfValidUTXOS: BigNumber = sumUTXOs(validUTXOs);

    // get all  of the UTXOSs above the threshold  of the wallet
    var UTXOSofWalletAboveThreshold: IUTXO[] = utxos.filter((utxo: any) => {
      const value = new BigNumber(utxo.value);
      if (
        value.gt(new BigNumber(UTXO_THRESHOLD).times(1e8)) /// upper threshold for utxo filter is now 150
      ) {
        return true;
      }
      return false;
    });

    if (balanceOfValidUTXOS.gt(new BigNumber(UTXO_THRESHOLD).times(1e8))) {
      fee = calculateFee(validUTXOs, 1, feeRate, keyPair);

      addInputsOutputsAndSignInputs(validUTXOs, balanceOfValidUTXOS);

      return {
        hex: tx.build().toHex(),
        error: "",
      };
    } else if (
      balanceOfValidUTXOS.gt(new BigNumber(UTXO_MIN_VALUE).times(1e8)) &&
      UTXOSofWalletAboveThreshold.length === 0
    ) {
      fee = calculateFee(validUTXOs, 1, feeRate, keyPair);
      if (fee.gt(balanceOfValidUTXOS)) {
        return {
          hex: "",
          error: "Not enough balance to pay fee.",
        };
      }

      addInputsOutputsAndSignInputs(validUTXOs, balanceOfValidUTXOS);

      return {
        hex: tx.build().toHex(),
        error: "",
      };
    } else {
      let arrayOfValidUTXOSPlusFirstUTXOAboveThreshold: IUTXO[] = [
        ...validUTXOs,
        UTXOSofWalletAboveThreshold[0],
      ];

      fee = calculateFee(
        arrayOfValidUTXOSPlusFirstUTXOAboveThreshold,
        1,
        feeRate,
        keyPair
      );

      if (fee.gt(balanceOfValidUTXOS)) {
        return {
          hex: "",
          error: "Not enough balance to pay fee.",
        };
      }

      var balanceOfValidUTXOSPlusFirstUTXOAboveThreshold = sumUTXOs(
        arrayOfValidUTXOSPlusFirstUTXOAboveThreshold
      );

      addInputsOutputsAndSignInputs(
        arrayOfValidUTXOSPlusFirstUTXOAboveThreshold,
        balanceOfValidUTXOSPlusFirstUTXOAboveThreshold
      );

      return {
        hex: tx.build().toHex(),
        error: "",
      };
    }

    function calculateFee(
      inputs: IUTXO[],
      outputs: any,
      feeRate: any,
      keyPair: ECPair
    ) {
      var tx = new TransactionBuilder(keyPair.getNetwork());

      for (var i = 0; i < inputs.length; i++) {
        ///adds the inputs to the tx
        tx.addInput(inputs[i].hash, inputs[i].outputIndex);
      }
      for (var i = 0; i <= outputs; i++) {
        tx.addOutput(from, new BigNumber(UTXO_MIN_VALUE).times(1e8).toNumber());
      }
      // Sign the inputs
      for (var i = 0; i < inputs.length; i++) {
        tx.sign(i, keyPair);
      }

      return new BigNumber(tx.build().toHex().length).times(feeRate);
    }
    function filterUtxos(utxos: Array<IUTXO>) {
      return utxos.filter((utxo: any) => {
        const value = new BigNumber(utxo.value);

        if (
          value.gt(new BigNumber(25).times(1e6)) &&
          value.lt(new BigNumber(UTXO_THRESHOLD).times(1e8))
        ) {
          return true;
        }
        return false;
      });
    }

    function addInputsOutputsAndSignInputs(
      arrayOfUTXOSForInput: Array<IUTXO>,
      ouputAmount: any
    ) {
      // Add the inputs
      for (var i = 0; i < arrayOfUTXOSForInput.length; i++) {
        tx.addInput(
          arrayOfUTXOSForInput[i].hash,
          arrayOfUTXOSForInput[i].outputIndex
        );
      }

      // Add the outputs
      tx.addOutput(from, ouputAmount.minus(fee).toNumber());

      // Sign the inputs
      for (var i = 0; i < arrayOfUTXOSForInput.length; i++) {
        tx.sign(i, keyPair);
      }
    }

    function sumUTXOs(utxos: Array<IUTXO>) {
      let sum = new BigNumber(0);
      for (let utxo of utxos) {
        sum = sum.plus(utxo.value);
      }
      return sum;
    }
  }

  public async optimizeWalletUTXOS(): Promise<
    Insight.ISendRawTxResult | string
  > {
    const utxos: IUTXO[] = await this.getBitcoinjsUTXOs();
    const infoRes: any = await this.insight.getBlockchainInfo();
    const feeRate: number = Math.ceil(infoRes.feeRate * 1e5);
    let txResponse: { hex: string; error: string } = await this.optimizeUTXOS(
      utxos,
      this.keyPair,
      feeRate
    );
    return txResponse.hex !== ""
      ? await this.sendRawTx(txResponse.hex)
      : txResponse.error;
  }

  public async splitUTXOS(
    utxos: IUTXO[],
    keyPair: ECPair,
    feeRate: number,
    utxoMinValue: number,
    utxoMaxValue: number,
    resultingUTXO: number //resultingUTXO
  ): Promise<{ hex: string; error: string }> {
    var validUTXOs = filterUtxosOutsideRange(utxos, utxoMinValue, utxoMaxValue);

    if (validUTXOs.length == 0) {
      return {
        hex: "",
        error: "No valid UTXOs to split.",
      };
    }
    // Sort them by size so it optimize the small ones first
    validUTXOs.sort((lhs, rhs) => {
      const lhsValue = new BigNumber(lhs.value);
      const rhsValue = new BigNumber(rhs.value);
      return lhsValue.minus(rhsValue).toNumber();
    });

    // Calculate the total balance
    var balance = sumUTXOs(validUTXOs);

    if (balance.lte(new BigNumber(resultingUTXO).times(1e8))) {
      return {
        hex: "",
        error: "Not enough balance for minimum UTXO.",
      };
    }

    var fee: BigNumber;
    var outputs: number;

    // Calculate the total outputs with value of resultingUTXO
    var totalOutputs = balance.dividedToIntegerBy(
      new BigNumber(resultingUTXO).times(1e8)
    );

    if (totalOutputs.toNumber() > 100) {
      // If more than 100 => therefore the balance is over 10000 => 100 outputs with 100 and 1 with the change
      outputs = 101;
      validUTXOs = selectUTXOs(
        validUTXOs,
        feeRate,
        new BigNumber(resultingUTXO).times(1e8).times(100).toNumber(),
        outputs
      );
      balance = sumUTXOs(validUTXOs);
    } else {
      outputs = totalOutputs.toNumber();
    }

    var tx = new TransactionBuilder(keyPair.network);

    // Get the walet address
    var from: string = this.address;
    //Calculate the value for the transaction
    var value = new BigNumber(resultingUTXO).times(1e8).times(outputs);

    // Calculate fee with the current inputs and outputs
    fee = calculateFee(validUTXOs, outputs, feeRate, keyPair);
    if (fee.gt(balance)) {
      return {
        hex: "",
        error: "Not enough balance to pay fee.",
      };
    }

    //Remove one output if not enough balance for value + fee
    if (balance.minus(fee).lt(value)) {
      outputs -= 1;
      value = value.minus(new BigNumber(resultingUTXO).times(1e8));
    }
    // If after the substitution the value is less than the minimum utxo value no point for transaction
    if (value.lt(new BigNumber(resultingUTXO).times(1e8))) {
      return {
        hex: "",
        error: "No enough balance for minimum UTXO.",
      };
    }

    // Add the inputs
    for (var i = 0; i < validUTXOs.length; i++) {
      tx.addInput(validUTXOs[i].hash, validUTXOs[i].outputIndex);
    }
    // Add the outputs
    tx.addOutput(
      from,
      balance
        .minus(fee)
        .minus(new BigNumber(outputs - 1).times(resultingUTXO).times(1e8))
        .toNumber()
    );
    for (var i = 0; i < outputs - 1; i++) {
      tx.addOutput(from, new BigNumber(resultingUTXO).times(1e8).toNumber());
    }

    // Sign the inputs
    for (var i = 0; i < validUTXOs.length; i++) {
      tx.sign(i, keyPair);
    }
    return {
      hex: tx.build().toHex(),
      error: "",
    };

    //////////////////SUPPORT FUNCTIONS  [SPLIT UTXO] /////////////////////

    function filterUtxosOutsideRange(
      utxos: Array<IUTXO>,
      utxoMinValue: number,
      utxoMaxValue: number
    ) {
      return utxos.filter((utxo) => {
        const value = new BigNumber(utxo.value);

        // Check if the UTXO value is outside the specified range
        return (
          value.lt(new BigNumber(utxoMinValue).times(1e8)) ||
          value.gt(new BigNumber(utxoMaxValue).times(1e8))
        );
      });
    }
    //////
    function sumUTXOs(utxos: Array<IUTXO>) {
      let sum = new BigNumber(0);
      for (let utxo of utxos) {
        sum = sum.plus(utxo.value);
      }
      return sum;
    }
    /////////
    function selectUTXOs(
      utxos: Array<IUTXO>,
      value: any,
      bytefee: any,
      outputs = 101
    ) {
      var totalValue = new BigNumber(0);
      var selected = [];
      for (let utxo of utxos) {
        totalValue = totalValue.plus(utxo.value);
        selected.push(utxo);
        var txsize = selected.length * 102 + outputs * 31 + 10;
        if (totalValue.gt(`${txsize * bytefee + value}`)) {
          break;
        }
      }
      return selected;
    }
    ////////
    function calculateFee(
      inputs: IUTXO[],
      outputs: any,
      feeRate: any,
      keyPair: ECPair
    ) {
      var tx = new TransactionBuilder(keyPair.getNetwork());

      for (var i = 0; i < inputs.length; i++) {
        ///adds the inputs to the tx
        tx.addInput(inputs[i].hash, inputs[i].outputIndex);
      }
      for (var i = 0; i <= outputs; i++) {
        tx.addOutput(from, new BigNumber(resultingUTXO).times(1e8).toNumber());
      }
      // Sign the inputs
      for (var i = 0; i < inputs.length; i++) {
        tx.sign(i, keyPair);
      }

      // Calculate the total fee
      const totalFee = new BigNumber(tx.build().toHex().length).times(feeRate);

      // Calculate and return half of the fee
      const halfFee = totalFee.dividedBy(2);

      return halfFee;
    }

    //////////////////SUPPORT FUNCTIONS [SPLIT UTXO]/////////////////////
  }

  public async splitWalletUTXOS(
    utxoMinValue: number,
    utxoMaxValue: number,
    utxoThreshold: number // resultingUTXO
  ): Promise<Insight.ISendRawTxResult | string> {
    try {
      // Retrieve UTXOs from the wallet
      const utxos: IUTXO[] = await this.getBitcoinjsUTXOs();

      // Retrieve blockchain information to get the fee rate
      const infoRes: any = await this.insight.getBlockchainInfo();

      // Calculate the fee rate for the transaction
      const feeRate: number = Math.ceil(infoRes.feeRate * 1e5);

      // Split UTXOs based on specified parameters
      let txResponse: { hex: string; error: string } = await this.splitUTXOS(
        utxos,
        this.keyPair,
        feeRate,
        utxoMinValue || 0.001,
        utxoMaxValue || 200,
        utxoThreshold || 100
      );

      // If a valid transaction hex is generated, send the transaction
      return txResponse.hex !== ""
        ? await this.sendRawTx(txResponse.hex)
        : txResponse.error || "Unknown error";
    } catch (error) {
      // Log any unexpected errors
      console.log(
        "[:SPLIT UTXO::ERROR :]:-Error in optimizeWalletUTXOS:",
        error
      );
      return "Unexpected error occurred";
    }
  }
}

// TODO
// hrc20 lookup
// estimateCall
