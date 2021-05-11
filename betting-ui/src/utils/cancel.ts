import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { EscrowLayout, ESCROW_ACCOUNT_DATA_LAYOUT } from "./layout";
const Wallet = require('@project-serum/sol-wallet-adapter').default;
const BN = require("bn.js");

//TODO: protect from errors when there's nothing in there
//TODO: implement decimals
//TODO: prevent overdrafting, it causes error

export const Cancel = async (
    connection: Connection,
    wallet: any,
    cancelerXAccount: string,
    escrowAccount: string,
    amount: number,
    programIdString: string) => {

    let cancelerKey: PublicKey;
    cancelerKey = wallet._publicKey;

    const cancelerXPubkey = new PublicKey(cancelerXAccount);
    const escrowPubkey = new PublicKey(escrowAccount);
    const programId = new PublicKey(programIdString);

    const PDA = await PublicKey.findProgramAddress([Buffer.from("escrow")], programId);

    let encodedEscrowState;
    try {
        encodedEscrowState = (await connection.getAccountInfo(escrowPubkey, 'singleGossip'))!.data;
    } catch (err) {
        throw new Error("Could not find escrow at given address!")
    }
    const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState) as EscrowLayout;
    const escrowXPubkey =  new PublicKey(decodedEscrowLayout.tempTokenAccountPubkey);

    const initializerKey = new PublicKey(decodedEscrowLayout.initializerPubkey);

    if (cancelerKey.toBase58() != initializerKey.toBase58()){
        console.log('you do not have the authority to cancel this transaction');
        return;
    }

    console.log(decodedEscrowLayout.tempTokenAccountPubkey);
    console.log(escrowXPubkey);

    const cancelInstruction = new TransactionInstruction({
        programId,
        data: Buffer.from(Uint8Array.of(2, ...new BN(amount).toArray("le", 8))),
        keys: [
            { pubkey: cancelerKey, isSigner: true, isWritable: false },
            { pubkey: cancelerXPubkey, isSigner: false, isWritable: true },
            { pubkey: escrowPubkey, isSigner: false, isWritable: true},
            { pubkey: escrowXPubkey, isSigner: false, isWritable: true},
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            { pubkey: PDA[0], isSigner: false, isWritable: false}
        ] 
    });

    let tx = new Transaction({feePayer: cancelerKey}).add(cancelInstruction);
    tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;

    let finalTx: Transaction;
    finalTx = await wallet.signTransaction(tx);
    let serialized = finalTx.serialize();
    try {
        let txid = await connection.sendRawTransaction(serialized, {skipPreflight: false, preflightCommitment: 'singleGossip'});
    
        return txid;
    } catch (error) {
        console.log('txn error');
    }
    return
}