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
Object.defineProperty(exports, "__esModule", { value: true });
exports.networks = exports.Network = exports.networksInfo = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bip38 = __importStar(require("bip38"));
const bip39 = __importStar(require("bip39"));
const wifEncoder = __importStar(require("wif"));
const Wallet_1 = require("./Wallet");
const Insight_1 = require("./Insight");
const index_1 = require("./index");
const scrypt_1 = require("./scrypt");
const constants_1 = require("./constants");
var constants_2 = require("./constants");
Object.defineProperty(exports, "NetworkNames", { enumerable: true, get: function () { return constants_2.NetworkNames; } });
exports.networksInfo = {
    [constants_1.NetworkNames.MAINNET]: {
        name: constants_1.NetworkNames.MAINNET,
        messagePrefix: "\u0015HYDRA Signed Message:\n",
        bech32: "hc",
        bip32: { public: 76067358, private: 76066276 },
        pubKeyHash: 40,
        scriptHash: 63,
        wif: 128,
    },
    [constants_1.NetworkNames.TESTNET]: {
        name: constants_1.NetworkNames.TESTNET,
        messagePrefix: "\u0015HYDRA Signed Message:\n",
        bech32: "th",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 66,
        scriptHash: 128,
        wif: 239,
    }
};
class Network {
    constructor(info) {
        this.info = info;
    }
    /**
     * Restore a HD-wallet address from mnemonic & password
     *
     * @param mnemonic
     * @param password
     *
     */
    fromMnemonic(mnemonic, password) {
        // if (bip39.validateMnemonic(mnemonic) == false) return false
        const seedHex = bip39.mnemonicToSeedHex(mnemonic, password);
        const hdNode = bitcoinjs_lib_1.HDNode.fromSeedHex(seedHex, this.info);
        const account = hdNode
            .deriveHardened(88)
            .deriveHardened(0)
            .deriveHardened(0);
        const keyPair = account.keyPair;
        return new Wallet_1.Wallet(keyPair, this.info);
    }
    /**
     * constructs a wallet from bip38 encrypted private key
     * @param encrypted private key string
     * @param passhprase password
     * @param scryptParams scryptParams
     */
    fromEncryptedPrivateKey(encrypted, passhprase, scryptParams = scrypt_1.params.bip38) {
        const { privateKey, compressed } = bip38.decrypt(encrypted, passhprase, undefined, scryptParams);
        const decoded = wifEncoder.encode(this.info.wif, privateKey, compressed);
        return this.fromWIF(decoded);
    }
    /**
     * Restore 10 wallet addresses exported from HYDRA's mobile clients. These
     * wallets are 10 sequential addresses rooted at the HD-wallet path
     * `m/88'/0'/0'` `m/88'/0'/1'` `m/88'/0'/2'`, and so on.
     *
     * @param mnemonic
     * @param network
     */
    fromMobile(mnemonic) {
        const seedHex = bip39.mnemonicToSeedHex(mnemonic);
        const hdNode = bitcoinjs_lib_1.HDNode.fromSeedHex(seedHex, this.info);
        const account = hdNode.deriveHardened(88).deriveHardened(0);
        const wallets = [];
        for (let i = 0; i < 10; i++) {
            const hdnode = account.deriveHardened(i);
            const wallet = new Wallet_1.Wallet(hdnode.keyPair, this.info);
            wallets.push(wallet);
        }
        return wallets;
    }
    /**
     * Restore wallet from private key specified in WIF format:
     *
     * See: https://en.bitcoin.it/wiki/Wallet_import_format
     *
     * @param wif
     */
    fromWIF(wif) {
        if (!index_1.validatePrivateKey(wif)) {
            throw new Error("wif is invalid, it does not satisfy ECDSA");
        }
        const keyPair = bitcoinjs_lib_1.ECPair.fromWIF(wif, this.info);
        return new Wallet_1.Wallet(keyPair, this.info);
    }
    /**
     * Alias for `fromWIF`
     * @param wif
     */
    fromPrivateKey(wif) {
        return this.fromWIF(wif);
    }
    insight() {
        return Insight_1.Insight.forNetwork(this.info);
    }
}
exports.Network = Network;
const mainnet = new Network(exports.networksInfo[constants_1.NetworkNames.MAINNET]);
const testnet = new Network(exports.networksInfo[constants_1.NetworkNames.TESTNET]);
exports.networks = {
    mainnet,
    testnet
};
//# sourceMappingURL=Network.js.map