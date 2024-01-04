"use strict";
// https://blog.filippo.io/the-scrypt-parameters/
// https://go-review.googlesource.com/c/crypto/+/67070/3/scrypt/scrypt.go
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrypt = exports.params = void 0;
const hash_js_1 = require("hash.js");
const scryptsy = require("scryptsy");
exports.params = {
    bip38: {
        N: 16384,
        r: 8,
        p: 8,
    },
    golang: {
        N: 32768,
        r: 8,
        p: 1,
    },
    noop: {
        N: 2,
        r: 8,
        p: 1,
    },
};
// TODO: remove default export
exports.default = exports.params.bip38;
// helper function for scrypt
function scrypt(data, opts = {}) {
    const { N, r, p } = opts.params || exports.params.bip38;
    const salt = hash_js_1.sha256().update(data).digest("hex");
    const length = opts.length || 32;
    const result = scryptsy(data, salt, N, r, p, length, opts.progress);
    return result.toString("hex");
}
exports.scrypt = scrypt;
//# sourceMappingURL=scrypt.js.map