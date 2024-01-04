"use strict";
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
exports.Insight = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
const INSIGHT_BASEURLS = {
    [constants_1.NetworkNames.MAINNET]: "https://explorer.hydrachain.org/api",
    [constants_1.NetworkNames.TESTNET]: "https://testexplorer.hydrachain.org/api"
};
class Insight {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.axios = axios_1.default.create({
            baseURL,
        });
    }
    // public static mainnet(): Insight {
    //   return new Insight(MAINNET_API_BASEURL)
    // }
    // public static testnet(): Insight {
    //   return new Insight(TESTNET_API_BASEURL)
    // }
    static forNetwork(network) {
        const baseURL = INSIGHT_BASEURLS[network.name];
        if (baseURL == null) {
            throw new Error(`No Insight API defined for network: ${network.name}`);
        }
        return new Insight(baseURL);
    }
    getBlockchainInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get('/info');
            return res.data;
        });
    }
    getAddressBalanceHistory(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get(`/address/${address}/balance-history`);
            return res.data.transactions;
        });
    }
    getAddressTokenBalanceHistory(address, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get(`/address/${address}/qrc20-balance-history/${token}`);
            return res.data.transactions;
        });
    }
    listUTXOs(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get(`/address/${address}/utxo`);
            return res.data;
        });
    }
    getInfo(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get(`/address/${address}`);
            let retVal = res.data;
            retVal.addrStr = address;
            return retVal;
        });
    }
    sendRawTx(rawtx) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.post("/tx/send", {
                rawtx,
            });
            return res.data;
        });
    }
    contractCall(address, encodedData, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.post(`/contract/${address}/call`, {
                data: encodedData,
                sender: opts.sender || undefined
            });
            return res.data;
        });
    }
    /**
     * Get single transaction's info
     * @param id
     */
    getTransactionInfo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.axios.get(`/tx/${id}`);
            return res.data;
        });
    }
    /**
     * Get multiple Transaction info (paginated)
     * @param address
     * @param pageNum
     */
    getTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.axios.get(`/address/${address}/basic-txs/`);
            return result.data;
        });
    }
}
exports.Insight = Insight;
//# sourceMappingURL=Insight.js.map