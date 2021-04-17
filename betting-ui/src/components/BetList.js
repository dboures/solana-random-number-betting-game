import { Component } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../utils/firebase';

export default class BetList extends Component {
    async getBets() {
        const bets = []
        await db.collection('Bets').get().then((snapshot) => {
            snapshot.forEach(doc => {
                const data = doc.data();
                bets.push({ 
                    'id': doc.id,
                    'escrowAccountPubkey': data.escrowAccountPubkey,
                    'initializerTokenPubKey': data.initializerTokenPubKey,
                    'tokens': data.tokens,
                    'lower': data.lower,
                    'upper': data.upper
                });
            });
        });
        this.setState({betsList: bets});
    }

    constructor(props) {
        super(props);
        this.state = {
            betsList: []
        }
        
    }

    componentDidMount() {
        this.getBets();
      }

    render() {
        const bl = this.state.betsList.map((bet) =>
        <tr key={bet.id}>
            <td>{bet.escrowAccountPubkey}</td>
            <td>{bet.initializerTokenPubKey}</td>  
            <td>{bet.tokens}</td>  
            <td>{bet.lower}</td>  
            <td>{bet.upper}</td>
            <td>
                <Link to={"/bets/" + bet.id}>
                    <button>
                        Take Bet
                    </button>
                </Link>
            </td>  
        </tr>
        );

        const tableStyle = {
            color: "white",
            backgroundColor: "DodgerBlue",
            padding: "10px",
            fontFamily: "Arial"
          };

        return (
            <div className="mt-5 d-flex justify-content-left">
                <h3>The bets will be listed here</h3>
                <div className="create-bets">
                    <Link to="/bets/new">
                    <button>
                        Create Bets
                    </button>
                </Link>
                </div>
                <div className="bet-table">
                    <table style = {tableStyle}>
                        <thead>
                            <tr>
                                <th>Escrow Account Pubkey</th>
                                <th>Initializer Token Account Pubkey</th>
                                <th>Token At Stake</th>
                                <th>Lower Bound</th>
                                <th>Upper Bound</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {bl}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}