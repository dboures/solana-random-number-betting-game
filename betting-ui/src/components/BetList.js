import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../utils/firebase';
import MUIDataTable from "mui-datatables";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';

function BetList() {
    async function  getBets() {
        const bets = []
        await db.collection('Bets').get().then((snapshot) => {
            snapshot.forEach(doc => {
                const data = doc.data();
                bets.push({ 
                    'Bet Id': doc.id,
                    'Escrow Account Pubkey': data.escrowAccountPubkey,
                    'Initializer Token PubKey': data.initializerTokenPubKey,
                    'Token Amount': data.tokens,
                    'Token Type': data.tokenName,
                    'Lower': data.lower,
                    'Upper': data.upper
                });
            });
        });
        setState({betsList: bets}); // TODO: filter list by which tokens the user has?
        //TODO: "my bets" feature for easy canceling
    }

    const [state, setState] = useState({
        betsList: []
    });


    const history = useHistory();

    useEffect(async () => {
        getBets()
      }, []);

const theme = 
    createMuiTheme({
        overrides: {
            MUIDataTableHeadCell: { // TODO: fiddle with this
                root: {
                    '&:first-child': {
                        width: '15%',
                    },
                    '&:nth-child(2)': {
                        width: '20%',
                    },
                    '&:nth-child(3)': {
                        width: '10%',
                    },
                    '&:nth-child(4)': {
                        width: '20%',
                    },
                    '&:nth-child(5)': {
                        width: '10%',
                    },
                    '&:nth-child(6)': {
                        width: '10%',
                    },
                    '&:last-child': {
                        width: '10%',
                    },
                },
            },
        },
    });

    const columns = [
      {
        name: "Bet Id",
        options: {
            filter: false,
            display: false
        }
      },
      {
        name: "Escrow Account Pubkey",
        options: {
            filter: false,
        }
      },
      {
        name: "Initializer Token PubKey",
        options: {
          filter: false,
        }
      },
      {
        name: "Token Amount", // TODO: why are these so bad with overlap?
        options: {
          filter: true,
          sort: true
        }
      },
      {
        name: "Token Type",
        options: {
        filter: true,
          sort: true
        }
      },
      {
        name: "Lower",
        options: {
          filter: false,
        }
      },
      {
        name: "Upper",
        options: {
            filter: false,
        }
      },
    ];

    let Navigate = (rowData) => {
      history.push("/bets/" + rowData[0]);
    }

    const options = {
      filter: true,
      selectableRows: 'none',
      onRowClick: Navigate,
      filterType: 'dropdown',
      responsive: 'vertical',
      rowsPerPage: 10,
    };

    return (
        <div className="mt-5 d-flex justify-content-left">
                <h3>The bets will be listed here</h3>
                <div className="create-bets">
                    <Link to="/create">
                        <button>
                            Create Bets
                        </button>
                    </Link>
                </div>
                <div className="bet-table">
                    <MuiThemeProvider theme={theme}>
                        <MUIDataTable title={"Active Bets"} data={state.betsList} columns={columns} options={options} />
                    </MuiThemeProvider>
                </div>
            </div>
    );

}

export default BetList;