import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ESCROW_ACCOUNT_DATA_LAYOUT, EscrowLayout } from "./layout";
const bs58 = require('bs58');
const BN = require("bn.js");

 // TODO: need to error proof eveything
export const initEscrow = async (
    connection: Connection,
    wallet: any,
    initializerXTokenAccountPubkeyString: string,
    amountXTokensToSendToEscrow: number,
    escrowProgramIdString: string) => {

    let initializerKey: PublicKey;
    //if wallet undefined, throw alert or something
    initializerKey = wallet._publicKey;

    const initializerXTokenAccountPubkey = new PublicKey(initializerXTokenAccountPubkeyString);
    //@ts-expect-error
    const XTokenMintAccountPubkey = new PublicKey((await connection.getParsedAccountInfo(initializerXTokenAccountPubkey, 'singleGossip')).value!.data.parsed.info.mint); // handle error

    const tempTokenAccount = new Account();
    const createTempTokenAccountIx = SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip'),
        fromPubkey: initializerKey,
        newAccountPubkey: tempTokenAccount.publicKey
    });
    const initTempAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, XTokenMintAccountPubkey, tempTokenAccount.publicKey, initializerKey);
    const transferXTokensToTempAccIx = Token
        .createTransferInstruction(TOKEN_PROGRAM_ID, initializerXTokenAccountPubkey, tempTokenAccount.publicKey, initializerKey, [], amountXTokensToSendToEscrow);
    
    const escrowAccount = new Account();
    const escrowProgramId = new PublicKey(escrowProgramIdString);

    const createEscrowAccountIx = SystemProgram.createAccount({
        space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
        lamports: await connection.getMinimumBalanceForRentExemption(ESCROW_ACCOUNT_DATA_LAYOUT.span, 'singleGossip'),
        fromPubkey: initializerKey,
        newAccountPubkey: escrowAccount.publicKey,
        programId: escrowProgramId
    });

    const initEscrowIx = new TransactionInstruction({
        programId: escrowProgramId,
        keys: [
            { pubkey: initializerKey, isSigner: true, isWritable: false },
            { pubkey: tempTokenAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: escrowAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(Uint8Array.of(0, ...new BN(amountXTokensToSendToEscrow).toArray("le", 8)))
    })
    console.log('temp and escrow');
    console.log(tempTokenAccount.publicKey.toBase58());
    console.log(escrowAccount.publicKey.toBase58());

    let tx = new Transaction({feePayer: initializerKey})
        .add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);

    tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;

    try {
        const response = await wallet._sendRequest('signTransaction', {
            message: bs58.encode(tx.serializeMessage())
          });
          const signature = bs58.decode(response.signature);
          tx.addSignature(initializerKey, signature);
          tx.partialSign(...[tempTokenAccount, escrowAccount]);
    }
    catch(error) {
        return {
            isInitialized: false,
        };
    }

    let serialized = tx.serialize();
    let txid = await connection.sendRawTransaction(serialized, {skipPreflight: false, preflightCommitment: 'singleGossip'});
    console.log(txid);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encodedEscrowState = (await connection.getAccountInfo(escrowAccount.publicKey, 'singleGossip'))!.data;
    const decodedEscrowState = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState) as EscrowLayout;
    
    return {
        escrowAccountPubkey: escrowAccount.publicKey.toBase58(),
        isInitialized: !!decodedEscrowState.isInitialized,
        initializerAccountPubkey: new PublicKey(decodedEscrowState.initializerPubkey).toBase58(),
        escrowXAccount: new PublicKey(decodedEscrowState.tempTokenAccountPubkey).toBase58(),
        expectedAmount: new BN(decodedEscrowState.expectedAmount, 10, "le").toNumber()
    };
}