use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

use crate::processor::Processor;

/*  When writing Solana programs, be mindful of the fact that any accounts may be passed into the entrypoint,
including different ones than those defined in the API inside instruction.rs.
It's the program's responsibility to check that received accounts == expected accounts */

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Processor::process(program_id, accounts, instruction_data)
}
