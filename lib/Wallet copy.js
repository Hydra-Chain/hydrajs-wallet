"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const bip38 = __importStar(require("bip38"));
const wif = __importStar(require("wif"));
const bignumber_js_1 = require("bignumber.js");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bitcoinjs_message_1 = __importDefault(require("bitcoinjs-message"));
const Insight_1 = require("./Insight");
const tx_1 = require("./tx");
const scrypt_1 = require("./scrypt");
/**
 * The default relay fee rate (per byte) if network cannot estimate how much to use.
 *
 * This value will be used for testnet.
 */
const defaultTxFeePerByte = Math.ceil((2.222222 * 1e8) / 1024);
class Wallet {
    constructor(keyPair, network) {
        this.keyPair = keyPair;
        this.network = network;
        this.address = this.keyPair.getAddress();
        this.insight = Insight_1.Insight.forNetwork(this.network);
    }
    toWIF() {
        return this.keyPair.toWIF();
    }
    /**
     * Get basic information about the wallet address.
     */
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.getInfo(this.address);
        });
    }
    getUTXOs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.listUTXOs(this.address);
        });
    }
    /**
     * Get information about the balance history of an address
     */
    getBalanceHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.getAddressBalanceHistory(this.address);
        });
    }
    getTokenBalanceHistory(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.getAddressTokenBalanceHistory(this.address, token);
        });
    }
    /**
     * get transactions by wallet address
     * @param pageNum page number
     */
    getTransactions(pageNum) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.getTransactions(this.address);
        });
    }
    getTransactionInfo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.getTransactionInfo(id);
        });
    }
    /**
     * bip38 encrypted wip
     * @param passphrase
     * @param params scryptParams
     */
    toEncryptedPrivateKey(passphrase, scryptParams = scrypt_1.params.bip38) {
        const { privateKey, compressed } = wif.decode(this.toWIF());
        return bip38.encrypt(privateKey, compressed, passphrase, undefined, scryptParams);
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
    generateTx(to, amount, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            return tx_1.buildPubKeyHashTransaction(utxos, this.keyPair, to, amount, feeRate);
        });
    }
    /**
     * Estimate the maximum value that could be sent from this wallet address.
     *
     * @param to The receiving address
     * @param opts
     *
     * @returns satoshi
     */
    sendEstimateMaxValue(to, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            return tx_1.estimatePubKeyHashTransactionMaxSend(utxos, to, feeRate);
        });
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
    send(to, amount, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawtx = yield this.generateTx(to, amount, opts);
            return this.sendRawTx(rawtx);
        });
    }
    /**
     * Submit a signed raw transaction to the network.
     *
     * @param rawtx Hex encoded raw transaction data.
     */
    sendRawTx(rawtx) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.sendRawTx(rawtx);
        });
    }
    /**
     * Generate a raw a send-to-contract transaction that invokes a contract's method.
     *
     * @param contractAddress
     * @param encodedData
     * @param opts
     */
    generateContractSendTx(contractAddress, encodedData, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            // TODO: estimate the precise gasLimit
            return yield tx_1.buildSendToContractTransaction(utxos, this.keyPair, contractAddress, encodedData, feeRate, opts, this.network);
        });
    }
    /**
     * Query a contract's method. It returns the result and logs of a simulated
     * execution of the contract's code.
     *
     * @param contractAddress Address of the contract in hexadecimal
     * @param encodedData The ABI encoded method call, and parameter values.
     * @param opts
     */
    contractCall(contractAddress, encodedData, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insight.contractCall(contractAddress, encodedData, opts);
        });
    }
    /**
     * Create a send-to-contract transaction that invokes a contract's method.
     *
     * @param contractAddress Address of the contract in hexadecimal
     * @param encodedData The ABI encoded method call, and parameter values.
     * @param opts
     */
    contractSend(contractAddress, encodedData, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawTx = yield this.generateContractSendTx(contractAddress, encodedData, opts);
            return this.sendRawTx(rawTx);
        });
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
    contractSendEstimateMaxValue(contractAddress, encodedData, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            // TODO: estimate the precise gasLimit
            return yield tx_1.estimateSendToContractTransactionMaxValue(utxos, this.keyPair, contractAddress, encodedData, feeRate, opts, this.network);
        });
    }
    /**
     * Massage UTXOs returned by the Insight API to UTXO format accepted by the
     * underlying hydrajs-lib.
     */
    getBitcoinjsUTXOs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => setTimeout(resolve, 5000));
            const utxos = (yield this.getUTXOs()).filter((e) => e.confirmations >= 2000 || e.isStake == false);
            // FIXME: Generating another raw tx before the previous tx had be mined
            // could cause overlapping UXTOs to be used.
            // FIXME: make the two compatible...
            // massage UXTO to format accepted by bitcoinjs
            const bitcoinjsUTXOs = utxos.map((utxo) => (Object.assign(Object.assign({}, utxo), { pos: utxo.outputIndex, value: Number(utxo.value), hash: utxo.transactionId })));
            return bitcoinjsUTXOs;
        });
    }
    /**
     * The BIP32 HDNode, which may be used to derive new key pairs
     */
    hdnode() {
        const seed = this.keyPair.getPublicKeyBuffer();
        const hdnode = bitcoinjs_lib_1.HDNode.fromSeedBuffer(seed, this.network);
        return hdnode;
    }
    /**
     * Use BIP32 to derive child wallets from the current wallet's keypair.
     * @param n The index of the child wallet to derive.
     */
    deriveChildWallet(n = 0) {
        const childKeyPair = this.hdnode().deriveHardened(n).keyPair;
        return new Wallet(childKeyPair, this.network);
    }
    contractCreate(code, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawTx = yield this.generateCreateContractTx(code, opts);
            return this.sendRawTx(rawTx);
        });
    }
    generateCreateContractTx(code, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            // TODO: estimate the precise gasLimit
            return yield tx_1.buildCreateContractTransaction(utxos, this.keyPair, code, feeRate, opts, this.network);
        });
    }
    signMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const privateKey = this.keyPair.d.toBuffer(32);
            const signature = yield bitcoinjs_message_1.default.signAsync(msg, privateKey, this.keyPair.compressed, "\u0016HYDRA Signed Message:\n");
            return signature.toString("base64");
        });
    }
    verifyMessage(msg, address, signature) {
        return bitcoinjs_message_1.default.verify(msg, address, signature, "\u0016HYDRA Signed Message:\n");
    }
    optimizeUTXOS(utxos, keyPair, feeRate, utxoMinValue, utxoThreshold) {
        return __awaiter(this, void 0, void 0, function* () {
            var tx = new bitcoinjs_lib_1.TransactionBuilder(keyPair.network);
            var fee;
            const from = this.address;
            let walletBalance = sumUTXOs(utxos);
            if (walletBalance.lte(new bignumber_js_1.BigNumber(utxoMinValue).times(1e8))) {
                return {
                    hex: "",
                    error: `User's Balance is below or equal to the threshold of ${utxoMinValue} HYDRA. No UTXOs to optimize.`,
                };
            }
            var validUTXOs = filterUtxos(utxos, utxoThreshold);
            if (validUTXOs.length == 0) {
                return {
                    hex: "",
                    error: "No UTXOs to optimize.",
                };
            }
            var balanceOfValidUTXOS = sumUTXOs(validUTXOs);
            ///////
            // get all  of the UTXOSs above the threshold  of the wallet
            var UTXOSofWalletAboveThreshold = utxos.filter((utxo) => {
                const value = new bignumber_js_1.BigNumber(utxo.value);
                if (value.gt(new bignumber_js_1.BigNumber(utxoThreshold).times(1e8)) /// upper threshold for utxo filter is now 150
                ) {
                    return true;
                }
                return false;
            });
            if (balanceOfValidUTXOS.gt(new bignumber_js_1.BigNumber(utxoThreshold).times(1e8))) {
                fee = calculateFee(validUTXOs, 1, feeRate, keyPair);
                addInputsOutputsAndSignInputs(validUTXOs, balanceOfValidUTXOS);
                return {
                    hex: tx.build().toHex(),
                    error: "",
                };
            }
            else if (balanceOfValidUTXOS.gt(new bignumber_js_1.BigNumber(utxoMinValue).times(1e8)) &&
                UTXOSofWalletAboveThreshold.length === 0) {
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
            }
            else {
                let arrayOfValidUTXOSPlusFirstUTXOAboveThreshold = [
                    ...validUTXOs,
                    UTXOSofWalletAboveThreshold[0],
                ];
                fee = calculateFee(arrayOfValidUTXOSPlusFirstUTXOAboveThreshold, 1, feeRate, keyPair);
                if (fee.gt(balanceOfValidUTXOS)) {
                    return {
                        hex: "",
                        error: "Not enough balance to pay fee.",
                    };
                }
                var balanceOfValidUTXOSPlusFirstUTXOAboveThreshold = sumUTXOs(arrayOfValidUTXOSPlusFirstUTXOAboveThreshold);
                addInputsOutputsAndSignInputs(arrayOfValidUTXOSPlusFirstUTXOAboveThreshold, balanceOfValidUTXOSPlusFirstUTXOAboveThreshold);
                return {
                    hex: tx.build().toHex(),
                    error: "",
                };
            }
            function calculateFee(inputs, outputs, feeRate, keyPair) {
                var tx = new bitcoinjs_lib_1.TransactionBuilder(keyPair.getNetwork());
                for (var i = 0; i < inputs.length; i++) {
                    ///adds the inputs to the tx
                    tx.addInput(inputs[i].hash, inputs[i].outputIndex);
                }
                for (var i = 0; i <= outputs; i++) {
                    tx.addOutput(from, new bignumber_js_1.BigNumber(utxoMinValue).times(1e8).toNumber());
                }
                // Sign the inputs
                for (var i = 0; i < inputs.length; i++) {
                    tx.sign(i, keyPair);
                }
                return new bignumber_js_1.BigNumber(tx.build().toHex().length).times(feeRate);
            }
            function filterUtxos(utxos, utxoThreshold) {
                return utxos.filter((utxo) => {
                    const value = new bignumber_js_1.BigNumber(utxo.value);
                    if (
                    //  if (value.gt(new BigNumber(4).times(1e6))) {
                    value.gt(new bignumber_js_1.BigNumber(25).times(1e6)) &&
                        value.lt(new bignumber_js_1.BigNumber(utxoThreshold).times(1e8))) {
                        return true;
                    }
                    return false;
                });
            }
            function addInputsOutputsAndSignInputs(arrayOfUTXOSForInput, ouputAmount) {
                // Add the inputs
                for (var i = 0; i < arrayOfUTXOSForInput.length; i++) {
                    tx.addInput(arrayOfUTXOSForInput[i].hash, arrayOfUTXOSForInput[i].outputIndex);
                }
                // Add the outputs
                tx.addOutput(from, ouputAmount.minus(fee).toNumber());
                // Sign the inputs
                for (var i = 0; i < arrayOfUTXOSForInput.length; i++) {
                    tx.sign(i, keyPair);
                }
            }
            function sumUTXOs(utxos) {
                let sum = new bignumber_js_1.BigNumber(0);
                for (let utxo of utxos) {
                    sum = sum.plus(utxo.value);
                }
                return sum;
            }
        });
    }
    optimizeWalletUTXOS(utxoMinValue, utxoThreshold) {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getBitcoinjsUTXOs();
            const infoRes = yield this.insight.getBlockchainInfo();
            const feeRate = Math.ceil(infoRes.feeRate * 1e5);
            let txResponse = yield this.optimizeUTXOS(utxos, this.keyPair, feeRate, utxoMinValue || 100, utxoThreshold || 150);
            return txResponse.hex !== ""
                ? yield this.sendRawTx(txResponse.hex)
                : txResponse.error;
        });
    }
}
exports.Wallet = Wallet;
// TODO
// hrc20 lookup
// estimateCall
//# sourceMappingURL=Wallet copy.js.map