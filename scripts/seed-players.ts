/**
 * Seed 21 test players (player4 – player24) via the UI.
 * Run:  npx ts-node --project tsconfig.seed.json scripts/seed-players.ts
 *   OR: npx tsx scripts/seed-players.ts
 */

import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL  = 'http://localhost:3000';
const PASSWORD  = 'Testing123!';
const DOMAIN    = '@gcrdnvz4.mailosaur.net';

// ── Varied test data pools ───────────────────────────────────────────────────
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey',
  'Jamie', 'Avery', 'Riley', 'Quinn', 'Drew',
  'Blake', 'Skylar', 'Reese', 'Cameron', 'Finley',
  'Sage', 'Rowan', 'Ellis', 'Harper', 'Emery', 'Parker',
];
const LAST_NAMES  = [
  'Singh', 'Patel', 'Chen', 'Sharma', 'Nair',
  'Kumar', 'Shah', 'Mehta', 'Gupta', 'Ali',
  'Khan', 'Rao', 'Iyer', 'Bhat', 'Pillai',
  'Verma', 'Joshi', 'Das', 'Mishra', 'Kapoor', 'Reddy',
];
const SKILLS      = ['beginner', 'intermediate', 'advanced', 'competitive'];
const GENDERS     = ['male', 'female', 'prefer_not_to_say'];
const HANDS       = ['left', 'right', 'ambidextrous'];

// Dates spread from 1985-01-01 to 2000-12-31
function dob(i: number) {
  const year  = 1985 + (i % 16);
  const month = String((i % 12) + 1).padStart(2, '0');
  const day   = String((i % 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Players to create — only the 7 that failed (male gender, player4,7,10,13,16,19,22) ──
const FAILED_NUMS = [4, 7, 10, 13, 16, 19, 22];
const PLAYERS = Array.from({ length: 21 }, (_, i) => {
  const n = i + 4;
  return {
    num:    n,
    email:  `player${n}${DOMAIN}`,
    name:   `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`,
    dob:    dob(i),
    gender: GENDERS[i % 3],
    skill:  SKILLS[i % 4],
    years:  String(i % 10),
    hand:   HANDS[i % 3],
  };
}).filter((p) => FAILED_NUMS.includes(p.num));

// ── Helpers ──────────────────────────────────────────────────────────────────
async function signUp(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/player/login`);
  await page.waitForLoadState('networkidle');

  // Try logging in first (account may already exist from a previous failed run)
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  // Click the form's submit button specifically
  await page.locator('form button[type="submit"]').click();

  try {
    await page.waitForURL(/\/(player\/onboarding|player\/portal)/, { timeout: 8_000 });
    return; // login worked
  } catch {
    // login failed — account doesn't exist yet, sign up instead
  }

  await page.goto(`${BASE_URL}/player/login`);
  await page.waitForLoadState('networkidle');

  // Switch to Sign Up tab (the pill toggle, not the submit button)
  await page.locator('div.flex.bg-slate-800\\/60 button').filter({ hasText: /^sign up$/i }).click();
  await page.waitForTimeout(300);

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('form button[type="submit"]').click();

  await page.waitForURL(/\/(player\/onboarding|player\/portal)/, { timeout: 15_000 });
}

async function completeOnboarding(page: Page, p: typeof PLAYERS[0]) {
  if (!page.url().includes('/player/onboarding')) return; // already done

  /* ── Step 1: Personal ─────────────────────────────────────────────── */
  await page.waitForSelector('input[placeholder*="Alex"]', { timeout: 8_000 });

  // Full Name
  await page.fill('input[placeholder*="Alex"]', p.name);

  // Date of birth
  await page.fill('input[type="date"]', p.dob);

  // Gender — use exact match to avoid "Male" matching inside "Female"
  await page.getByRole('button', { name: genderLabel(p.gender), exact: true }).click();

  // Continue
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(400);

  /* ── Step 2: Experience ───────────────────────────────────────────── */
  // Skill level card
  await page.getByRole('button', { name: new RegExp(p.skill, 'i') }).click();

  // Years of experience
  await page.fill('input[type="number"]', p.years);

  // Preferred hand
  await page.getByRole('button', { name: new RegExp(handLabel(p.hand), 'i') }).click();

  // Continue
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(400);

  /* ── Step 3: Emergency (optional — skip straight to submit) ───────── */
  await page.getByRole('button', { name: /complete setup/i }).click();

  // Wait for redirect to portal
  await page.waitForURL(/\/player\/portal/, { timeout: 15_000 });
}

function genderLabel(g: string) {
  if (g === 'male')   return 'Male';
  if (g === 'female') return 'Female';
  return 'Prefer not to say';
}

function handLabel(h: string) {
  if (h === 'left')         return 'Left';
  if (h === 'right')        return 'Right';
  return 'Both';
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser: Browser = await chromium.launch({ headless: true });

  let success = 0;
  let fail    = 0;

  for (const player of PLAYERS) {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    try {
      console.log(`[${player.num}/24] Registering ${player.email} as "${player.name}"…`);
      await signUp(page, player.email, PASSWORD);
      await completeOnboarding(page, player);
      console.log(`  ✅ Done → portal`);
      success++;
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message ?? err}`);
      // Capture a screenshot for debugging
      await page.screenshot({ path: `scripts/screenshots/player${player.num}-error.png` }).catch(() => {});
      fail++;
    } finally {
      await ctx.close();
    }
  }

  await browser.close();

  console.log(`\n══════════════════════════════════`);
  console.log(`✅ Success: ${success}  ❌ Failed: ${fail}`);
  console.log(`Total in system: ${success + 3} (including your 3 existing players)`);
  console.log(`══════════════════════════════════`);
})();
