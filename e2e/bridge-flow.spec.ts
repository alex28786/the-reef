
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
        loginStillVisible.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'login'), // Keeping this for now but with loading wait it should be safer
    ])

    if (winner === 'login') {
        return false
    }

    await expect(page).toHaveURL('/', { timeout: 20000 })
    return true
}

const getBridgeMessageByContent = async (page: any, uniqueId: string) => {
    return page.evaluate(async (id: string) => {
        const key = Object.keys(localStorage).find(
            (entry) => entry.startsWith('sb-') && entry.endsWith('-auth-token')
        )
        if (!key) return null

        const session = JSON.parse(localStorage.getItem(key) || 'null')
        if (!session?.access_token || !session?.user?.id) return null

        const { fetchRows } = await import('/src/shared/lib/supabaseApi.ts')

        // Filter by content containing our unique ID
        console.log('Querying for content ID:', id)
        const query = `&recipient_id=eq.${session.user.id}&original_text=ilike.%${encodeURIComponent(id)}%&limit=1`

        const result = await fetchRows(
            'bridge_messages',
            session.access_token,
            query
        )
        console.log('Fetch Result:', JSON.stringify(result))
        return result.data?.[0] ?? null
    }, uniqueId)
}

test.describe('Bridge Workflow', () => {
    // Check for required environment variables
    test.beforeAll(() => {
        if (!users.alex || !users.tiff) {
            throw new Error('Missing VITE_TEST_USER_A or VITE_TEST_USER_B. Cannot run E2E tests.')
        }
    })

    test('Send a bridge message and verify recipient sees it', async ({ browser }) => {
        const uniqueId = `Test Run ${Date.now()}`
        console.log('TEST ID:', uniqueId)
        const contextAlex = await browser.newContext()
        const pageAlex = await contextAlex.newPage()
        if (!await login(pageAlex, users.alex)) {
            test.skip(true, 'E2E login failed for user A; verify Supabase auth and test users exist.')
        }

        await pageAlex.goto('/bridge')
        await pageAlex.getByRole('button', { name: 'Angry' }).click()
        await pageAlex.fill('textarea', `You always ignore me about dinner plans [REF:${uniqueId}]`)
        await pageAlex.getByRole('button', { name: 'Let Seal Help' }).click()
        await expect(pageAlex.getByText("Seal's gentle rewrite:")).toBeVisible()
        await pageAlex.getByRole('button', { name: 'Send This Version' }).click()
        await expect(pageAlex.getByText('Ready to send?')).toBeVisible()
        await pageAlex.getByRole('button', { name: 'Send Message' }).click()
        await expect(pageAlex.getByText('Message Sent!')).toBeVisible()

        const contextTiff = await browser.newContext()
        const pageTiff = await contextTiff.newPage()
        pageTiff.on('console', msg => console.log('PAGE LOG:', msg.text()))
        if (!await login(pageTiff, users.tiff)) {
            test.skip(true, 'E2E login failed for user B; verify Supabase auth and test users exist.')
        }

        // Poll for the SPECIFIC message containing our unique ID
        await expect.poll(async () => getBridgeMessageByContent(pageTiff, uniqueId), {
            timeout: 15000,
        }).toMatchObject({
            emotion: 'angry',
        })

        await contextAlex.close()
        await contextTiff.close()
    })
})
