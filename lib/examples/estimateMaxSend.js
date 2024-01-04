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
Object.defineProperty(exports, "__esModule", { value: true });
const Network_1 = require("../Network");
const wallet = Network_1.networks.testnet.fromMnemonic("hold struggle ready lonely august napkin enforce retire pipe where avoid drip");
const utxos = require("../../utxos.json");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const maxSend = yield wallet.sendEstimateMaxValue(wallet.address);
        console.log("max send", maxSend / 1e8);
        const maxContractSend = yield wallet.contractSendEstimateMaxValue(wallet.address, "00aabbcc", {
            gasLimit: 250000,
        });
        console.log("maxContractSend", maxContractSend / 1e8);
    });
}
main().catch((err) => console.log("err", err));
//# sourceMappingURL=estimateMaxSend.js.map