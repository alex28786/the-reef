import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const users = {
    alex: process.env.VITE_TEST_USER_A ?? '',
    tiff: process.env.VITE_TEST_USER_B ?? '',
}

const markerPath = path.join(process.cwd(), '.e2e-auth-ok')

const parseCredentials = (value: string) => {
    const [email, password] = value.split('/')
    return { email, password }
}

const loginViaForm = async (page: Page, credentials: { email: string; password: string }) => {
    await page.goto('/login')
    const loginHeading = page.getByRole('heading', { name: 'The Reef' })
    await expect(loginHeading).toBeVisible()

    await page.getByPlaceholder('you@example.com').fill(credentials.email)
    await page.getByPlaceholder('••••••••').fill(credentials.password)
    await page.getByRole('button', { name: 'Sign In' }).click()

    const welcome = page.getByText('Welcome to Your Reef')
    const notLinked = page.getByRole('heading', { name: 'Welcome to The Reef!' })
    const errorMessage = page.locator('.text-red-500, [role="alert"]')

    // Wait for the loading state to appear and then disappear to ensure auth processing is done
    // The "Loading..." text or the bouncing shell 🐚 might appear
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 5000 }).catch(() => { })
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20000 })

    const winner = await Promise.race([
        welcome.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'welcome'),
        notLinked.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'not-linked'),
        errorMessage.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error'),
    ])

    if (winner === 'error') {
        throw new Error('Login failed: error message displayed.')
    }

    if (winner === 'login') {
        // This case is impossible now as we removed it from race, but keeping logic structure
        throw new Error('Login failed: unknown reason.')
    }

    if (winner === 'not-linked') {
        throw new Error('Login succeeded but profile lacks reef_id (not linked to a reef).')
    }

    await expect(page).toHaveURL('/', { timeout: 20000 })
}

test.describe.serial('Sanity Checks', () => {
    let sanityOk = true

    test.beforeAll(() => {
        fs.rmSync(markerPath, { force: true })
    })

    test.afterEach((_, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            sanityOk = false
        }
    })

    test.afterAll(() => {
        if (sanityOk) {
            fs.writeFileSync(markerPath, 'ok')
        } else {
            fs.rmSync(markerPath, { force: true })
        }
    })

    test('Login page loads', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/login/)
        await expect(page.getByRole('heading', { name: 'The Reef' })).toBeVisible()
    })

    test('Sign in as Alex via form', async ({ page }) => {
        test.skip(!users.alex, 'Missing VITE_TEST_USER_A for E2E tests.')
        const { email, password } = parseCredentials(users.alex)
        await loginViaForm(page, { email, password })
    })

    test('Sign in as Tiff via form', async ({ page }) => {
        test.skip(!users.tiff, 'Missing VITE_TEST_USER_B for E2E tests.')
        const { email, password } = parseCredentials(users.tiff)
        await loginViaForm(page, { email, password })
    })

    test('Autologin works', async ({ page }) => {
        test.skip(!users.alex, 'Missing VITE_TEST_USER_A for E2E tests.')
        const { email, password } = parseCredentials(users.alex)
        const encoded = `${encodeURIComponent(email)}/${encodeURIComponent(password)}`

        await page.goto(`/?autologin=${encoded}`)
        await expect(page.getByText('Welcome to Your Reef')).toBeVisible({ timeout: 20000 })
        await expect(page).toHaveURL('/', { timeout: 20000 })
    })
})
