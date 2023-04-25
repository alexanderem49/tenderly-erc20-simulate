import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers } from "ethers";
import { isErc20TxSuccessful } from "./txSuccessChecker";

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
        to: "0xC2DbaAEA2EfA47EBda3E572aa0e55B742E408BF6",
        data: "0x47e7ef240000000000000000000000002791Bca1f2de4661ED88A30C99A7a9449Aa841740000000000000000000000000000000000000000000000000000000005f5e100",
        value: "0x",
        gasLimit: ethers.BigNumber.from("8000000"),
        gasPrice: "0x",
        chainId: chainIds.polygonMainnet
    });
    ////////////////////////////////////

    console.time("request");
    const result = await isErc20TxSuccessful(
        chainIds.polygonMainnet,
        rawTx,
        "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        "100000000"
    );
    console.timeEnd("request");

    console.log(result);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})