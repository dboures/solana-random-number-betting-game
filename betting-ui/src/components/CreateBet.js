import { useState, useEffect, useContext } from 'react';
import { MContext } from '../components/ConnectionProvider';
import { initEscrow } from '../utils/initEscrow';
import { Cancel } from '../utils/cancel';
import { getUserTokenInformation, closeFirestoreAfterEscrowCloses } from '../utils/tokens';
import { Link } from 'react-router-dom';
import { db } from '../utils/firebase';


function CreateBet() {
    const connectionContext = useContext(MContext);
    const [state, setState] = useState({
        escrowXAccount: '',
        programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
        aliceXPubkey: '',
        mintAddress: '',
        aliceXTokens: 0,
        escrowAccountPubkey: '',
        escrowAccountTokens: 0,
        tokens: [],
        tokenName: '',
        userTokenInfo: []
    });

    useEffect(async () => {
        if(connectionContext.state.wallet.connected) {
            let tokensList = await getUserTokenInformation(connectionContext.state.connection, connectionContext.state.wallet);
            setState({ ...state,
                tokens: tokensList,
                tokenName: tokensList[0]?.name // TODO: should limit creation if wallet has nothing
            })
        }
      }, [connectionContext.state.wallet.connected]);

    function handleChange(event) {
        setState({ ...state,
            [event.target.name]: event.target.value
        })
    }

    async function handleTokenChange(event) {
        const newToken = state.tokens?.find(token => {return token.name === event.target.value});
        const newPubkey = newToken?.userTokenAddress;
        if (typeof(newPubkey) === 'undefined') {
            console.log('token not found');
            return;
        }

        setState({ ...state,
            [event.target.name]: event.target.value,
            aliceXPubkey: newPubkey,
            mintAddress: newToken?.mintAddress
        });
    }
 
    return (
        <MContext.Consumer>
          {(context) => (

        <div className="mt-5 d-flex justify-content-left">
            <h3>Bet Your Solana With a Friend</h3>
            <form>
                <div>
                </div>
                <div>
                    <label>
                        Alice X Pubkey: (hide eventually) {state.aliceXPubkey}
                    <select name="tokenName"
                        value={state.tokenName}
                        onChange={event => handleTokenChange(event, context.state.connection, context.state.wallet)}>
                        {
                        state.tokens.map(o => <option key={o.userTokenAddress} value={o.name}>{o.name}</option>)
                        }
                    </select>
                    </label>

                </div>
                <div>
                    <label>
                        Alice X Token Send:
                    <input type="text" name="aliceXTokens" value={state.aliceXTokens} onChange={handleChange} />
                    </label>
                </div>
            </form>
            {/* TODO: is this buggy? */}
            {(context.state.wallet.connected ?
                <button onClick={ () => handleInitEscrow(context.state.connection, context.state.wallet, state.tokenName)}>Init Escrow</button> :
                <button disabled={true}> Swap</button>)}

            {(context.state.wallet.connected ?
                <button onClick={ () => handleCancel(context.state.connection, context.state.wallet)}>Cancel</button> :
                <button disabled={true}> Cancel</button>)}

            {/* <button onClick={ () => getUserTokenInformation(context.state.connection, context.state.wallet)}>GetUSerTokens</button> */}
            
            <Link to="/">
                <button>
                    Back to Bet List
                </button>
            </Link>
        </div>
          )}
        </MContext.Consumer>
        
    )

    function addBet(initializerTokenPubKey, escrowAccountPubkey, escrowXAccountString, tokens, tokenName, lower, upper, mintAddress) {
        db.collection('Bets').add({
            'tokenName': tokenName,
            'escrowAccountPubkey': escrowAccountPubkey,
            'escrowXAccountString': escrowXAccountString, // can remove this from firebase I thik
            'initializerTokenPubKey': initializerTokenPubKey, //TODO: can i remove?
            'mintAddress': mintAddress,
            'tokens': tokens,
            'lower': lower,
            'upper': upper
        });
    }

    async function handleCancel(conn, wallet) { // TODO: verify who is cancelingin rust
        let txid = await Cancel(
            conn,
            wallet,
            state.aliceXPubkey,
            state.escrowAccountPubkey,
            state.aliceXTokens,
            state.programId);

        console.log(txid);
        
        if (closeFirestoreAfterEscrowCloses(conn, state.escrowXAccount) && txid != 'undefined') { // TODO: plz make names consistent
            const snapshot = await db.collection('Bets').where("escrowXAccountString", "==", state.escrowXAccount).get();

            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }  
            
            snapshot.forEach(doc => {
                db.collection('Bets').doc(doc.id).delete().catch(error => {console.log(error)});
            });
        }
    }
    
    async function handleInitEscrow(connection, wallet, tokenName) {
    
        let responseData = await initEscrow(
            connection,
            wallet,
            state.aliceXPubkey,
            state.aliceXTokens,
            state.programId);
        if (responseData.isInitialized) {
            addBet(state.aliceXPubkey, responseData.escrowAccountPubkey, responseData.escrowXAccount, state.aliceXTokens, tokenName, 1, 5, state.mintAddress);// TODO: implement range when we get to randomness
            setState({ ...state,
                escrowAccountPubkey: responseData.escrowAccountPubkey,
                escrowXAccount: responseData.escrowXAccount
                });
            console.log('bet added')

        }
    }
}

export default CreateBet;
