
import { Component } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../utils/firebase';
import {Swap} from '../utils/swap';
import {Cancel} from '../utils/cancel';

export default class ExecuteBet extends Component {
    async getBet() {
        await db.collection('Bets').doc(this.props.match.params.id).get().then((docu) => {
            console.log(docu.data());
        });
    }

    constructor(props) {
        super(props);
        this.state = {
            programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
            bobPrivateKey: '211,208,37,61,33,9,231,26,133,105,242,232,146,33,169,107,48,214,29,26,82,238,244,41,131,146,218,91,104,27,233,107,246,38,23,174,204,84,149,244,187,85,115,186,89,32,213,245,121,100,154,223,23,112,23,128,93,48,189,1,157,196,255,245',
            bobXPubKey: 'GTgZDXU9PGCUGedZ11364TW2PS9oFVwZyMF6m3EwdSpT',
            bobYPubKey: '6kwXqT1XVh1carXQBUGjKEjsXTPWmV9eTyfKMaZn649Z',
            bobXTokens: 1,
            bobYTokens: 1,

            escrowAccountPubkey: '',
            escrowAccountTokens: 0
        }
    }

    async handleSwap(event) {
        Swap(
            this.state.bobPrivateKey,
            this.state.escrowAccountPubkey,
            this.state.bobXPubKey,
            this.state.bobYPubKey,
            this.state.bobXTokens,
            this.state.programId);

        event.preventDefault();
    }

    async handleCancel(event) {
        //make sure you are the initializer

        // await Cancel(
        //     this.state.aliceXPubKey,
        //     this.state.escrowAccountPubkey,
        //     this.state.aliceXTokens,
        //     this.state.programId);

        // this.checkEscrowClosure(this.escrowXAccount); 

        //
        //Delete from firestore
        //redirect to bets list

        event.preventDefault();
    }

    componentDidMount() {
        this.getBet();
      }

    render() {
        return (
            <div className="mt-5 d-flex justify-content-left">
                <h3>Here is where you can accept the Bet</h3>
                <p> this id: {this.props.match.params.id}</p>
                <Link to="/">
                    <button>
                        Back to Bet List
                    </button>
                </Link>
                <form>
                    <div>
                        <label>
                            ProgramId:
                            <input type="text" name="programId" value={this.state.programId} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob Privatekey:
                            <input type="text" name="bobPrivateKey" value={this.state.bobPrivateKey} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob X Pubkey:
                        <input type="text" name="bobXPubKey" value={this.state.bobXPubKey} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob Y Pubkey:
                        <input type="text" name="bobYPubKey" value={this.state.bobYPubKey} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob X Token Receive:
                        <input type="text" name="bobXTokens" value={this.state.bobXTokens} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Bob Y Token Send:
                        <input type="text" name="bobYTokens" value={this.state.bobYTokens} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Escrow Account Pubkey:
                            <input type="text" name="escrowAccountPubkey" value={this.state.escrowAccountPubkey} disabled={true} onChange={this.handleChange} />
                        </label>
                        <label>
                            Tokens in Escrow Account:
                            <input type="text" name="escrowAccountTokens" value={this.state.escrowAccountTokens} disabled={true} onChange={this.handleChange} />
                        </label>
                    </div>
                </form>
                <button onClick={this.handleCancel.bind(this)}>Cancel</button>
                <button onClick={this.handleSwap.bind(this)}>Swap</button>
            </div>
        )
    }
}