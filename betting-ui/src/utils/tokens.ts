import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenListProvider } from "@solana/spl-token-registry";
import { Connection, PublicKey } from "@solana/web3.js";

export const getUserTokenInformation = async (
    conn : Connection,
    wallet: any
    ): Promise<UserTokenInfo[]> => {
    
    let userTokenAccounts = await conn.getParsedTokenAccountsByOwner(wallet._publicKey, {
        programId: TOKEN_PROGRAM_ID
      },
      'confirmed' ).catch(error => console.log(error));

      const TokenProvider = await new TokenListProvider().resolve();
      const rawTokenlist = TokenProvider.filterByClusterSlug('mainnet-beta').getList();

      if (userTokenAccounts instanceof Object) {
          let ans : UserTokenInfo[] = userTokenAccounts.value.map(acct => ({
            userTokenAddress: acct.pubkey.toBase58(),
            mintAddress: acct.account.data.parsed.info.mint,
            maxAmount: acct.account.data.parsed.info.tokenAmount.uiAmount,
          }));

          if(ans.length == 0) {
            return []
          }

          ans.forEach(userToken => {
            userToken.name = userToken.mintAddress
            if(rawTokenlist.map(token => token.address).includes(userToken.mintAddress)) {
              let rawToken = rawTokenlist.find(rt => {
                return rt.address == userToken.mintAddress
              });

              userToken.symbol = rawToken?.symbol
              userToken.name = rawToken?.name        
              userToken.iconUri = rawToken?.logoURI
            }
          })
          
          return ans;
      } 
      
      return [];
    
}

export const closeFirestoreAfterEscrowCloses = async (
  conn : Connection,
  escrowXAccount: string
  ): Promise<boolean> => {

  for (var i = 0; i < 5; i++) {
    let escrowPubkey = new PublicKey(escrowXAccount);
    let escrowData = await conn.getTokenAccountBalance(escrowPubkey, 'confirmed').catch(error => {});
    if (typeof escrowData == 'undefined') {
      return true;
    }
    await new Promise(r => setTimeout(r, 4000));
  }

  return false;
}

  export interface RawTokenInfo {
    symbol: string,
    name: string,
    address: string,
    decimals: number
  }

  export interface UserTokenInfo {
    symbol?: string,
    name?: string,
    mintAddress:string,
    userTokenAddress?: string,
    maxAmount?: number,
    iconUri?: string
  }

