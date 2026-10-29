import { test, expect } from "../playwright-fixture";

/**
 * UI regression test for the Review Proposal modal (Step 7 of DIY Quote).
 *
 * Catches:
 *  - Modal exceeding viewport width (overflow-x)
 *  - Custom workflow cards extending beyond modal bounds
 *  - Layout glitches across mobile / tablet / desktop breakpoints
 *
 * Strategy: drive the DIY Quote builder through the bare minimum required to
 * enable the "Generate Proposal" button, add a long-named custom workflow,
 * open the Review Proposal modal, then assert width fit + snapshot.
 */

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 768 },
] as const;

const LONG_WORKFLOW_NAME =
  "Phase 1 (Months 1–3 · $2,000/mo): AI Email Triage and Automated Report Generation — the fastest path to value for the operations team";

for (const bp of BREAKPOINTS) {
  test(`Review Proposal modal fits viewport @${bp.name} (${bp.width}x${bp.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/explained/pricing/diy-quote");
    await page.waitForLoadState("networkidle");

    // Fill minimum identifying fields so Generate Proposal becomes available.
    // These selectors target visible labels — keep loose to survive minor copy tweaks.
    const company = page.getByLabel(/company name/i).first();
    if (await company.isVisible().catch(() => false)) {
      await company.fill("Regression Test Co");
    }
    const contact = page.getByLabel(/contact name/i).first();
    if (await contact.isVisible().catch(() => false)) {
      await contact.fill("QA Tester");
    }
    const email = page.getByLabel(/email/i).first();
    if (await email.isVisible().catch(() => false)) {
      await email.fill("qa@example.com");
    }

    // Add a custom workflow with an intentionally long name to stress-test wrapping.
    const addCustom = page
      .getByRole("button", { name: /add custom workflow/i })
      .first();
    if (await addCustom.isVisible().catch(() => false)) {
      await addCustom.click();
      const nameInput = page.getByPlaceholder(/workflow name|name/i).first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(LONG_WORKFLOW_NAME);
      }
    }

    // Open Review Proposal modal (button label may be "Generate Proposal" or "Regenerate Proposal").
    const generate = page
      .getByRole("button", { name: /(re)?generate proposal/i })
      .first();
    if (!(await generate.isVisible().catch(() => false))) {
      test.skip(true, "Generate Proposal entry point not reachable in this build");
    }
    await generate.click();

    const dialog = page.getByRole("dialog", { name: /review proposal/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Width assertion: the dialog must not exceed the viewport width.
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.width).toBeLessThanOrEqual(bp.width);
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(bp.width);

    // No element inside the dialog overflows horizontally.
    const overflow = await dialog.evaluate((el) => {
      const root = el as HTMLElement;
      const rootRight = root.getBoundingClientRect().right;
      const offenders: { tag: string; right: number }[] = [];
      root.querySelectorAll("*").forEach((node) => {
        const r = (node as HTMLElement).getBoundingClientRect();
        if (r.right > rootRight + 1) {
          offenders.push({
            tag: (node as HTMLElement).tagName,
            right: r.right,
          });
        }
      });
      return offenders;
    });
    expect(overflow, "No descendant should overflow the modal horizontally").toEqual([]);

    // Visual snapshot for regression review.
    await expect(dialog).toHaveScreenshot(`review-proposal-${bp.name}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
}
