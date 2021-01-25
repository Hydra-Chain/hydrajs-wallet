var networks = require("../../lib/Network");

async function main() {
  const network = networks.networks.mainnet;

  const privateKey = "";

  const wallet = network.fromWIF(privateKey);

  const contractAddress = "4ab26aaa1803daa638910d71075c06386e391147";
  const encodedData = "a9059cbb0000000000000000000000002b09d0bc79cf81450b12c05b0c7b64b1b31d432d00000000000000000000000000000000000000000000000000000000000f4240"; // burnbabyburn()

  const tx = await wallet.contractSend(contractAddress, encodedData);
  //const sendtx = await wallet.send("HAShCaSH5EMnH6HHBuhYnMYiZa4oHUUare", 0.01 * 1e8);
  //console.log("sendtx", sendtx);
  console.log(tx);
}

main().catch(err => console.log(err));