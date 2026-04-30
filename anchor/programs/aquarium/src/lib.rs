#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Hb9mNuHBMNapZ6aewU6a3HKNnJ2nYhMxrhZHM43YKNTo");

#[program]
pub mod aquarium {
    use super::*;

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
        fish.growth   = 0;

        Ok(())
    }

    pub fn feed(ctx: Context<Feed>) -> Result<()> {
        let fish = &mut ctx.accounts.fish;
        let clock = Clock::get()?;

        // Already dead — no point feeding
        if fish.growth >= 255 && (clock.unix_timestamp - fish.last_fed) >= 172_800 {
            return err!(AquariumError::FishDead);
        }

        // Overfeeding a fully grown fish kills it instantly
        if fish.growth >= 255 {
            fish.last_fed = 0;
            msg!("Fish overfed — it has died!");
            return Ok(());
        }

        fish.last_fed = clock.unix_timestamp;
        fish.growth = fish.growth.saturating_add(25);

        Ok(())
    }

    pub fn transfer_fish(ctx: Context<TransferFish>, new_owner: Pubkey) -> Result<()> {
        let fish = &mut ctx.accounts.fish;
        fish.owner = new_owner;
        Ok(())
    }

    pub fn breed(ctx: Context<Breed>, child_nonce: u8) -> Result<()> {
        let clock = Clock::get()?;
        let now = clock.unix_timestamp;

        let parent_a = &ctx.accounts.parent_a;
        let parent_b = &ctx.accounts.parent_b;

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
        child.growth   = 0;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct MintFish<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

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
pub struct TransferFish<'info> {
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner)]
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
    #[msg("Fish has died — fully grown fish perish after 2 days without food")]
    FishDead,
}

#[account]
#[derive(InitSpace)]
pub struct Fish {
    pub owner: Pubkey,    // 32
    pub species: u8,      //  1
    pub color: u8,        //  1
    pub speed: u8,        //  1
    pub size: u8,         //  1
    pub born_at: i64,     //  8
    pub last_fed: i64,    //  8
    pub nonce: u8,        //  1
    pub bump: u8,         //  1
    pub growth: u8,       //  1 — increments by 25 per feed, caps at 255
}
