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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePrivateKey = exports.generateMnemonic = void 0;
__exportStar(require("./Wallet"), exports);
__exportStar(require("./Insight"), exports);
__exportStar(require("./Network"), exports);
__exportStar(require("./WalletRPCProvider"), exports);
const bip39 = __importStar(require("bip39"));
const wif_1 = require("wif");
const secp256k1_1 = require("secp256k1");
var scrypt_1 = require("./scrypt");
Object.defineProperty(exports, "scrypt", { enumerable: true, get: function () { return scrypt_1.scrypt; } });
function generateMnemonic() {
    return bip39.generateMnemonic();
}
exports.generateMnemonic = generateMnemonic;
function validatePrivateKey(wif) {
    try {
        const decoded = wif_1.decode(wif);
        return secp256k1_1.privateKeyVerify(decoded.privateKey);
    }
    catch (e) {
        return false;
    }
}
exports.validatePrivateKey = validatePrivateKey;
//# sourceMappingURL=index.js.map