import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers } from "ethers";
import { isErc20TxSuccessful } from "./txSuccessChecker";

async function main() {
    const chainIds = {
        ethereumMainnet: 1,
        polygonMainnet: 137,
        optimismGoerli: 420,
        optimismMainnet: 10
        // Network chain ids can be found here: https://chainlist.org/
    }

    ////////////////////////////////////
    // This part is done on the frontend
    const rawTx = await ethers.Wallet.createRandom().signTransaction({
        to: "0x6b55495947F3793597C0777562C37C14cb958097",
        data: "0x47e7ef240000000000000000000000007F5c764cBc14f9669B88837ca1490cCa17c316070000000000000000000000000000000000000000000000000000000005f5e100",
        value: "0x",
        gasLimit: ethers.BigNumber.from("8000000"),
        gasPrice: "0x",
        chainId: chainIds.optimismMainnet
    });
    ////////////////////////////////////

    console.time("request");
    const result = await isErc20TxSuccessful(
        chainIds.optimismMainnet,
        rawTx,
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
        "100000000"
    );
    console.timeEnd("request");

    console.log(result);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})