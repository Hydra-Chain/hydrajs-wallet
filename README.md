# locjs-wallet

A toolkit for building LockTrip light wallets

This is a client-side wallet library that can generate private keys from a mnemonic, or import private keys from other LockTrip wallets.

It can sign transactions locally, and submit the raw transaction data to a remote locktrip node. The blockchain data is provided by the Insight API (which powers https://explorer.locktrip.com/), rather than the raw locktripd RPC calls.

This library makes it possible to run DApp without the users having to run a full locktrip node.