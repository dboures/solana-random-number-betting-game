const splt = require("@solana/spl-token");
const sol = require("@solana/web3.js");
const ESCROW_ACCOUNT_DATA_LAYOUT  = require("./layout").ESCROW_ACCOUNT_DATA_LAYOUT;
const BN = require("bn.js");

const connection = new sol.Connection("http://localhost:8899", 'singleGossip');

module.exports = { swap }

async function swap(swapInfo) {
    const takerAccount = new sol.Account(swapInfo.bobPrivateKey.split(',').map(s => parseInt(s)));
    const escrowAccountPubkey = new sol.PublicKey(swapInfo.escrowAccountPubkey);
    const takerXTokenAccountPubkey = new sol.PublicKey(swapInfo.bobXPubKey);
    const takerYTokenAccountPubkey = new sol.PublicKey(swapInfo.bobYPubKey);
    const xTokenAmount = swapInfo.bobXTokens;
    const programId = new sol.PublicKey(swapInfo.programId);

    let encodedEscrowState;
    try {
        encodedEscrowState = (await connection.getAccountInfo(escrowAccountPubkey, 'singleGossip'))?.data;
    } catch (err) {
        throw new Error("Could not find escrow at given address!")
    }
    const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
    const escrowState =  {
        escrowAccountPubkey: escrowAccountPubkey,
        isInitialized: !!decodedEscrowLayout.isInitialized,
        initializerAccountPubkey: new sol.PublicKey(decodedEscrowLayout.initializerPubkey),
        XTokenTempAccountPubkey: new sol.PublicKey(decodedEscrowLayout.initializerTempTokenAccountPubkey),
        initializerYTokenAccount: new sol.PublicKey(decodedEscrowLayout.initializerReceivingTokenAccountPubkey),
        expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le")
    };

    const PDA = await sol.PublicKey.findProgramAddress([Buffer.from("escrow")], programId);

    const exchangeInstruction = new sol.TransactionInstruction({
        programId,
        data: Buffer.from(Uint8Array.of(1, ...new BN(xTokenAmount).toArray("le", 8))),
        keys: [
            { pubkey: takerAccount.publicKey, isSigner: true, isWritable: false },
            { pubkey: takerYTokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: takerXTokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: escrowState.XTokenTempAccountPubkey, isSigner: false, isWritable: true},
            { pubkey: escrowState.initializerAccountPubkey, isSigner: false, isWritable: true},
            { pubkey: escrowState.initializerYTokenAccount, isSigner: false, isWritable: true},
            { pubkey: escrowAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: splt.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            { pubkey: PDA[0], isSigner: false, isWritable: false}
        ] 
    })    

    await connection.sendTransaction(new sol.Transaction().add(exchangeInstruction), [takerAccount], {skipPreflight: false, preflightCommitment: 'singleGossip'});

    return {};
}