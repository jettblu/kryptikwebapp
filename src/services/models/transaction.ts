import { BigNumberish, BytesLike } from "ethers";
import { AccessListish } from "ethers/lib/utils";
import { Network } from "hdseedloop";
import { KryptikProvider } from "../Web3Service";
import { defaultNetwork, NetworkDb } from "./network";

export default interface TransactionFeeData{
    network: Network,
    // gas price denominated in network token, e.g. eth for Ethereum
    lowerBoundCrypto: number,
    // gas price denominated in the dollar
    lowerBoundUSD: number,
    upperBoundCrypto: number,
    upperBoundUSD: number,
    isFresh: boolean,
    EVMGas: EVMGas
}


export interface EVMGas{
    gasLimit:BigNumberish,
    maxFeePerGas:BigNumberish,
    maxPriorityFeePerGas:BigNumberish,
}

export const defaultEVMGas:EVMGas = {
    gasLimit: 0,
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0
}

export const defaultTransactionFeeData:TransactionFeeData = {
    network: defaultNetwork,
    isFresh: false,
    lowerBoundCrypto: 0,
    lowerBoundUSD: 0,
    upperBoundCrypto: 0,
    upperBoundUSD: 0,
    EVMGas: defaultEVMGas
}

export interface SolTransaction{
    sendAccount:string,
    toAddress: string,
    kryptikProvider:KryptikProvider,
    networkDb:NetworkDb,
    valueSol:number
}

export interface EVMTransaction{
    sendAccount:string,
    kryptikProvider:KryptikProvider,
    networkDb:NetworkDb
    toAddress:string,
    // how much gas we're willing to use
    gasLimit: BigNumberish,
    // max fee per gas unit we're willing to pay
    maxFeePerGas: BigNumberish,
    // max tip per gas unit we're willing to pay
    maxPriorityFeePerGas: BigNumberish,
    // value in token we are sending
    value: BigNumberish
}

export type TransactionRequest = {
    to?: string,
    from?: string,
    nonce?: BigNumberish,

    gasLimit?: BigNumberish,
    gasPrice?: BigNumberish,

    data?: BytesLike,
    value?: BigNumberish,
    chainId?: number

    type?: number;
    accessList?: AccessListish;

    maxPriorityFeePerGas?: BigNumberish;
    maxFeePerGas?: BigNumberish;

    customData?: Record<string, any>;
    ccipReadEnabled?: boolean;
}

export interface TransactionPublishedData{
    // transaction hash on network
    hash: string
    explorerPath?:string
}

export const defaultTxPublishedData:TransactionPublishedData = {
    // genesis tx. hash on ethereum network
    hash: "0xc8cc9c54f19f6cb85c3fa27f493d50e136374ce5b2e3f5307b3c5eea113a003b"
}