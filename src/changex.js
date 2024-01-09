const hydrajs = require("bitcoinjs-lib");
hydrajs.networks = {
  hydra: {
    messagePrefix: "\x15HYDRA Signed Message:\n",
    bech32: "hc",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x28,
    scriptHash: 0x3f,
    wif: 0x80,
  },
  hydra_testnet: {
    messagePrefix: "\x15HYDRA Signed Message:\n",
    bech32: "th",
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x42,
    scriptHash: 0x80,
    wif: 0xef,
  },
};

var BigNumber = require("bignumber.js");

var UTXO_MIN_VALUE = 100;

global.optimize = function (utxos, privKey, satPerByte) {
  // Filter the utxos so that they don't have value less than 0.04 HYDRA or 100
  var validUTXOs = filterUtxos(utxos);
  if (validUTXOs.length == 0) {
    return {
      hex: "",
      error: "No UTXOs to optimize.",
    };
  }

  // Sort them by size so it optimize the small ones first
  validUTXOs.sort((lhs, rhs) => {
    return new BigNumber(lhs.value).minus(rhs.value);
  });

  // Calculate the total balance
  var balance = sumUTXOs(validUTXOs);
  if (balance.lte(new BigNumber(UTXO_MIN_VALUE).times(1e8))) {
    return {
      hex: "",
      error: "Not enough balance for minimum UTXO.",
    };
  }

  ///////

  var fee;
  var outputs;

  // Calculate the total outputs with value of UTXO_MIN_VALUE
  var totalOutputs = balance.dividedToIntegerBy(
    new BigNumber(UTXO_MIN_VALUE).times(1e8)
  );
  if (totalOutputs > 100) {
    // If more than 100 => therefore the balance is over 10000 => 100 outputs with 100 and 1 with the change
    outputs = 101;
    validUTXOs = selectUTXOs(
      validUTXOs,
      satPerByte,
      new BigNumber(UTXO_MIN_VALUE).times(1e8).times(100).toNumber(),
      outputs
    );
    console.log(validUTXOs.length);

    balance = sumUTXOs(validUTXOs);
  } else {
    outputs = totalOutputs;
  }

  // Load the wallet from the private key
  var keyPair = hydrajs.ECPair.fromPrivateKey(Buffer.from(privKey, "hex"));

  var tx = new hydrajs.TransactionBuilder(keyPair.network);

  // Get the walet address
  var from = hydrajs.payments.p2pkh({ pubkey: keyPair.publicKey }).address;

  //Calculate the value for the transaction
  var value = new BigNumber(UTXO_MIN_VALUE).times(1e8).times(outputs);

  // Calculate fee with the current inputs and outputs
  fee = calculateFee(validUTXOs, outputs, satPerByte, keyPair);
  console.log(validUTXOs.length);
  console.log(fee.toNumber());
  if (fee.gt(balance)) {
    return {
      hex: "",
      error: "Not enough balance to pay fee.",
    };
  }
  //Remove one output if not enough balance for value + fee
  if (balance.minus(fee).lt(value)) {
    outputs -= 1;
    value = value.minus(new BigNumber(UTXO_MIN_VALUE).times(1e8));
  }
  // If after the substitution the value is less than the minimum utxo value no point for transaction
  if (value.lt(new BigNumber(UTXO_MIN_VALUE).times(1e8))) {
    return {
      hex: "",
      error: "No enough balance for minimum UTXO.",
    };
  }
  // Add the inputs
  for (var i = 0; i < validUTXOs.length; i++) {
    tx.addInput(validUTXOs[i].txid, validUTXOs[i].vout);
  }

  // Add the outputs
  tx.addOutput(
    from,
    balance
      .minus(fee)
      .minus(new BigNumber(outputs - 1).times(UTXO_MIN_VALUE).times(1e8))
      .toNumber()
  );
  for (var i = 0; i < outputs - 1; i++) {
    tx.addOutput(from, new BigNumber(UTXO_MIN_VALUE).times(1e8).toNumber());
  }

  // Sign the inputs
  for (var i = 0; i < validUTXOs.length; i++) {
    tx.sign(i, keyPair);
  }
  return {
    hex: tx.build().toHex(),
    error: "",
  };
};

function selectUTXOs(utxos, value, bytefee, outputs = 101) {
  var totalValue = new BigNumber(0);
  var selected = [];
  for (let utxo of utxos) {
    totalValue = totalValue.plus(utxo.value);
    selected.push(utxo);
    var txsize = selected.length * 102 + outputs * 31 + 10;
    if (totalValue.gt(txsize * bytefee + value)) {
      break;
    }
  }
  return selected;
}

/**
 *
 * @param {*} inputs the input utxos
 * @param {*} outputs the number of outputs
 * @param {*} satPerByte the fee in satoshis per byte
 * @param {*} keyPair
 * @returns the fee in satoshis
 */
function calculateFee(inputs, outputs, satPerByte, keyPair) {
  var tx = new hydrajs.TransactionBuilder(keyPair.network);
  var from = hydrajs.payments.p2pkh({ pubkey: keyPair.publicKey }).address;

  for (var i = 0; i < inputs.length; i++) {
    tx.addInput(inputs[i].txid, inputs[i].vout);
  }
  for (var i = 0; i <= outputs; i++) {
    tx.addOutput(from, new BigNumber(UTXO_MIN_VALUE).times(1e8).toNumber());
  }
  // Sign the inputs
  for (var i = 0; i < inputs.length; i++) {
    tx.sign(i, keyPair);
  }

  return new BigNumber(tx.build().toHex().length).times(satPerByte);
}

function sumUTXOs(utxos) {
  let sum = new BigNumber(0);
  for (let utxo of utxos) {
    sum = sum.plus(utxo.value);
  }
  return sum;
}

function filterUtxos(utxos) {
  return utxos.filter((utxo) => {
    const value = new BigNumber(utxo.value);
    if (value.gt(new BigNumber(4).times(1e6))) {
      if (!value.eq(new BigNumber(UTXO_MIN_VALUE).times(1e8))) {
        return true;
      }
    }
    return false;
  });
}
