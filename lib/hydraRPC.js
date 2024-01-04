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
exports.generateBlock = exports.rpcClient = void 0;
const hydrad_rpc_1 = __importDefault(require("hydrad-rpc"));
class HydraRPC {
    constructor(config) {
        this.rpc = new hydrad_rpc_1.default(config);
    }
    generate(nblocks) {
        return new Promise((resolve, reject) => {
            this.rpc.generate(1, (err, ret) => {
                if (err) {
                    reject(err);
                }
                resolve(ret);
            });
        });
    }
}
exports.default = HydraRPC;
exports.rpcClient = new HydraRPC({
    user: "username",
    pass: "password",
    port: "3389",
    protocol: "http",
});
function generateBlock(network) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.generateBlock = generateBlock;
//# sourceMappingURL=hydraRPC.js.map