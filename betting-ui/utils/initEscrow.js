const splt = require("@solana/spl-token");
const sol = require("@solana/web3.js");
const ESCROW_ACCOUNT_DATA_LAYOUT  = require("./layout").ESCROW_ACCOUNT_DATA_LAYOUT;
const BN = require("bn.js");

const connection = new sol.Connection("http://localhost:8899", 'singleGossip');


module.exports = { initEscrow }

async function initEscrow(initInfo) {
    const initializerXTokenAccountPubkey = new sol.PublicKey(initInfo.aliceXPubKey);

    //@ts-expect-error
    const XTokenMintAccountPubkey = new sol.PublicKey((await connection.getParsedAccountInfo(initializerXTokenAccountPubkey, 'singleGossip')).value?.data.parsed.info.mint);

    const privateKeyDecoded = initInfo.alicePrivateKey.split(',').map(s => parseInt(s));
    const initializerAccount = new sol.Account(privateKeyDecoded);

    const tempTokenAccount = new sol.Account();
    const createTempTokenAccountIx = sol.SystemProgram.createAccount({
        programId: splt.TOKEN_PROGRAM_ID,
        space: splt.AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(splt.AccountLayout.span, 'singleGossip'),
        fromPubkey: initializerAccount.publicKey,
        newAccountPubkey: tempTokenAccount.publicKey
    });
    const initTempAccountIx = splt.Token.createInitAccountInstruction(splt.TOKEN_PROGRAM_ID, XTokenMintAccountPubkey, tempTokenAccount.publicKey, initializerAccount.publicKey);
    const transferXTokensToTempAccIx = splt.Token
        .createTransferInstruction(splt.TOKEN_PROGRAM_ID, initializerXTokenAccountPubkey, tempTokenAccount.publicKey, initializerAccount.publicKey, [], initInfo.aliceXTokens);
    
    const escrowAccount = new sol.Account();
    const escrowProgramId = new sol.PublicKey(initInfo.programId);

    const createEscrowAccountIx = sol.SystemProgram.createAccount({
        space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
        lamports: await connection.getMinimumBalanceForRentExemption(ESCROW_ACCOUNT_DATA_LAYOUT.span, 'singleGossip'),
        fromPubkey: initializerAccount.publicKey,
        newAccountPubkey: escrowAccount.publicKey,
        programId: escrowProgramId
    });

    const initEscrowIx = new sol.TransactionInstruction({
        programId: escrowProgramId,
        keys: [
            { pubkey: initializerAccount.publicKey, isSigner: true, isWritable: false },
            { pubkey: tempTokenAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: new sol.PublicKey(initInfo.aliceYPubKey), isSigner: false, isWritable: false },
            { pubkey: escrowAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: sol.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            { pubkey: splt.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(Uint8Array.of(0, ...new BN(initInfo.aliceYTokens).toArray("le", 8)))
    })

    const tx = new sol.Transaction()
        .add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
        await connection.sendTransaction(tx, [initializerAccount, tempTokenAccount, escrowAccount], {skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000)).catch(error => console.log(error));

    const encodedEscrowState = (await connection.getAccountInfo(escrowAccount.publicKey, 'singleGossip'))?.data ;
    const decodedEscrowState = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
    return ({
        escrowAccountPubkey: escrowAccount.publicKey.toBase58(),
        isInitialized: !!decodedEscrowState.isInitialized,
        initializerAccountPubkey: new sol.PublicKey(decodedEscrowState.initializerPubkey).toBase58(),
        XTokenTempAccountPubkey: new sol.PublicKey(decodedEscrowState.initializerTempTokenAccountPubkey).toBase58(),
        initializerYTokenAccount: new sol.PublicKey(decodedEscrowState.initializerReceivingTokenAccountPubkey).toBase58(),
        expectedAmount: new BN(decodedEscrowState.expectedAmount, 10, "le").toNumber()
    });

}

