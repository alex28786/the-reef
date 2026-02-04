import { test, expect } from '@playwright/test';

test.describe('Sanity Checks', () => {

    test('Login Page Loads', async ({ page }) => {
        await page.goto('/');
        // Should redirect to login if not authenticated
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: 'The Reef' })).toBeVisible();
    });

    test('Autologin as Alex (Husband)', async ({ page }) => {
        // Usage: ?autologin=email/password (URL encoded)
        // Password "Doffel&6128" contains & which must be encoded as %26
        await page.goto('/?autologin=alex28786@gmail.com/Doffel%266128');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL('/', { timeout: 15000 });

        // Check for dashboard content
        await expect(page.getByText('Welcome to Your Reef')).toBeVisible();
        await expect(page.getByText('Alex')).toBeVisible(); // Avatar/Name in header
    });

    test('Autologin as Tiff (Wife)', async ({ page }) => {
        await page.goto('/?autologin=tiff@tiff.de/tifftiff');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL('/', { timeout: 15000 });

        // Check for dashboard content
        await expect(page.getByText('Welcome to Your Reef')).toBeVisible();
        await expect(page.getByText('Tiff')).toBeVisible();
    });

    test('Navigate to Retro as Tiff', async ({ page }) => {
        await page.goto('/?autologin=tiff@tiff.de/tifftiff');

        // Wait for dashboard to ensure we are logged in
        await expect(page).toHaveURL('/', { timeout: 15000 });

        // Click on Retro tab (octopus) - handle potential duplicate links (mobile/desktop)
        await page.getByRole('link', { name: 'The Retro' }).first().click();

        await expect(page).toHaveURL(/\/retro/);
        await expect(page.getByRole('heading', { name: 'The Retro' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Start New Retrospective' })).toBeVisible();
    });

});
