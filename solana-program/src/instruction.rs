use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::EscrowError::InvalidInstruction;

pub enum EscrowInstruction {
    /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer, will become escrow token account
    /// 2. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 3. `[writable]` The init token account, used for checking in the later transaction.
    /// 4. `[]` The rent sysvar
    /// 5. `[]` The token program itself
    InitEscrow {
        /// the amount party A expects to receive of Token Y
        amount: u64,
    },
    /// Accepts a trade
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person taking the trade
    /// 1. `[writable]` The taker's token account for the token they send
    /// 2. `[writable]` The PDA's temp token account to get tokens from and eventually close
    /// 3. `[writable]` The initializer's main account to send their rent fees to
    /// 4. `[writable]` The initializer's token account (to will receive tokens)
    /// 5. `[writable]` The escrow account holding the escrow info
    /// 6. `[]` The token program
    /// 7. `[]` The PDA account
    Exchange {
        ///the amount the initializer puts up of token X, as a u64 because that's the max possible supply of a token
        amount: u64,
    },

    /// Cancels an already initialized trade
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[writable]` The escrow account holding the escrow info
    /// 3. `[writable]` The PDA's temp token account to get tokens from and eventually close
    /// 4. `[]` The token program itself
    /// 5. `[]` The PDA account
    Cancel { amount: u64 },
}

impl EscrowInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    /// https://stackoverflow.com/questions/31908636/what-does-the-ampersand-mean-in-a-rust-type
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => Self::InitEscrow {
                amount: Self::unpack_amount(rest)?,
            },
            1 => Self::Exchange {
                amount: Self::unpack_amount(rest)?,
            },
            2 => Self::Cancel {
                amount: Self::unpack_amount(rest)?,
            },
            _ => return Err(InvalidInstruction.into()),
        })
    }

    /// little endian, least-significant value stored first in memory
    fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
        let amount = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        Ok(amount)
    }
}
