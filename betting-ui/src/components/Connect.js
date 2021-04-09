import React, { Component } from 'react';
import {Swap} from '../utils/swap';
import {initEscrow} from '../utils/initEscrow';
import { Connection, SystemProgram, clusterApiUrl } from '@solana/web3.js';
import Wallet from '@project-serum/sol-wallet-adapter';
import { render } from '@testing-library/react';


async function connect() {
    let connection = new Connection("http://localhost:8899", 'singleGossip');
    //let connection = new Connection(clusterApiUrl('devnet'));
    let providerUrl = 'https://www.sollet.io';
    let wallet = new Wallet(providerUrl);
    wallet.on('connect', publicKey => console.log('Connected to ' + publicKey.toBase58()));
    wallet.on('disconnect', () => console.log('Disconnected'));
    await wallet.connect();
}

export class Connect extends Component {


    render() {
        return (
            <button onClick={connect}>Connect Wallet Buddy</button>
        )
    }
}


