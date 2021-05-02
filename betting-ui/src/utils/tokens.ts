import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenListProvider } from "@solana/spl-token-registry";
import { Connection } from "@solana/web3.js";

export const loadTokens = async (): Promise<TokenInfo[]> => {
    const TokenProvider = await new TokenListProvider().resolve()
    
    const tokenlist = TokenProvider.filterByClusterSlug('mainnet-beta').getList();
    return tokenlist;
}

export const getUserTokenInformation = async (
    conn : Connection,
    wallet: any
    ): Promise<UserTokenInfo[]> => {
    
    let userTokenAccounts = await conn.getParsedTokenAccountsByOwner(wallet._publicKey, {
        programId: TOKEN_PROGRAM_ID
      },
      'confirmed' ).catch(error => console.log(error));

      console.log(userTokenAccounts);
      if (userTokenAccounts instanceof Object) {
          let ans = userTokenAccounts.value.map(acct => ({
            userTokenAddress: acct.pubkey.toBase58(),
            mintAddress: acct.account.data.parsed.info.mint,
            maxAmount: acct.account.data.parsed.info.tokenAmount.uiAmount,

          }));
          return ans;
      } 
      
      return [];
    
}


  export interface TokenInfo {
    symbol: string
    name: string
  
    address: string
    decimals: number
  
    // tokenAccountAddress?: string
    // balance?: TokenAmount
  }

  export interface UserTokenInfo {
  
    mintAddress:string
    userTokenAddress: string
    maxAmount: number
  
  }

