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
    test('Send a bridge message and verify recipient sees it', async ({ browser }) => {
        const contextAlex = await browser.newContext()
        const pageAlex = await contextAlex.newPage()
        await login(pageAlex, users.alex)

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
        await login(pageTiff, users.tiff)

        await expect.poll(async () => getLatestBridgeMessage(pageTiff), {
            timeout: 15000,
        }).toMatchObject({
            emotion: 'angry',
        })

        await contextAlex.close()
        await contextTiff.close()
    })
})
