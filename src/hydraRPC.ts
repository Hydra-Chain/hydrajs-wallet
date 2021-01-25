import RpcClient, {IConfig} from "hydrad-rpc"

import {Network, NetworkNames} from "./Network"

export default class HydraRPC {
  public rpc: RpcClient

  constructor(config?: IConfig) {
    this.rpc = new RpcClient(config)
  }

  public generate(nblocks: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.rpc.generate(1, (err, ret) => {
        if (err) {
          reject(err)
        }
        resolve(ret)
      })
    })
  }
}

export const rpcClient = new HydraRPC({
  user: "username",
  pass: "password",
  port: "3389",
  protocol: "http",
})

export async function generateBlock(network: Network) {
  
}
