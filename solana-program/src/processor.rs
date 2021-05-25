use crate::{error::EscrowError, instruction::EscrowInstruction, state::Escrow};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
use spl_token::state::Account as TokenAccount;

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = EscrowInstruction::unpack(instruction_data)?;

        match instruction {
            EscrowInstruction::InitEscrow { amount } => {
                msg!("Instruction: InitEscrow");
                Self::process_init_escrow(accounts, amount, program_id)
            }
            EscrowInstruction::Exchange { amount } => {
                msg!("Instruction: Exchange");
                Self::process_exchange(accounts, amount, program_id)
            }
            EscrowInstruction::Cancel { amount } => {
                msg!("Instruction: Cancel");
                Self::cancel_exchange(accounts, amount, program_id)
            }
        }
    }

    fn process_exchange(
        accounts: &[AccountInfo],
        amount_expected_by_taker: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let taker = next_account_info(account_info_iter)?; // 0. `[signer]` The account of the person taking the trade

        if !taker.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let takers_token_account = next_account_info(account_info_iter)?; // 1. `[writable]` The taker's token account for the token they send
        let pdas_temp_token_account = next_account_info(account_info_iter)?; // 2. `[writable]` The PDA's temp token account to get tokens from and eventually close
        let pdas_temp_token_account_info =
            TokenAccount::unpack(&pdas_temp_token_account.data.borrow())?;
        let (pda, bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);

        if amount_expected_by_taker != pdas_temp_token_account_info.amount {
            return Err(EscrowError::ExpectedAmountMismatch.into());
        }

        let initializers_main_account = next_account_info(account_info_iter)?; // 3. `[writable]` The initializer's main account to send their rent fees to

        let initializers_token_account = next_account_info(account_info_iter)?; // 4. `[writable]` The initializer's token account (to receive tokens)
                                                                                // msg!("get escrow account");

        let escrow_account = next_account_info(account_info_iter)?; // 5. `[writable]` The escrow account holding the escrow info

        let escrow_info = Escrow::unpack(&escrow_account.data.borrow())?;

        if escrow_info.temp_token_account_pubkey != *pdas_temp_token_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        if escrow_info.initializer_pubkey != *initializers_main_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        if escrow_info.init_token_pubkey != *initializers_token_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        let token_program = next_account_info(account_info_iter)?; // 6. `[]` The token program
        let pda_account = next_account_info(account_info_iter)?; // 7. `[]` The PDA account

        // TODO: figure out how to get randomness, lower and upper in here
        // unfortunately Solana natively does not support randomness, so an oracle is needed

        let throw = 3;
        msg!("Roll the die: {}", throw);
        if throw >= 4 {
            msg!("Alice Wins");

            let transfer_taker_to_initializer_ix = spl_token::instruction::transfer(
                token_program.key,
                takers_token_account.key,
                initializers_token_account.key,
                taker.key,
                &[&taker.key],
                escrow_info.expected_amount,
            )?;
            msg!("Calling the token program to transfer {} of the taker's tokens to the escrow's initializer...", escrow_info.expected_amount);
            invoke(
                &transfer_taker_to_initializer_ix,
                &[
                    takers_token_account.clone(),
                    initializers_token_account.clone(),
                    taker.clone(),
                    token_program.clone(),
                ],
            )?;
            msg!("Create escrow to init transaction");
            let transfer_escrow_to_initializer_ix = spl_token::instruction::transfer(
                token_program.key,
                pdas_temp_token_account.key,    //source
                initializers_token_account.key, // dest
                &pda,                           // authority
                &[&pda],                        // signer
                pdas_temp_token_account_info.amount,
            )?;

            msg!("Calling the token program to transfer the escrow tokens to the escrow's initializer...");
            invoke_signed(
                &transfer_escrow_to_initializer_ix,
                &[
                    pdas_temp_token_account.clone(),
                    initializers_token_account.clone(),
                    pda_account.clone(),
                    token_program.clone(),
                ],
                &[&[&b"escrow"[..], &[bump_seed]]],
            )?;
        } else {
            msg!("Bob Wins");
            let transfer_to_taker_ix = spl_token::instruction::transfer(
                token_program.key,
                pdas_temp_token_account.key,
                takers_token_account.key,
                &pda,
                &[&pda],
                pdas_temp_token_account_info.amount,
            )?;
            msg!("Calling the token program to transfer escrow tokens to the taker...");
            invoke_signed(
                &transfer_to_taker_ix,
                &[
                    pdas_temp_token_account.clone(),
                    takers_token_account.clone(),
                    pda_account.clone(),
                    token_program.clone(),
                ],
                &[&[&b"escrow"[..], &[bump_seed]]],
            )?;
        }
        msg!("start close account");

        let close_pdas_temp_acc_ix = spl_token::instruction::close_account(
            token_program.key,
            pdas_temp_token_account.key,
            initializers_main_account.key,
            &pda,
            &[&pda],
        )?;
        msg!("Calling the token program to close pda's temp account...");
        invoke_signed(
            &close_pdas_temp_acc_ix,
            &[
                pdas_temp_token_account.clone(),
                initializers_main_account.clone(),
                pda_account.clone(),
                token_program.clone(),
            ],
            &[&[&b"escrow"[..], &[bump_seed]]],
        )?;

        msg!("Closing the escrow account...");
        **initializers_main_account.lamports.borrow_mut() = initializers_main_account
            .lamports()
            .checked_add(escrow_account.lamports())
            .ok_or(EscrowError::AmountOverflow)?;
        **escrow_account.lamports.borrow_mut() = 0;

        Ok(())
    }

    pub fn process_init_escrow(
        accounts: &[AccountInfo],
        amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;

        if !initializer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let temp_token_account = next_account_info(account_info_iter)?;
        if *temp_token_account.owner != spl_token::id() {
            return Err(ProgramError::IncorrectProgramId);
        }

        let escrow_account = next_account_info(account_info_iter)?;

        let init_token_account = next_account_info(account_info_iter)?;

        let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

        if !rent.is_exempt(escrow_account.lamports(), escrow_account.data_len()) {
            return Err(EscrowError::NotRentExempt.into());
        }

        let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
        if escrow_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        escrow_info.is_initialized = true;
        escrow_info.initializer_pubkey = *initializer.key;
        escrow_info.init_token_pubkey = *init_token_account.key;
        escrow_info.temp_token_account_pubkey = *temp_token_account.key;
        escrow_info.expected_amount = amount;
        // escrow_info.lower = lower;
        // escrow_info.upper = upper;

        Escrow::pack(escrow_info, &mut escrow_account.data.borrow_mut())?;
        /* We'd like some way for the program to own the X tokens while the escrow is open and waiting for Bob's transaction.
         The question is then, can programs be given user space ownership of a token account?
        The trick is to assign token account ownership to a Program Derived Address (PDA) of the escrow program.
        n
        Program Derived Addresses do not lie on the ed25519 curve and therefore have no private key associated with them.
        */
        let (pda, _bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);

        let token_program = next_account_info(account_info_iter)?;
        let owner_change_ix = spl_token::instruction::set_authority(
            token_program.key,
            temp_token_account.key,
            Some(&pda),
            spl_token::instruction::AuthorityType::AccountOwner,
            initializer.key,
            &[&initializer.key],
        )?;

        msg!("Calling the token program to transfer token account ownership...");
        /* It's a rule that the program being called through a CPI
        must be included as an account in the 2nd argument of invoke (and invoke_signed).
        n
        When including a signed account in a program call, in all CPIs including that account made by that program
        inside the current instruction, the account will also be signed, i.e. the signature is extended to the CPIs. */
        invoke(
            &owner_change_ix,
            &[
                temp_token_account.clone(),
                initializer.clone(),
                token_program.clone(),
            ],
        )?;

        Ok(())
    }

    pub fn cancel_exchange(
        accounts: &[AccountInfo],
        amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let canceller_account = next_account_info(account_info_iter)?;

        if !canceller_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let canceller_token_account = next_account_info(account_info_iter)?;

        let escrow_account = next_account_info(account_info_iter)?;

        msg!("Does token program own escrow token account?...");
        let escrow_token_account = next_account_info(account_info_iter)?;
        if *escrow_token_account.owner != spl_token::id() {
            return Err(ProgramError::IncorrectProgramId);
        }

        let escrow_info = Escrow::unpack(&escrow_account.data.borrow())?;

        msg!("Does escrow account temp token pubkey match escrow token account key?...");
        if escrow_info.temp_token_account_pubkey != *escrow_token_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        msg!("Was escrow initialized?...");
        let escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
        if !escrow_info.is_initialized() {
            return Err(ProgramError::UninitializedAccount);
        }

        msg!("Was escrow initialized by canceler?...");
        if escrow_info.initializer_pubkey != *canceller_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        msg!("Is someone other than the initizer cancelling?");
        if escrow_info.init_token_pubkey != *canceller_token_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        let token_program = next_account_info(account_info_iter)?;

        let (pda, bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);

        let pda_account = next_account_info(account_info_iter)?;

        //transfer token back
        let transfer_to_initializer_ix = spl_token::instruction::transfer(
            token_program.key,
            escrow_token_account.key,    //source
            canceller_token_account.key, //dest
            &pda,                        // authority
            &[&pda],                     // signer
            amount,                      //amount
        )?;

        msg!("Calling the token program to return tokens to the initializer...");
        invoke_signed(
            &transfer_to_initializer_ix,
            &[
                escrow_token_account.clone(),
                canceller_token_account.clone(),
                pda_account.clone(),
                token_program.clone(),
            ],
            &[&[&b"escrow"[..], &[bump_seed]]],
        )?;

        //close holding account
        let close_pdas_temp_acc_ix = spl_token::instruction::close_account(
            token_program.key,
            escrow_token_account.key,
            canceller_account.key,
            &pda,
            &[&pda],
        )?;
        msg!("Calling the token program to close pda's temp account...");
        invoke_signed(
            &close_pdas_temp_acc_ix,
            &[
                escrow_token_account.clone(),
                canceller_account.clone(),
                pda_account.clone(),
                token_program.clone(),
            ],
            &[&[&b"escrow"[..], &[bump_seed]]],
        )?;

        msg!("Closing the escrow account...");
        **canceller_account.lamports.borrow_mut() = canceller_account
            .lamports()
            .checked_add(escrow_account.lamports())
            .ok_or(EscrowError::AmountOverflow)?;
        **escrow_account.lamports.borrow_mut() = 0;

        Ok(())
    }
}
