import { Component } from 'react';

export default class BetList extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <div className="mt-5 d-flex justify-content-left">
                <h3>The bets will be listed here</h3>
                and here and here
            </div>
        )
    }
}