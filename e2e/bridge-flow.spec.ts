import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const users = {
    alex: process.env.VITE_TEST_USER_A ?? '',
    tiff: process.env.VITE_TEST_USER_B ?? '',
}

const markerPath = path.join(process.cwd(), '.e2e-auth-ok')

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

const getLatestBridgeMessage = async (page: any) => {
    return page.evaluate(async () => {
        const key = Object.keys(localStorage).find(
            (entry) => entry.startsWith('sb-') && entry.endsWith('-auth-token')
        )
        if (!key) return null

        const session = JSON.parse(localStorage.getItem(key) || 'null')
        if (!session?.access_token || !session?.user?.id) return null

        const { fetchRows } = await import('/src/shared/lib/supabaseApi.ts')
        const result = await fetchRows(
            'bridge_messages',
            session.access_token,
            `&recipient_id=eq.${session.user.id}&order=created_at.desc&limit=1`
        )
        return result.data?.[0] ?? null
    })
}

test.describe('Bridge Workflow', () => {
    test.beforeAll(() => {
        if (!fs.existsSync(markerPath)) {
            test.skip(true, 'Sanity checks did not pass; skipping feature E2E tests.')
        }
    })

    test.skip(
        !users.alex || !users.tiff,
        'Missing VITE_TEST_USER_A or VITE_TEST_USER_B for E2E tests.'
    )

    test('Send a bridge message and verify recipient sees it', async ({ browser }) => {
        const contextAlex = await browser.newContext()
        const pageAlex = await contextAlex.newPage()
        if (!await login(pageAlex, users.alex)) {
            test.skip(true, 'E2E login failed for user A; verify Supabase auth and test users exist.')
        }

        await pageAlex.goto('/bridge')
        await pageAlex.getByRole('button', { name: 'Angry' }).click()
        await pageAlex.fill('textarea', `You always ignore me about dinner plans ${Date.now()}`)
        await pageAlex.getByRole('button', { name: 'Let Seal Help' }).click()
        await expect(pageAlex.getByText("Seal's gentle rewrite:")).toBeVisible()
        await pageAlex.getByRole('button', { name: 'Send This Version' }).click()
        await expect(pageAlex.getByText('Ready to send?')).toBeVisible()
        await pageAlex.getByRole('button', { name: 'Send Message' }).click()
        await expect(pageAlex.getByText('Message Sent!')).toBeVisible()

        const contextTiff = await browser.newContext()
        const pageTiff = await contextTiff.newPage()
        if (!await login(pageTiff, users.tiff)) {
            test.skip(true, 'E2E login failed for user B; verify Supabase auth and test users exist.')
        }

        await expect.poll(async () => getLatestBridgeMessage(pageTiff), {
            timeout: 15000,
        }).toMatchObject({
            emotion: 'angry',
        })

        await contextAlex.close()
        await contextTiff.close()
    })
})
