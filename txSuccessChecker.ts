// or use any other library for POST requests you would like
import axios from 'axios';

// set `"resolveJsonModule": true` in tsconfig.json
import { BigNumber, ethers } from "ethers"
import erc20Abi from "./abi/Erc20Contract.json";

import usdcAbi from "./abi/tokens/UsdcMainnetContract.json";
// TODO: Add ABI for other coins that Smart-X should support 

type TenderlyTx = {
    from: string,
    to: string,
    input: string,
    gas?: number,
    gasPrice?: string,
    value?: string
}

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env;

const mainnetProvider = new ethers.providers.JsonRpcBatchProvider(process.env.MAINNET_URL, 1);
// TODO: Add other networks that Smart-X should support

const usdcMainnet = new ethers.Contract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", usdcAbi, mainnetProvider);
// TODO: Add other coins that Smart-X should support

export async function isErc20TxSuccessful(
    chainId: number,
    rawTx: string,
    tokenAddress: string,
    tokenAmount: string
): Promise<boolean> {
    const tx = ethers.utils.parseTransaction(rawTx);

    const txs: TenderlyTx[] = [

        // Step 1: mint tokens to
        ...await getDesiredTokenMintTx(
            tokenAddress,
            tx.from!,
            BigNumber.from(tokenAmount)
        ),
        // Step 2: approve tokens
        getTokenApproveTx(
            tokenAddress,
            tx.to!,
            tx.from!,
            BigNumber.from(tokenAmount)
        ),
        // Step 3: execute desired tx
        {
            from: tx.from!,
            to: tx.to!,
            input: tx.data,
            gas: tx.gasLimit.toNumber(),
            gasPrice: tx.gasPrice?.toString(),
            value: tx.value.toString()
        }
    ];

    const result =
        await (axios.post(
            `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate-bundle`,
            // the transaction
            {
                simulations: txs.map((transaction) => ({
                    network_id: chainId.toString(),
                    save: false,
                    save_if_fails: false,
                    simulation_type: 'quick',
                    ...transaction,
                })),
            },
            {
                headers: {
                    'X-Access-Key': TENDERLY_ACCESS_KEY as string,
                },
            }
        )).catch((err) => {
            console.error({
                statusCode: err.response.status,
                data: err.response.data
            });
        })
    
    if (!result) {
        return false;
    }

    const simulationResults = result.data.simulation_results;
    const length = simulationResults.length;

    return simulationResults[length - 1].simulation.status;
}

async function getDesiredTokenMintTx(
    tokenAddress: string,
    mintTo: string,
    tokenAmount: BigNumber
): Promise<TenderlyTx[]> {
    switch (tokenAddress) {
        case usdcMainnet.address:
            return await mintUsdcTx(mintTo, tokenAmount)

        // TODO: Create a function returning correct token mint calldata
        default:
            throw Error("Unsupported token");
    }
}

async function mintUsdcTx(
    mintTo: string,
    tokenAmount: BigNumber
): Promise<TenderlyTx[]> {
    const masterMinter = await usdcMainnet.callStatic.masterMinter();
    const usdcInterface = usdcMainnet.interface;

    const txCreateMinter = usdcInterface.encodeFunctionData(
        "configureMinter",
        [masterMinter, tokenAmount]
    );
    const txMintTokens = usdcInterface.encodeFunctionData(
        "mint",
        [mintTo, tokenAmount]
    );

    return [
        {
            from: masterMinter,
            to: usdcMainnet.address,
            input: txCreateMinter
        },
        {
            from: masterMinter,
            to: usdcMainnet.address,
            input: txMintTokens
        }
    ]
}

function getTokenApproveTx(
    tokenAddress: string,
    approvedAddress: string,
    tokenOwner: string,
    tokenAmount: BigNumber
): TenderlyTx {
    const erc20Interface = new ethers.utils.Interface(erc20Abi);
    const calldata = erc20Interface.encodeFunctionData(
        "approve",
        [approvedAddress, tokenAmount]
    );

    return {
        from: tokenOwner,
        to: tokenAddress,
        input: calldata,
    }
}