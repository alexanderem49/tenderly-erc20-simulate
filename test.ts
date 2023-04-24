import * as dotenv from "dotenv";

import { ethers } from "ethers";
import { isErc20TxSuccessful } from "./txSuccessChecker";

dotenv.config();

async function main() {
    const chainIds = {
        ethereumMainnet: 1,
        polygonMainnet: 137,
        optimismGoerli: 420,
        // Network chain ids can be found here: https://chainlist.org/
    }

    ////////////////////////////////////
    // This part is done on the frontend
    const rawTx = await ethers.Wallet.createRandom().signTransaction({
        to: "0xf555b595d04ee62f0ea9d0e72001d926a736a0f6",
        data: "0x47e7ef24000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000005f5e100",
        value: "0x",
        gasLimit: ethers.BigNumber.from("8000000"),
        gasPrice: "0x",
        chainId: chainIds.ethereumMainnet
    });
    ////////////////////////////////////

    const result = await isErc20TxSuccessful(
        chainIds.ethereumMainnet,
        rawTx,
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "100000000"
    );

    console.log(result);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})