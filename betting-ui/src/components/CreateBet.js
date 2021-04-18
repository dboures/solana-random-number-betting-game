import  { useState } from 'react';
import { MContext } from '../components/ConnectionProvider';
// import {Swap} from '../utils/swap';
import {initEscrow} from '../utils/initEscrow';
// import {Cancel} from '../utils/cancel';
// import { loadTokensInEscrow } from '../utils/loadTokensInEscrow';
import { Link } from 'react-router-dom';
import {db} from '../utils/firebase';


function CreateBet() {
    const [state, setState] = useState({
        escrowXAccount: '',
        programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
        aliceXPubKey: 'mETiobAeeirt4rBuFxud6NQzQLb45XLuFLWzzKw3BxV',
        aliceYPubKey: 'GzzWQBvyUnkrhT2muC4DobHB1UdjKFaEJvejTGn4reG2',
        aliceXTokens: 100,
        aliceYTokens: 1,
        escrowAccountPubkey: '',
        escrowAccountTokens: 0
    });

    function handleChange(event) {
        setState({ ...state,
            [event.target.name]: event.target.value
        })
    }
  
    return (
        <MContext.Consumer>
          {(context) => (

        <div className="mt-5 d-flex justify-content-left">
            <h3>Bet Your Solana With a Friend</h3>
            <form>
                <div>
                    <label>
                        ProgramId: ( should hide)
                        <input type="text" name="programId" value={state.programId} onChange={handleChange} />
                    </label>
                </div>
                <div>
                </div>
                <div>
                    <label>
                        Alice X Pubkey: (turn into token type dropdown)
                    <input type="text" name="aliceXPubKey" value={state.aliceXPubKey} onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>
                        Alice Y Pubkey: (will delete)
                    <input type="text" name="aliceYPubKey" value={state.aliceYPubKey} onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>
                        Alice X Token Send:
                    <input type="text" name="aliceXTokens" value={state.aliceXTokens} onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>
                        Alice Y Token Receive: (will delete)
                    <input type="text" name="aliceYTokens" value={state.aliceYTokens} onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>
                        Escrow Account Pubkey: (maybe turn into alert)
                        <input type="text" name="escrowAccountPubkey" value={state.escrowAccountPubkey} disabled={true}/>
                    </label>
                    {/* <label>
                        Tokens in Escrow Account:
                        <input type="text" name="escrowAccountTokens" value={state.escrowAccountTokens} disabled={true}/>
                    </label> */}
                </div>
            </form>
            <button onClick={ () => handleInitEscrow(context.state.wallet)}>Init Escrow</button>
            <Link to="/">
                    <button>
                        Back to Bet List
                    </button>
                </Link>
            {/* <button onClick={this.handleCancel.bind(this)}>Cancel</button> */}
            {/* <button onClick={this.handleSwap.bind(this)}>Swap</button> */}
        </div>
          )}
        </MContext.Consumer>
        
    )

    function addBet(initializerTokenPubKey, escrowAccountPubkey, tokens,lower,upper) {
        db.collection('Bets').add({
            'escrowAccountPubkey': escrowAccountPubkey,
            'initializerTokenPubKey':initializerTokenPubKey,
            'tokens':tokens,
            'lower':lower,
            'upper':upper
        });
    }
        
    //Not Needed on this page
    // async function getEscrowTokens (escrowXAccount) {
    //     for (var i = 0; i < 5; i++) {
    //         let res = await loadTokensInEscrow(escrowXAccount);
    
    //         if (typeof res?.result?.value?.uiAmount != 'undefined'){
    //             setValue({
    //                 escrowAccountTokens: res?.result?.value?.uiAmount
    //                 });
    //                 break;
    //             }
    
    //         await timer(4000);
    //     }
    // }

    //// Returns a Promise that resolves after "ms" Milliseconds
    // function timer(ms) {
    //     return new Promise(res => setTimeout(res, ms));
    // }
    
    async function handleInitEscrow(wallet) {
    
        let responseData = await initEscrow(
            wallet,
            state.aliceXPubKey,
            state.aliceXTokens,
            state.aliceYPubKey,
            state.aliceYTokens,
            state.programId);
        if (responseData.isInitialized) {

            setState({ ...state,
                escrowAccountPubkey: responseData.escrowAccountPubkey,
                escrowXAccount: responseData.XTokenTempAccountPubkey
                });
            // getEscrowTokens(responseData.XTokenTempAccountPubkey);
            addBet(state.aliceXPubKey, responseData.XTokenTempAccountPubkey, state.aliceXTokens, 1, 5, true);// TODO: implement range when we get to randomness

        }
    }
}

export default CreateBet;



    

    // async handleSwap(event) {
    //     Swap(
    //         this.state.bobPrivateKey,
    //         this.state.escrowAccountPubkey,
    //         this.state.bobXPubKey,
    //         this.state.bobYPubKey,
    //         this.state.bobXTokens,
    //         this.state.programId);

    //     event.preventDefault();
    // }

    // async handleCancel(event) {
    //     await Cancel(
    //         this.state.aliceXPubKey,
    //         this.state.escrowAccountPubkey,
    //         this.state.aliceXTokens,
    //         this.state.programId);

    //     this.checkEscrowClosure(this.escrowXAccount); 

    //     event.preventDefault();
    // }

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
