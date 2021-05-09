import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ESCROW_ACCOUNT_DATA_LAYOUT, EscrowLayout } from "./layout"; 
const bs58 = require('bs58');
const BN = require("bn.js");

//TODO: refactor with wallet

const connection = new Connection("http://localhost:8899", 'singleGossip');

export const Swap = async (
    wallet: any,
    escrowAccountAddressString: string,
    takerXTokenAccountAddressString: string,
    initTokenString: string,
    takerExpectedXTokenAmount: number,
    programIdString: string,
) => {

    console.log('inside swap');
    let takerKey: PublicKey;
    //if wallet undefined, throw alert or something
    takerKey = wallet._publicKey;

    const escrowAccountPubkey = new PublicKey(escrowAccountAddressString);
    const takerTokenAccountPubkey = new PublicKey(takerXTokenAccountAddressString);
    const initTokenAccountPubkey = new PublicKey(initTokenString);
    const programId = new PublicKey(programIdString);

    let encodedEscrowState;
    try {
        encodedEscrowState = (await connection.getAccountInfo(escrowAccountPubkey, 'singleGossip'))!.data;
    } catch (err) {
        throw new Error("Could not find escrow at given address!")
    }
    const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState) as EscrowLayout;
    const escrowState =  {
        escrowAccountPubkey: escrowAccountPubkey,
        isInitialized: !!decodedEscrowLayout.isInitialized,
        initializerAccountPubkey: new PublicKey(decodedEscrowLayout.initializerPubkey),
        escrowTokenAccount: new PublicKey(decodedEscrowLayout.tempTokenAccountPubkey),
        expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le")
    };

    console.log(decodedEscrowLayout);


    // console.log('find PA');
    const PDA = await PublicKey.findProgramAddress([Buffer.from("escrow")], programId);

    // console.log('keys');
    // console.log(takerKey.toBase58());
    // console.log(takerTokenAccountPubkey.toBase58());
    // console.log(escrowState.escrowTokenAccount.toBase58());
    // console.log(escrowState.initializerAccountPubkey.toBase58());
    // console.log(initTokenAccountPubkey.toBase58());
    // console.log(escrowAccountPubkey.toBase58());
    // console.log(TOKEN_PROGRAM_ID.toBase58());
    // console.log(PDA[0].toBase58());

    const exchangeInstruction = new TransactionInstruction({
        programId,
        data: Buffer.from(Uint8Array.of(1, ...new BN(takerExpectedXTokenAmount).toArray("le", 8))),
        keys: [
            { pubkey: takerKey, isSigner: true, isWritable: false },
            { pubkey: takerTokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: escrowState.escrowTokenAccount, isSigner: false, isWritable: true},
            { pubkey: escrowState.initializerAccountPubkey, isSigner: false, isWritable: true},
            { pubkey: initTokenAccountPubkey, isSigner: false, isWritable: true},
            { pubkey: escrowAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            { pubkey: PDA[0], isSigner: false, isWritable: false}
        ] 
    })    

    let tx = new Transaction({feePayer: takerKey}).add(exchangeInstruction);

    tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;

    try {
    const response = await wallet._sendRequest('signTransaction', {
        message: bs58.encode(tx.serializeMessage())
        });
        const signature = bs58.decode(response.signature);
        tx.addSignature(takerKey, signature);
    }
    catch(error) {
        console.log('error signing txn')
        return;
    }

    let serialized = tx.serialize();
    let txid = await connection.sendRawTransaction(serialized, {skipPreflight: false, preflightCommitment: 'singleGossip'}).catch(error => console.log(error));

    return txid;

}