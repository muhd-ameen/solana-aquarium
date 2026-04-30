#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

// Placeholder program ID — `anchor keys sync` will overwrite this
// with the real keypair-derived address after the first build.
declare_id!("Hb9mNuHBMNapZ6aewU6a3HKNnJ2nYhMxrhZHM43YKNTo");

#[program]
pub mod aquarium {
    use super::*;

    /// Mints a new Fish PDA for the signer.
    ///
    /// `nonce` lets one wallet own multiple fish — the PDA seeds are
    /// `[b"fish", owner, nonce]` so each (owner, nonce) is unique.
    ///
    /// Traits are pseudo-random: derived from the Clock sysvar's
    /// timestamp + slot. NOT cryptographically random — fine for a
    /// hackathon, do not use this pattern in production code.
    pub fn mint_fish(ctx: Context<MintFish>, nonce: u8) -> Result<()> {
        let fish = &mut ctx.accounts.fish;
        let clock = Clock::get()?;

        let seed = (clock.unix_timestamp as u64) ^ clock.slot.rotate_left(13);

        fish.owner    = ctx.accounts.owner.key();
        fish.species  = ((seed >>  0) & 0x07) as u8;
        fish.color    = ((seed >>  8) & 0x07) as u8;
        fish.speed    = ((seed >> 16) & 0xFF) as u8;
        fish.size     = ((seed >> 24) & 0xFF) as u8;
        fish.born_at  = clock.unix_timestamp;
        fish.last_fed = clock.unix_timestamp;
        fish.nonce    = nonce;
        fish.bump     = ctx.bumps.fish;

        Ok(())
    }

    /// Updates `last_fed` to the current timestamp.
    /// Only the fish's owner can feed it.
    pub fn feed(ctx: Context<Feed>) -> Result<()> {
        let fish = &mut ctx.accounts.fish;
        let clock = Clock::get()?;
        fish.last_fed = clock.unix_timestamp;
        Ok(())
    }

    /// Breeds two fish owned by the signer to create a child.
    /// Both parents must be well-fed (fed within the last 24h).
    /// Child traits are a mix of parents + Clock entropy.
    pub fn breed(ctx: Context<Breed>, child_nonce: u8) -> Result<()> {
        let clock = Clock::get()?;
        let now = clock.unix_timestamp;

        let parent_a = &ctx.accounts.parent_a;
        let parent_b = &ctx.accounts.parent_b;

        // Both parents must be fed within 24h
        require!(
            now - parent_a.last_fed < 86400,
            AquariumError::ParentStarving
        );
        require!(
            now - parent_b.last_fed < 86400,
            AquariumError::ParentStarving
        );

        let seed = (now as u64) ^ clock.slot.rotate_left(7);

        let child = &mut ctx.accounts.child;
        child.owner   = ctx.accounts.owner.key();
        // Mix parent traits: average + small random jitter
        child.species = if seed & 1 == 0 { parent_a.species } else { parent_b.species };
        child.color   = if seed & 2 == 0 { parent_a.color } else { parent_b.color };
        child.speed   = (((parent_a.speed as u16 + parent_b.speed as u16) / 2) as u8)
            .wrapping_add(((seed >> 8) & 0x0F) as u8);
        child.size    = (((parent_a.size as u16 + parent_b.size as u16) / 2) as u8)
            .wrapping_add(((seed >> 16) & 0x0F) as u8);
        child.born_at  = now;
        child.last_fed = now;
        child.nonce    = child_nonce;
        child.bump     = ctx.bumps.child;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct MintFish<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// PDA: [b"fish", owner, nonce]. `init` allocates space and pays rent
    /// from `owner`. `bump` is auto-found and stored in the account.
    #[account(
        init,
        payer = owner,
        space = 8 + Fish::INIT_SPACE,
        seeds = [b"fish", owner.key().as_ref(), &[nonce]],
        bump,
    )]
    pub fish: Account<'info, Fish>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Feed<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"fish", owner.key().as_ref(), &[fish.nonce]],
        bump = fish.bump,
        has_one = owner,
    )]
    pub fish: Account<'info, Fish>,
}

#[derive(Accounts)]
#[instruction(child_nonce: u8)]
pub struct Breed<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(has_one = owner)]
    pub parent_a: Account<'info, Fish>,

    #[account(has_one = owner)]
    pub parent_b: Account<'info, Fish>,

    #[account(
        init,
        payer = owner,
        space = 8 + Fish::INIT_SPACE,
        seeds = [b"fish", owner.key().as_ref(), &[child_nonce]],
        bump,
    )]
    pub child: Account<'info, Fish>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum AquariumError {
    #[msg("Parent fish is starving — feed it before breeding")]
    ParentStarving,
}

/// Fixed-size Fish account.
/// `InitSpace` derive computes the on-chain size automatically — saves
/// you from the classic `AccountDidNotDeserialize` math errors.
#[account]
#[derive(InitSpace)]
pub struct Fish {
    pub owner: Pubkey,    // 32 bytes — wallet that minted this fish
    pub species: u8,      //  1
    pub color: u8,        //  1
    pub speed: u8,        //  1 — affects swim animation in the frontend
    pub size: u8,         //  1 — affects render scale
    pub born_at: i64,     //  8 — unix timestamp at mint
    pub last_fed: i64,    //  8 — updated by feed() (Day 2)
    pub nonce: u8,        //  1 — distinguishes multiple fish per owner
    pub bump: u8,         //  1 — saved bump for re-derivation
}
// On-chain size: 8 (discriminator) + 32 + 6×1 + 2×8 = 62 bytes
