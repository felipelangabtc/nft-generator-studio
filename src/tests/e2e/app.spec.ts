import { test, expect } from '@playwright/test'

test.describe('NFT Generator Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads the dashboard', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Manage your NFT collections')).toBeVisible()
  })

  test('shows new project dialog', async ({ page }) => {
    await page.click('text=New Project')
    await expect(page.locator('text=Create New Project')).toBeVisible()
    await expect(page.locator('text=Set up a new NFT collection project')).toBeVisible()
  })

  test('can create a new project', async ({ page }) => {
    await page.click('text=New Project')
    await page.fill('input[placeholder="My NFT Collection"]', 'Test Collection')
    await page.click('text=Create Project')
    await expect(page).toHaveURL(/\/editor\//)
  })

  test('navigates to settings', async ({ page }) => {
    await page.click('[href="#/settings"]')
    await expect(page.locator('text=Appearance')).toBeVisible()
    await expect(page.locator('text=Customize the look and feel')).toBeVisible()
  })

  test('shows empty state when no projects', async ({ page }) => {
    await expect(page.locator('text=No projects yet')).toBeVisible()
  })
})
