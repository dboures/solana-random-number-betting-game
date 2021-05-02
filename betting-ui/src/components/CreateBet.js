import  { useState, useEffect } from 'react';
import { MContext } from '../components/ConnectionProvider';
import {initEscrow} from '../utils/initEscrow';
import {Cancel} from '../utils/cancel';
import {getUserTokenInformation, loadTokens} from '../utils/tokens';
import { Link } from 'react-router-dom';
import {db} from '../utils/firebase';


function CreateBet() {
    const [state, setState] = useState({
        escrowXAccount: '',
        programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
        aliceXPubkey: '',
        aliceXTokens: 10,
        escrowAccountPubkey: '',
        escrowAccountTokens: 0,
        tokens: [],
        tokenName: '',
        userTokenInfo: []
    });

    useEffect(async () => {
        let tokensList = await loadTokens();
        let startingTokenName = tokensList[0].name;
        setState({ ...state,
            tokens: tokensList,
            tokenName: startingTokenName
        })
      }, []);

    function handleChange(event) {
        setState({ ...state,
            [event.target.name]: event.target.value
        })
    }

    async function handleTokenChange(event, connection, wallet) {
        if (state.tokens.length == 0) {
            return;
        }
        let tokenPubkeyString = state.tokens.find(token => {return token.name === event.target.value}).address;
        if (typeof(tokenPubkeyString) === 'undefined') {
            return;
        }
        let userTokens = await getUserTokenInformation(connection, wallet);

        const newPubkey = userTokens.find(token => {return token.mintAddress === tokenPubkeyString}).userTokenAddress;
        if (typeof(newPubkey) === 'undefined') {
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
                    </label>
                </div>
            </form>
            <button onClick={ () => handleInitEscrow(context.state.connection, context.state.wallet, state.tokenName)}>Init Escrow</button>
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

    function addBet(initializerTokenPubKey, escrowAccountPubkey, escrowXAccountString, tokens, lower, upper) {
        db.collection('Bets').add({
            'escrowAccountPubkey': escrowAccountPubkey,
            'escrowXAccountString': escrowXAccountString,
            'initializerTokenPubKey':initializerTokenPubKey,
            'tokens':tokens,
            'lower':lower,
            'upper':upper
        });
    }

    async function handleCancel(wallet) {
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
    
    async function handleInitEscrow(connection, wallet) {
    
        let responseData = await initEscrow(
            connection,
            wallet,
            state.aliceXPubkey,
            state.aliceXTokens,
            state.programId);
        if (responseData.isInitialized) {
            setState({ ...state,
                escrowAccountPubkey: responseData.escrowAccountPubkey,
                escrowXAccount: responseData.escrowXAccount
                });
            addBet(state.aliceXPubkey, responseData.escrowAccountPubkey, responseData.escrowXAccount, state.aliceXTokens, 1, 5, true);// TODO: implement range when we get to randomness
            console.log('bet added')

        }
    }
}

export default CreateBet;


    // async function checkEscrowClosure (escrowXAccount) {
    //     for (var i = 0; i < 5; i++) {
    //         let res = await loadTokensInEscrow(escrowXAccount);

    //         if (typeof res?.result == 'undefined'){
    //             setState({ ...state,
    //                 escrowAccountTokens: 0,
    //                 escrowAccountPubkey: ''
    //                 });
    //             this.escrowXAccount = '';
    //                 break;
    //             }

    //         await this.timer(4000);
    //     }
    // }
