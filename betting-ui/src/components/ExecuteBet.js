import  { useEffect, useState } from 'react';
import { MContext } from '../components/ConnectionProvider';
import { Link } from 'react-router-dom';
import { db } from '../utils/firebase';
import {Swap} from '../utils/swap';
import {Cancel} from '../utils/cancel';
import { closeFirestoreAfterEscrowCloses } from '../utils/tokens';

function ExecuteBet(props) {

    const [state, setState] = useState({
        programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
        bobXPubKey: '8KgqwUxSL5i3UuVVEzMVhtWKXedmYLKeqJtu7LVwuQwj',
        bobXTokens: 1,

        escrowAccountPubkey: '',
        escrowXAccountPubkey: '',
        initTokenPubkey: '',
        escrowAccountTokens: 0
    });

    useEffect(() => {
        db.collection('Bets').doc(props.match.params.id).get().then((docu) => {
            let data = docu.data();
            setState({...state,
                escrowAccountPubkey: data.escrowAccountPubkey,
                escrowXAccountPubkey: data.escrowXAccountString, // TODO: please make names consistent everywhere, yikes
                initTokenPubkey: data.initializerTokenPubKey, 
                bobXTokens: data.tokens,
                betId: props.match.params.id
            });
        });
    }, []);

    function handleChange(event) {
        setState({ ...state,
            [event.target.name]: event.target.value
        })
    }
    return (
        <MContext.Consumer>
          {(context) => (
            <div className="mt-5 d-flex justify-content-left">
                <h3>Here is where you can accept the Bet</h3>
                <p> this id: {props.match.params.id}</p>
                <Link to="/">
                    <button>
                        Back to Bet List
                    </button>
                </Link>
                <form>
                    <div>
                        <label>
                            ProgramId:
                            <input type="text" name="programId" value={state.programId} onChange={handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob Privatekey:
                            <input type="text" name="bobPrivateKey" value={state.bobPrivateKey} onChange={handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob X Pubkey:
                        <input type="text" name="bobXPubKey" value={state.bobXPubKey} onChange={handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Token Cost:
                        <input type="text" name="bobXTokens" value={state.bobXTokens} onChange={handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Escrow Account Pubkey:
                            <input type="text" name="escrowAccountPubkey" value={state.escrowAccountPubkey} onChange={handleChange} />
                        </label>
                        <label>
                            Escrow X Account String:
                            <input type="text" name="escrowXAccountString" value={state.escrowXAccountPubkey} onChange={handleChange} />
                        </label>
                        <label>
                            Tokens in Escrow Account:
                            <input type="text" name="escrowAccountTokens" value={state.escrowAccountTokens} disabled={true} onChange={handleChange} />
                        </label>
                    </div>
                </form>
                {/* <button onClick={this.handleCancel(context.state.wallet))}>Cancel</button> */}
                <button onClick={()=> handleSwap(context.state.connection, context.state.wallet)}>Swap</button>
                </div>
          )}
        </MContext.Consumer>
        )
    
        async function handleSwap(conn, wallet) {
            console.log('handle swap');
            let txid = await Swap(
                wallet,
                state.escrowAccountPubkey,
                state.bobXPubKey,
                state.initTokenPubkey,
                state.bobXTokens,
                state.programId);

            console.log(txid);
            if (closeFirestoreAfterEscrowCloses(conn, state.escrowXAccountPubkey)) {
                await db.collection('Bets').doc(props.match.params.id).delete().catch(error => {console.log(error)});
            }
        }
   

}

export default ExecuteBet;