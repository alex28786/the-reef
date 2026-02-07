
import { test, expect } from '@playwright/test'

const users = {
    alex: process.env.VITE_TEST_USER_A ?? '',
    tiff: process.env.VITE_TEST_USER_B ?? '',
}



const login = async (page: any, autologin: string) => {
    const [email, password] = autologin.split('/')
    const encodedAutologin = `${encodeURIComponent(email)}/${encodeURIComponent(password)}`
    await page.goto(`/?autologin=${encodedAutologin}`)

    const loginHeading = page.getByRole('heading', { name: 'The Reef' })
    if (await loginHeading.isVisible({ timeout: 3000 })) {
        await page.getByLabel('Email').fill(email)
        await page.getByLabel('Password').fill(password)
        await page.getByRole('button', { name: 'Sign In' }).click()
    }

    const welcome = page.getByText('Welcome to Your Reef')
    const loginStillVisible = page.getByRole('heading', { name: 'The Reef' })

    // Wait for loading to finish
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 5000 }).catch(() => { })
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20000 })

    const winner = await Promise.race([
        welcome.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'welcome'),
        loginStillVisible.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'login'),
    ])

    if (winner === 'login') {
        return false
    }

    await expect(page).toHaveURL('/', { timeout: 20000 })
    return true
}

test.describe('Retro Workflow', () => {
    // Check for required environment variables
    test.beforeAll(() => {
        if (!users.alex || !users.tiff) {
            throw new Error('Missing VITE_TEST_USER_A or VITE_TEST_USER_B. Cannot run E2E tests.')
        }
    })

    test('Complete retro flow across both users', async ({ browser }) => {
        const contextAlex = await browser.newContext()
        const pageAlex = await contextAlex.newPage()
        if (!await login(pageAlex, users.alex)) {
            test.skip(true, 'E2E login failed for user A; verify Supabase auth and test users exist.')
        }

        await pageAlex.goto('/retro/new')
        await expect(pageAlex).toHaveURL(/\/retro\/new/)

        const retroTitle = `Test Retro: Pizza Night ${Date.now()}`
        await pageAlex.fill('input[placeholder="e.g., The argument about vacation plans"]', retroTitle)
        await pageAlex.fill('input[type="date"]', new Date().toISOString().split('T')[0])
        await pageAlex.getByRole('button', { name: 'Create Retrospective' }).click()

        await expect(pageAlex).toHaveURL(/\/retro\/.*\/submit/)
        const retroId = pageAlex.url().split('/').slice(-2)[0]

        await pageAlex.fill('textarea', 'I thought we agreed on pepperoni, but she ordered hawaiian. I felt unheard.')
        await pageAlex.getByRole('button', { name: 'Submit My Story' }).click()

        await expect(pageAlex.getByText('Your story')).toBeVisible()
        await expect(pageAlex.getByText('Submitted').first()).toBeVisible()
        await expect(pageAlex.getByText('Waiting...')).toBeVisible()

        const contextTiff = await browser.newContext()
        const pageTiff = await contextTiff.newPage()
        if (!await login(pageTiff, users.tiff)) {
            test.skip(true, 'E2E login failed for user B; verify Supabase auth and test users exist.')
        }

        await pageTiff.goto(`/retro/${retroId}/submit`)
        await pageTiff.fill('textarea', 'I just wanted to surprise him with something sweet and savory. He seemed so angry over nothing.')
        await pageTiff.getByRole('button', { name: 'Submit My Story' }).click()

        await expect(pageTiff).toHaveURL(/\/reveal$/, { timeout: 30000 })

        await expect(pageTiff.getByText('The Reveal')).toBeVisible()
        await expect(pageTiff.getByText(retroTitle)).toBeVisible()

        // Both users' columns should be visible, so headings appear twice
        await expect(pageTiff.getByRole('heading', { name: 'Video Camera Facts' })).toHaveCount(2)
        await expect(pageTiff.getByRole('heading', { name: 'Interpretations' })).toHaveCount(2)

        // Locate facts relative to the heading to be robust against color changes
        const factsHeading = pageTiff.getByRole('heading', { name: 'Video Camera Facts' }).first()
        const videoFacts = factsHeading.locator('..').locator('ul > li')
        await expect(videoFacts.first()).toBeVisible()

        await pageAlex.reload()
        await expect(pageAlex.getByRole('button', { name: 'View The Reveal' })).toBeVisible()
        await pageAlex.getByRole('button', { name: 'View The Reveal' }).click()
        await expect(pageAlex).toHaveURL(/\/reveal$/)
        await expect(pageAlex.getByText('The Reveal')).toBeVisible()

        await contextAlex.close()
        await contextTiff.close()
    })
})
