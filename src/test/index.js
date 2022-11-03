const axios = require("axios");

function rawCall(method, params = [], opts = {}) {
  const [
    contractAddress,
    encodedData,
    // these are optionals
    amount,
    gasLimit,
  ] = params;
  const senderAddress = method.toLowerCase() === "sendtocontract" ? params[5] : params[2];

  const amountInSatoshi = Math.floor((amount || 0) * 1e8);

  opts = {
    ...opts,
    amount: amountInSatoshi,
    gasLimit: gasLimit || 200000,
    sender: senderAddress || "",
  };

  switch (method.toLowerCase()) {
    case "sendtocontract":
      return this.wallet?.contractSend(contractAddress, encodedData, opts);
    case "callcontract":
      return contractCall(contractAddress, encodedData, opts);
    default:
      throw new Error("Unknow method call");
  }
}

async function contractCall(contractAddress, encodedData, opts = {}) {
  return insight.contractCall(contractAddress, encodedData, opts);
}

const insight = {
  contractCall: async (address, encodedData, opts = {}) => {
    const axiosInstance = axios.create({
      baseURL: "https://testexplorer.hydrachain.org/api",
      // don't throw on non-200 response
      // validateStatus: () => true,
    });

    // FIXME wow, what a weird API design... maybe we should just host the RPC
    // server, with limited API exposed.
    let route = `/contract/${address}/call?data=${encodedData}`;
    if (opts.sender) {
      route += `&sender=${opts.sender}`;
    }
    const res = await axiosInstance.get(route);

    return res.data;
  },
};

rawCall("callcontract", [
  "34c9ab31cf75802f22252bb16e6a923a09e9fbcd",
  "6d4ce63c",
  "994ac79e7e3437ee6be8c9928cd6069af1561f53",
])
  .then(console.log)
  .catch(console.log);
