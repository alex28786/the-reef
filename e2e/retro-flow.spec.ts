import { test, expect } from '@playwright/test'

const users = {
    alex: 'alex28786@gmail.com/Doffel%266128',
    tiff: 'tiff@tiff.de/tifftiff',
}

const login = async (page: any, autologin: string) => {
    const [email, password] = autologin.replace('%26', '&').split('/')
    await page.goto(`/?autologin=${autologin}`)

    const loginHeading = page.getByRole('heading', { name: 'The Reef' })
    if (await loginHeading.isVisible({ timeout: 3000 })) {
        await page.getByLabel('Email').fill(email)
        await page.getByLabel('Password').fill(password)
        await page.getByRole('button', { name: 'Sign In' }).click()
    }

    await expect(page).toHaveURL('/', { timeout: 20000 })
    await expect(page.getByText('Welcome to Your Reef')).toBeVisible({ timeout: 20000 })
}

test.describe('Retro Workflow', () => {
    test('Complete retro flow across both users', async ({ browser }) => {
        const contextAlex = await browser.newContext()
        const pageAlex = await contextAlex.newPage()
        await login(pageAlex, users.alex)

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
        await login(pageTiff, users.tiff)

        await pageTiff.goto(`/retro/${retroId}/submit`)
        await pageTiff.fill('textarea', 'I just wanted to surprise him with something sweet and savory. He seemed so angry over nothing.')
        await pageTiff.getByRole('button', { name: 'Submit My Story' }).click()

        await expect(pageTiff).toHaveURL(/\/reveal$/, { timeout: 30000 })

        await expect(pageTiff.getByText('The Reveal')).toBeVisible()
        await expect(pageTiff.getByText(retroTitle)).toBeVisible()
        await expect(pageTiff.getByRole('heading', { name: 'Video Camera Facts' })).toBeVisible()
        await expect(pageTiff.getByRole('heading', { name: 'Interpretations' })).toBeVisible()

        const videoFacts = pageTiff.locator('.text-green-400').locator('..').locator('..').locator('li')
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
