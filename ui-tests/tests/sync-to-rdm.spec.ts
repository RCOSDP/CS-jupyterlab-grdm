import { test, expect } from '@jupyterlab/galata';

function delay(ms: number) {
  // https://stackoverflow.com/questions/37764665/how-to-implement-sleep-function-in-typescript
  return new Promise( resolve => setTimeout(resolve, ms) );
}

test('should have "Sync to RDM" button, without to_dir directory', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByRole('menuitem').filter({ hasText: 'Sync to RDM' }).click();

  await expect(page.getByText('Not running in a GakuNin RDM linked environment')).toBeVisible();
  await page
    .locator('[aria-label="Ok"]')
    .click();
});

test('should work "Sync to RDM" button, with to_dir directory', async ({ page }) => {
  await page.locator('.jp-BreadCrumbs-home').click();

  await page.getByTitle('New Folder').click();
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').click();
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').locator('input').fill('remote');
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').locator('input').press('Enter');
  await expect(page.locator('[data-file-type="directory"]').getByText('remote')).toBeVisible();

  await delay(500);

  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByRole('menuitem').filter({ hasText: 'Sync to RDM' }).click();

  await expect(page.getByText('No `result` directory:')).toBeVisible();
  await page
    .locator('[aria-label="Ok"]')
    .click();

  await page.getByTitle('New Folder').click();
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').click();
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').locator('input').fill('result');
  await page.locator('[data-file-type="directory"][title^="Name: Untitled Folder"]').locator('input').press('Enter');
  await expect(page.locator('[data-file-type="directory"]').getByText('result')).toBeVisible();

  await delay(500);

  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByRole('menuitem').filter({ hasText: 'Sync to RDM' }).click();

  await expect(page.getByText('`result` has no files:')).toBeVisible();
  await page
    .locator('[aria-label="Ok"]')
    .click();

  await page.locator('[data-file-type="directory"][title^="Name: result"]').dblclick();

  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByRole('listitem').filter({ hasText: 'New' }).click();
  await page.getByRole('menuitem', { name: 'Text File', exact: true }).click();

  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByRole('menuitem').filter({ hasText: 'Sync to RDM' }).click();

  await expect(page.getByText('Finished', { exact: true })).toBeVisible();
  await page
    .locator('[aria-label="Ok"]')
    .click();
  
  await page.locator('.jp-BreadCrumbs-home').click();
  await page.locator('[data-file-type="directory"][title^="Name: remote"]').dblclick();

  await delay(500);
  await expect(page.locator('[data-file-type="directory"][title^="Name: test-result"]')).toBeVisible();
});
