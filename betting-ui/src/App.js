import './App.css';
import { BrowserRouter, Route } from "react-router-dom";
import CreateBet from './components/CreateBet';
import ExecuteBet from './components/ExecuteBet';
import BetList from './components/BetList';
import { Connect } from './components/Connect';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <span>
          header here
        </span>
        <Connect/>
      </header>
      <div className="container">
      <BrowserRouter>
          <Route path="/" exact component={BetList} />
          <Route path="/bets/new" exact component={CreateBet} />
          <Route path="/bets/:id" exact component={ExecuteBet} />
      </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
