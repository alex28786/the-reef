import { test, expect } from '@playwright/test';

test.describe('Retro Workflow with AI', () => {
    // Shared retro ID to be used by both users
    let retroId;

    // Login helpers - wait for actual home page content rather than just URL
    const loginAlex = async (page: any) => {
        await page.goto('/?autologin=alex28786@gmail.com/Doffel%266128');
        // Wait for the home page content to appear (proves auth succeeded)
        await expect(page.getByText('The Bridge').first()).toBeVisible({ timeout: 20000 });
    };

    const loginTiff = async (page: any) => {
        await page.goto('/?autologin=tiff@tiff.de/tifftiff');
        await expect(page.getByText('The Bridge').first()).toBeVisible({ timeout: 20000 });
    };

    test('Complete Retro Cycle: Create -> Submit (Both) -> Reveal', async ({ browser }) => {
        // 1. Alex creates the Retro
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        page1.on('console', msg => console.log('PAGE1 LOG:', msg.text()));
        await loginAlex(page1);

        // Create new Retro
        // Direct navigation to debug button click issues
        await page1.goto('/retro/new');
        await expect(page1).toHaveURL(/\/retro\/new/);
        await expect(page1).toHaveURL(/\/retro\/new/);

        await page1.fill('input[placeholder="e.g., The argument about vacation plans"]', 'Test Retro: Pizza Night');
        await page1.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
        await page1.getByRole('button', { name: 'Create Retrospective' }).click();

        // Capture Retro ID from URL
        await expect(page1).toHaveURL(/\/retro\/.*\/submit/);
        const url = page1.url();
        retroId = url.split('/').slice(-2)[0];
        console.log('Created Retro ID:', retroId);

        // Alex Submits
        await page1.fill('textarea', 'I thought we agreed on pepperoni, but she ordered hawaiian. I felt unheard.');
        await page1.getByRole('button', { name: 'Submit My Story' }).click();

        // Verify Alex sees "Waiting..."
        await expect(page1.getByText('Your story')).toBeVisible();
        await expect(page1.getByText('Submitted').first()).toBeVisible();
        await expect(page1.getByText('Waiting...')).toBeVisible();

        // 2. Tiff Submits (Triggers AI)
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        page2.on('console', msg => console.log('PAGE2 LOG:', msg.text()));
        await loginTiff(page2);

        // Navigate to the SPECIFIC retro (simulate clicking link or finding in list)
        // For test stability, go directly to URL
        await page2.goto(`/retro/${retroId}/submit`);

        // Tiff Submits
        await page2.fill('textarea', 'I just wanted to surprise him with something sweet and savory. He seemed so angry over nothing.');

        // Click submit and wait for navigation to Reveal (which implies AI success)
        await page2.getByRole('button', { name: 'Submit My Story' }).click();

        // This step might take longer due to AI processing
        try {
            await expect(page2).toHaveURL(/\/reveal$/, { timeout: 30000 });
        } catch (e) {
            console.log('Final page URL:', page2.url());
            if (await page2.getByTestId('debug-status').isVisible()) {
                console.log('DEBUG STATUS:', await page2.getByTestId('debug-status').innerText());
            } else {
                console.log('DEBUG STATUS: Element not visible');
            }
            throw e;
        }

        // 3. Verify Reveal Page Content (Tiff side)
        await expect(page2.getByText('The Reveal')).toBeVisible();
        await expect(page2.getByText('Test Retro: Pizza Night')).toBeVisible();
        await expect(page2.getByRole('heading', { name: 'Video Camera Facts' })).toBeVisible();
        await expect(page2.getByRole('heading', { name: 'Interpretations' })).toBeVisible();

        // Check for some structured output (lists)
        const videoFacts = page2.locator('.text-green-400').locator('..').locator('..').locator('li');
        await expect(videoFacts.first()).toBeVisible();

        // 4. Verify Alex side updates
        // Alex refreshes or navigates
        await page1.reload();
        // Should now see "Both stories submitted!" and "View The Reveal"
        await expect(page1.getByRole('button', { name: 'View The Reveal' })).toBeVisible();
        await page1.getByRole('button', { name: 'View The Reveal' }).click();

        await expect(page1).toHaveURL(/\/reveal$/);
        await expect(page1.getByText('The Reveal')).toBeVisible();

        // Cleanup contexts
        await context1.close();
        await context2.close();
    });
});
