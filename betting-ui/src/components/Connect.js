import { MContext } from './ConnectionProvider';

function Connect() {

    return (
      <div>
        <MContext.Consumer>
          {(context) => (
            context.state.wallet.connected ? 
            <button disabled={true}> Already Connected</button> :
            <button onClick={() => context.connect()}>Connect Wallet Buddy</button> 
          )}
        </MContext.Consumer>
      </div>
    )

}

export default Connect


