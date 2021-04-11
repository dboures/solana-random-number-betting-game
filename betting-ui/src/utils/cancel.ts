import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { EscrowLayout, ESCROW_ACCOUNT_DATA_LAYOUT } from "./layout";
const BN = require("bn.js");

const connection = new Connection("http://localhost:8899", 'singleGossip');


//TODO: need to protect from errors when there's nothing in there
export const Cancel = async (
    privateKeyByteArray: string,
    cancelerXAccount: string,
    escrowAccount: string,
    amount: number,
    programIdString: string) => {
    const privateKeyDecoded = privateKeyByteArray.split(',').map(s => parseInt(s));

    const cancelerAccount = new Account(privateKeyDecoded);
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
    const escrowXPubkey =  new PublicKey(decodedEscrowLayout.initializerTempTokenAccountPubkey);

    const cancelInstruction = new TransactionInstruction({
        programId,
        data: Buffer.from(Uint8Array.of(2, ...new BN(amount).toArray("le", 8))),
        keys: [
            { pubkey: cancelerAccount.publicKey, isSigner: true, isWritable: false },
            { pubkey: cancelerXPubkey, isSigner: false, isWritable: true },
            { pubkey: escrowPubkey, isSigner: false, isWritable: true},
            { pubkey: escrowXPubkey, isSigner: false, isWritable: true},
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            { pubkey: PDA[0], isSigner: false, isWritable: false}
        ] 
    });

    await connection.sendTransaction(new Transaction().add(cancelInstruction), [cancelerAccount], {skipPreflight: false, preflightCommitment: 'singleGossip'});
}