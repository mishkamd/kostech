import { test, expect } from '@playwright/test'

test('home page loads with title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Kostech/)
  await expect(page.locator('h1, h2').first()).toBeVisible()
})

test('services list page', async ({ page }) => {
  await page.goto('/servicii')
  await expect(page.locator('a[href^="/servicii/"]').first()).toBeVisible()
})

test('service detail page renders', async ({ page }) => {
  await page.goto('/servicii/mentenanta-pc')
  await expect(page.locator('text=Mentenanță')).toBeVisible()
})

test('booking wizard starts on step 1', async ({ page }) => {
  await page.goto('/booking')
  await expect(page.locator('button, [role=button]').first()).toBeVisible()
})

test('admin redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
})
