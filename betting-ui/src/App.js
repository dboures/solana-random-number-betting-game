import './App.css';
import { BrowserRouter, Route } from "react-router-dom";
import CreateBet from './components/CreateBet';
import ExecuteBet from './components/ExecuteBet';
import BetList from './components/BetList';
import Connect from './components/Connect';
import ConnectionProvider from './components/ConnectionProvider';

function App() {
  return (
    <div className="App">
      <ConnectionProvider>
      <header className="app-header">
          <span>
            header here
          </span>
          <Connect/>
        </header>
        <div className="container">
        <BrowserRouter>
            <Route path="/" exact component={BetList} />
            <Route path="/create" exact component={CreateBet} />
            <Route path="/bets/:id" exact component={ExecuteBet} />
        </BrowserRouter>
        </div>
      </ConnectionProvider>
    </div>
  );
}

export default App;
