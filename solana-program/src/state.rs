use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct Escrow {
    pub is_initialized: bool,
    pub initializer_pubkey: Pubkey,
    pub init_token_pubkey: Pubkey,
    pub temp_token_account_pubkey: Pubkey,
    pub expected_amount: u64,
}

/* Looking at our Escrow struct, we can see how to calculate the length of the struct
by adding the sizes of the individual data types: 1 (bool) + 3 * 32 (Pubkey) + 1 * 8 (u64) = 105.
 It's okay to use an entire u8 for the bool since it'll make our coding easier
  and the cost of those extra wasted bits is infinitesimal. */

impl Sealed for Escrow {}

impl IsInitialized for Escrow {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for Escrow {
    const LEN: usize = 105;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, Escrow::LEN];
        let (
            is_initialized,
            initializer_pubkey,
            init_token_pubkey,
            temp_token_account_pubkey,
            expected_amount,
        ) = array_refs![src, 1, 32, 32, 32, 8];
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InsufficientFunds),
        };

        Ok(Escrow {
            is_initialized,
            initializer_pubkey: Pubkey::new_from_array(*initializer_pubkey),
            init_token_pubkey: Pubkey::new_from_array(*init_token_pubkey),
            temp_token_account_pubkey: Pubkey::new_from_array(*temp_token_account_pubkey),
            expected_amount: u64::from_le_bytes(*expected_amount),
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, Escrow::LEN];
        let (
            is_initialized_dst,
            initializer_pubkey_dst,
            init_token_pubkey_dst,
            temp_token_account_pubkey_dst,
            expected_amount_dst,
        ) = mut_array_refs![dst, 1, 32, 32, 32, 8];

        let Escrow {
            is_initialized,
            initializer_pubkey,
            init_token_pubkey,
            temp_token_account_pubkey,
            expected_amount,
        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        initializer_pubkey_dst.copy_from_slice(initializer_pubkey.as_ref());
        init_token_pubkey_dst.copy_from_slice(init_token_pubkey.as_ref());
        temp_token_account_pubkey_dst.copy_from_slice(temp_token_account_pubkey.as_ref());
        *expected_amount_dst = expected_amount.to_le_bytes();
    }
}
