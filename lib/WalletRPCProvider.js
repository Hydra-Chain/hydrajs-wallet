"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRPCProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class WalletRPCProvider {
    constructor(wallet) {
        this.wallet = wallet;
    }
    rawCall(method, params = [], opts = {}) {
        const [contractAddress, encodedData, 
        // these are optionals
        amount, gasLimit] = params;
        const senderAddress = method.toLowerCase() === 'sendtocontract' ? params[5] : params[2];
        const amountInSatoshi = Math.floor((amount || 0) * 1e8);
        opts = Object.assign(Object.assign({}, opts), { amount: amountInSatoshi, gasLimit: gasLimit || 200000, sender: senderAddress || '' });
        switch (method.toLowerCase()) {
            case "sendtocontract":
                return this.wallet.contractSend(contractAddress, encodedData, opts);
            case "callcontract":
                return this.wallet.contractCall(contractAddress, encodedData, opts);
            default:
                throw new Error("Unknow method call");
        }
    }
    cancelTokenSource() {
        return axios_1.default.CancelToken.source();
    }
}
exports.WalletRPCProvider = WalletRPCProvider;
//# sourceMappingURL=WalletRPCProvider.js.map