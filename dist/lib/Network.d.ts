import { Wallet } from "./Wallet";
import { Insight } from "./Insight";
import { IScryptParams } from "./scrypt";
export { NetworkNames } from "./constants";
export interface INetworkInfo {
    name: string;
    messagePrefix: string;
    bech32: string;
    bip32: {
        public: number;
        private: number;
    };
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
}
export declare const networksInfo: {
    [key: string]: INetworkInfo;
};
export declare class Network {
    info: INetworkInfo;
    constructor(info: INetworkInfo);
    /**
     * Restore a HD-wallet address from mnemonic & password
     *
     * @param mnemonic
     * @param password
     *
     */
    fromMnemonic(mnemonic: string, password?: string): Wallet;
    /**
     * constructs a wallet from bip38 encrypted private key
     * @param encrypted private key string
     * @param passhprase password
     * @param scryptParams scryptParams
     */
    fromEncryptedPrivateKey(encrypted: string, passhprase: string, scryptParams?: IScryptParams): Wallet;
    /**
     * Restore 10 wallet addresses exported from HYDRA's mobile clients. These
     * wallets are 10 sequential addresses rooted at the HD-wallet path
     * `m/88'/0'/0'` `m/88'/0'/1'` `m/88'/0'/2'`, and so on.
     *
     * @param mnemonic
     * @param network
     */
    fromMobile(mnemonic: string): Wallet[];
    /**
     * Restore wallet from private key specified in WIF format:
     *
     * See: https://en.bitcoin.it/wiki/Wallet_import_format
     *
     * @param wif
     */
    fromWIF(wif: string): Wallet;
    /**
     * Alias for `fromWIF`
     * @param wif
     */
    fromPrivateKey(wif: string): Wallet;
    insight(): Insight;
}
export declare const networks: {
    mainnet: Network;
    testnet: Network;
};
