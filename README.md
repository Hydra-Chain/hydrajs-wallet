# hydrajs-wallet

A toolkit for building HYDRA light wallets

This is a client-side wallet library that can generate private keys from a mnemonic, or import private keys from other HYDRA wallets.

It can sign transactions locally, and submit the raw transaction data to a remote HYDRA node. The blockchain data is provided by the Insight API (which powers https://explorer.hydrachain.org/), rather than the raw hydrad RPC calls.

This library makes it possible to run DApp without the users having to run a full HYDRA node.