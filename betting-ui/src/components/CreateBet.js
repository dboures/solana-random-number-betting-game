import  { Component } from 'react';
import {Swap} from '../utils/swap';
import {initEscrow} from '../utils/initEscrow';
import {Cancel} from '../utils/cancel';
import { loadTokensInEscrow } from '../utils/loadTokensInEscrow';
import {Connect} from './Connect';
import {db} from '../utils/firebase';

function addBet(initializerTokenPubKey, escrowAccountPubkey, tokens,lower,upper) {
    db.collection('Bets').add({
        'escrowAccountPubkey': escrowAccountPubkey,
        'initializerTokenPubKey':initializerTokenPubKey,
        'tokens':tokens,
        'lower':lower,
        'upper':upper
    });
}


export default class CreateBet extends Component {
    constructor(props) {
        super(props);
        
        this.escrowXAccount = ''
        
        this.state = {
            programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
            aliceXPubKey: 'AtL2vQYJT8Him658iph4JwYWAxdN3YJ7KFd1rx3Yz5oi',
            aliceYPubKey: 'EqakiVnrLfJhnN927D5SJ9mAgubGbLaCdB1eTrdzTffv',
            aliceXTokens: 1,
            aliceYTokens: 1,

            bobPrivateKey: '211,208,37,61,33,9,231,26,133,105,242,232,146,33,169,107,48,214,29,26,82,238,244,41,131,146,218,91,104,27,233,107,246,38,23,174,204,84,149,244,187,85,115,186,89,32,213,245,121,100,154,223,23,112,23,128,93,48,189,1,157,196,255,245',
            bobXPubKey: 'GTgZDXU9PGCUGedZ11364TW2PS9oFVwZyMF6m3EwdSpT',
            bobYPubKey: '6kwXqT1XVh1carXQBUGjKEjsXTPWmV9eTyfKMaZn649Z',
            bobXTokens: 1,
            bobYTokens: 1,

            escrowAccountPubkey: '',
            escrowAccountTokens: 0

        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    async handleInitEscrow(event) {

        let responseData = await initEscrow(
            this.state.aliceXPubKey,
            this.state.aliceXTokens,
            this.state.aliceYPubKey,
            this.state.aliceYTokens,
            this.state.programId);

        if (responseData.isInitialized) {
            this.setState({
                escrowAccountPubkey: responseData.escrowAccountPubkey
                });
            this.escrowXAccount = responseData.XTokenTempAccountPubkey;
            this.getEscrowTokens(this.escrowXAccount);
            addBet(this.state.aliceXPubKey, responseData.XTokenTempAccountPubkey, this.state.aliceXTokens, 1, 5, true);// TODO: implement range when we get to randomness

        }
        event.preventDefault();
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
        await Cancel(
            this.state.aliceXPubKey,
            this.state.escrowAccountPubkey,
            this.state.aliceXTokens,
            this.state.programId);

        this.checkEscrowClosure(this.escrowXAccount); 

        event.preventDefault();
    }

    // Returns a Promise that resolves after "ms" Milliseconds
    timer(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async getEscrowTokens (escrowXAccount) {
        for (var i = 0; i < 5; i++) {
            let res = await loadTokensInEscrow(escrowXAccount);

            if (typeof res?.result?.value?.uiAmount != 'undefined'){
                this.setState({
                    escrowAccountTokens: res?.result?.value?.uiAmount
                    });
                    break;
                }

            await this.timer(4000);
        }
    }

    async checkEscrowClosure (escrowXAccount) {
        for (var i = 0; i < 5; i++) {
            let res = await loadTokensInEscrow(escrowXAccount);

            if (typeof res?.result == 'undefined'){
                this.setState({
                    escrowAccountTokens: 0,
                    escrowAccountPubkey: ''
                    });
                this.escrowXAccount = '';
                    break;
                }

            await this.timer(4000);
        }
    }

    render() {
        return (
            <div className="mt-5 d-flex justify-content-left">
                <h3>Bet Your Solana With a Friend</h3>
                <Connect/>
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
                            Alice X Pubkey:
                        <input type="text" name="aliceXPubKey" value={this.state.aliceXPubKey} onChange={this.handleChange} />
                        </label>
                        <label>
                            Bob X Pubkey:
                        <input type="text" name="bobXPubKey" value={this.state.bobXPubKey} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Alice Y Pubkey:
                        <input type="text" name="aliceYPubKey" value={this.state.aliceYPubKey} onChange={this.handleChange} />
                        </label>
                        <label>
                            Bob Y Pubkey:
                        <input type="text" name="bobYPubKey" value={this.state.bobYPubKey} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Alice X Token Send:
                        <input type="text" name="aliceXTokens" value={this.state.aliceXTokens} onChange={this.handleChange} />
                        </label>
                        <label>
                            Bob X Token Receive:
                        <input type="text" name="bobXTokens" value={this.state.bobXTokens} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Alice Y Token Receive:
                        <input type="text" name="aliceYTokens" value={this.state.aliceYTokens} onChange={this.handleChange} />
                        </label>
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
                <button onClick={this.handleInitEscrow.bind(this)}>Init Escrow</button>
                <button onClick={this.handleCancel.bind(this)}>Cancel</button>
                <button onClick={this.handleSwap.bind(this)}>Swap</button>
            </div>
        )
    }
}