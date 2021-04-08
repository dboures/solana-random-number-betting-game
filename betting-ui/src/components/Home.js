import React, { Component } from 'react';

export class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            programId: '',
            alicePrivateKey: '',
            aliceXPubKey: '',
            aliceXTokens: 0,
            aliceYTokens: 0,
            aliceYPubKey: '',

            bobPrivateKey: '',
            bobXPubKey: '',
            bobXTokens: 0,
            bobYTokens: 0,
            bobYPubKey: '',

        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    async handleInitEscrow(event) {
        console.log('init escrow');

        // const response = fetch("api/ping");
        // const ja = await response.then(res => res.json());

        let initData = {
            alicePrivateKey: this.state.alicePrivateKey,
            aliceXPubKey: this.state.aliceXPubKey,
            aliceXTokens: this.state.aliceXTokens,
            aliceYPubKey: this.state.aliceYPubKey,
            aliceYTokens: this.state.aliceYTokens,
            programId: this.state.programId
        }

        console.log(JSON.stringify(initData));

        fetch('api/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify(initData)
        }).then(function (response) {
            console.log(response.json());
        })

        // const response = initEscrow();

        // const res = await response.then(res => res.json());

        // console.log(res);
        //call init escrow fn here
        event.preventDefault();
    }

    async handleSwap(event) {
        console.log('swap');

        const response = fetch("api/ping");
        const ja = await response.then(res => res.json());
        console.log(ja);
        event.preventDefault();
    }


    render() {
        return (
            <div className="mt-5 d-flex justify-content-left">
                <h3>Bet Your Solana With a Friend</h3>
                <form onSubmit={this.handleInitEscrow.bind(this)}>
                    <div>
                        <label>
                            ProgramId:
                            <input type="text" name="programId" value={this.state.programId} onChange={this.handleChange} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Alice Privatekey:
                            <input type="text" name="alicePrivateKey" value={this.state.alicePrivateKey} onChange={this.handleChange} />
                        </label>
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
                        <button>Init Escrow</button>
                        {/* <button onClick={this.handleSwap.bind(this)}>Swap</button> */}
                    </div>
                </form>
            </div>
        )
    }
}