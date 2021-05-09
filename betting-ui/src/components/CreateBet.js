import  { useState, useEffect } from 'react';
import { useContext } from 'react';
import { MContext } from '../components/ConnectionProvider';
import {initEscrow} from '../utils/initEscrow';
import {Cancel} from '../utils/cancel';
import {getUserTokenInformation} from '../utils/tokens';
import { Link } from 'react-router-dom';
import {db} from '../utils/firebase';


function CreateBet() {
    const connectionContext = useContext(MContext);
    const [state, setState] = useState({
        escrowXAccount: '',
        programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
        aliceXPubkey: '',
        aliceXTokens: 1,
        escrowAccountPubkey: '',
        escrowAccountTokens: 0,
        tokens: [],
        tokenName: '',
        userTokenInfo: []
    });

    useEffect(async () => {
        if(connectionContext.state.wallet.connected){
            let tokensList = await getUserTokenInformation(connectionContext.state.connection, connectionContext.state.wallet)
            setState({ ...state,
                tokens: tokensList,
                tokenName: tokensList[0].name
            })
        }
      }, [connectionContext.state.wallet.connected]);

    function handleChange(event) {
        setState({ ...state,
            [event.target.name]: event.target.value
        })
    }

    async function handleTokenChange(event) {

        const newPubkey = state.tokens?.find(token => {return token.name === event.target.value})?.userTokenAddress;
        if (typeof(newPubkey) === 'undefined') {
            console.log('token not found');
            return;
        }

        setState({ ...state,
            [event.target.name]: event.target.value,
            aliceXPubkey: newPubkey
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
                        state.tokens.map(o => <option key={o.address} value={o.name}>{o.name}</option>)
                        }
                    </select>
                    </label>

                </div>
                <div>
                    <label>
                        Alice X Token Send:
                    <input type="text" name="aliceXTokens" value={state.aliceXTokens} onChange={handleChange} />
                    {/* TODO: decimal does not work */}
                    </label>
                </div>
            </form>
            <button onClick={ () => handleInitEscrow(context.state.connection, context.state.wallet, state.tokenName)}>Init Escrow</button>
            {/* TODO: is this buggy? */}
            <button onClick={ () => handleCancel(context.state.wallet)}>Cancel</button>

            <button onClick={ () => getUserTokenInformation(context.state.connection, context.state.wallet)}>GetUSerTokens</button>
            
            <Link to="/">
                <button>
                    Back to Bet List
                </button>
            </Link>
        </div>
          )}
        </MContext.Consumer>
        
    )

    function addBet(initializerTokenPubKey, escrowAccountPubkey, escrowXAccountString, tokens, tokenName, lower, upper) {
        db.collection('Bets').add({
            'tokenName': tokenName,
            'escrowAccountPubkey': escrowAccountPubkey,
            'escrowXAccountString': escrowXAccountString, // can remove this from firebase I thik
            'initializerTokenPubKey':initializerTokenPubKey, //TODO: can i remove?
            'tokens':tokens,
            'lower':lower,
            'upper':upper
        });
    }

    async function handleCancel(wallet) { // TODO: move cancel into the execute bet file, does it verify who is canceling??
        await Cancel(
            wallet,
            state.aliceXPubkey,
            state.escrowAccountPubkey,
            state.aliceXTokens,
            state.programId);

        //should delete from firestore too
        // this.checkEscrowClosure(this.escrowXAccount); 

        // event.preventDefault();
    }
    
    async function handleInitEscrow(connection, wallet, tokenName) {
    
        let responseData = await initEscrow(
            connection,
            wallet,
            state.aliceXPubkey,
            state.aliceXTokens,
            state.programId);
        if (responseData.isInitialized) {
            addBet(state.aliceXPubkey, responseData.escrowAccountPubkey, responseData.escrowXAccount, state.aliceXTokens, tokenName, 1, 5, true);// TODO: implement range when we get to randomness
            setState({ ...state,
                escrowAccountPubkey: responseData.escrowAccountPubkey,
                escrowXAccount: responseData.escrowXAccount
                });
            console.log('bet added')

        }
    }
}

export default CreateBet;
