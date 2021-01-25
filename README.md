# hydrajs-wallet

A toolkit for building HYDRA light wallets

This is a client-side wallet library that can generate private keys from a mnemonic, or import private keys from other HYDRA wallets.

It can sign transactions locally, and submit the raw transaction data to a remote HYDRA node. The blockchain data is provided by the Insight API (which powers https://explorer.hydrachain.org/), rather than the raw hydrad RPC calls.

This library makes it possible to run DApp without the users having to run a full HYDRA node.

## Install

```
yarn add hydrajs-wallet
```

# API

- [Networks](#networks)
  - [fromWIF](#fromwif)
  - [fromMnemonic](#frommnemonic)
  - [fromEncryptedPrivateKey](#fromencryptedprivatekey)
- [Wallet](#wallet)
  - [async wallet.getInfo](#async-walletgetinfo)
  - [async wallet.send](#async-walletsend)
  - [async wallet.sendEstimateMaxValue](#async-walletsendestimatemaxvalue)
  - [async wallet.generateTx](#async-walletgeneratetx)
  - [async wallet.contractSend](#async-walletcontractsend)
  - [async wallet.contractSendEstimateMaxValue](#async-walletcontractsendestimatemaxvalue)
  - [async wallet.generateContractSendTx](#async-walletgeneratecontractsendtx)
  - [async wallet.contractCall](#async-walletcontractcall)
  - [async getTransactions](#async-gettransactions)
  - [toEncryptedPrivateKey](#toencryptedprivatekey)
  - [deriveChildWallet](#derivechildwallet)

# Examples

## Create Mnemonic+Password Wallet

```js
import { networks, generateMnemonic } from "hydrajs-wallet";

async function main() {
  const network = networks.testnet;
  const mnemonic = generateMnemonic();
  const password = "password";

  const wallet = network.fromMnemonic(mnemonic, password);

  console.log("mnemonic:", mnemonic);
  console.log("public address:", wallet.address);
  console.log("private key (WIF):", wallet.toWIF());
}

main().catch(err => console.log(err));
```

Example Output:

```
mnemonic: hold struggle ready lonely august napkin enforce retire pipe where avoid drip
public address: TLUHmrFGexxpyHwQphLpE1czZNFE5m1xmV
private key (WIF): cNQKccYYQyGX9G9Qxq2DJev9jHygbZpb2UG7EvUapbtDx5XhkhYE
```

## Send Fund

This example restores a wallet from a private key (in [WIF](https://en.bitcoin.it/wiki/Wallet_import_format) format), then sending value to another address.

The transaction is signed locally, and the transaction submitted to a remote API.

The currency unit used is `satoshi`. To convert HYDRA to satoshi you should multiply the amount you want with `1e8`.

```js
import { networks } from "hydrajs-wallet";

async function main() {
  // Use the test network. Or `networks.mainnet`
  const network = networks.testnet;

  const wif = "cU4ficvRNvR7jnbtczCWo5s9rB9Tdg1U4LkArVpGU6cKnDq7LFoP";
  const wallet = network.fromWIF(wif);

  console.log(wallet.address);

  const toAddr = "TS3ThpDn4HRH9we2hZUdF3F3uR7TTvpZ9v";
  // Sending 0.1 HYDRA
  const sendtx = await wallet.send(toAddr, 0.01 * 1e8);
  console.log("sendtx", sendtx);
}

main().catch(err => console.log(err));
```

## Send To Contract

Let's burn some money using the `Burn` contract:

```solidity
pragma solidity ^0.4.18;

contract Burn {
  uint256 public totalburned;
  event DidBurn(address burnerAddress, uint256 burnedAmount);

  function burnbabyburn() public payable {
    totalburned = msg.value;
    DidBurn(msg.sender, msg.value);
  }
}
```

The ABI encoding for the `burnbabyburn()` invokation is `e179b912`. We'll burn 0.05 HYDRA, expressed in unit of satoshi.

```ts
import { networks } from "hydrajs-wallet";

async function main() {
  const network = networks.testnet;

  const privateKey = "cU4ficvRNvR7jnbtczCWo5s9rB9Tdg1U4LkArVpGU6cKnDq7LFoP";

  const wallet = network.fromWIF(privateKey);

  const contractAddress = "b10071ee33512ce8a0c06ecbc14a5f585a27a3e2";
  const encodedData = "e179b912"; // burnbabyburn()

  const tx = await wallet.contractSend(contractAddress, encodedData, {
    amount: 0.05 * 1e8 // 0.05 HYDRA in satoshi
  });

  console.log(tx);
}

main().catch(err => console.log(err));
```

# Networks

Two networks are predefined:

```js
import { networks } from "hydrajs-wallet";

// Main Network
networks.mainnet;

// Test Network
networks.testnet;
```

## fromPrivateKey

Alias for `fromWIF`.

## fromWIF

`fromWIF` constructs a wallet from private key (in [WIF](https://en.bitcoin.it/wiki/Wallet_import_format) format).

Suppose you want to import the public address `Tg3HYD8c4bAVLeEzA9t3Ken3Y3Mni1HZSS`. Use `hydra-cli` to dump the private key from wallet:

```
hydra-cli dumpprivkey Tg3HYD8c4bAVLeEzA9t3Ken3Y3Mni1HZSS

cVHzWuEKUxoRKba9ySZFqUKZ9G5W8NkzthRcPaB65amUJs95RM3d
```

```js
const network = networks.testnet;

const privateKey = "cVEwiJ5NMTdnkW4ZW2ykUopawtLPXQWtPDmvpTh5jmXYMtg8itAz";

const wallet = network.fromWIF(privateKey);
console.log("public address:", wallet.address);
```

Output:

```
public address: TWAnfBnRNhZBqtgSdgHjSfS2D5Jawmafra
```

## fromMnemonic

`fromMnemonic` constructs a wallet from mnemonic. User can optionally specify a `password` to add to the mnemonic entropy.

```ts
const network = networks.testnet;
const mnemonic =
  "hold struggle ready lonely august napkin enforce retire pipe where avoid drip";
const password = "password";

const wallet = network.fromMnemonic(mnemonic, password);

console.log("public address:", wallet.address);
console.log("private key (WIF):", wallet.toWIF());
```

Example Output:

```
public address: TLUHmrFGexxpyHwQphLpE1czZNFE5m1xmV
private key (WIF): cNQKccYYQyGX9G9Qxq2DJev9jHygbZpb2UG7EvUapbtDx5XhkhYE
```
