# SLV Electricals — Quotations & Bills

A lightweight, mobile-friendly quotation and billing app for SLV Electricals, with a shared login and cloud-synced records.

## Features
- Create quotations and bills / tax invoices
- Add customer details and any number of work or material line items
- Automatically calculate quantities, rates, discounts, optional GST, totals, advance received, and balance due
- Business details and payment instructions shared across devices
- Live A4 document preview and Print / Save PDF
- Save, reopen, and edit documents in a shared Cloudflare D1 storage system
- One shared username/password login with signed, HttpOnly, Secure, SameSite session cookie
- Responsive layout for phones, tablets, and computers
- One-time import of existing local-browser documents when the cloud document list is empty

## Cloudflare setup (required before sign-in and sync work)

The frontend is deployed as Cloudflare Pages. The Pages Functions in `functions/` provide the authenticated API. **Do not use this app for real customer records until you complete these steps and test login.** The GitHub repository is public, so never put passwords, session secrets, or real customer data into repository files.

### 1. Create ten D1 databases
In the [Cloudflare dashboard](https://dash.cloudflare.com/), go to **Workers & Pages → D1 SQL Database** (the label may vary). Create these databases. If you already created the earlier database named `slv-electricals-db`, you can use that existing database as `DB_1` instead of creating `slv-electricals-db-1`; create the other nine databases from the list and map `DB_1` to the existing database.

- `slv-electricals-db-1`
- `slv-electricals-db-2`
- `slv-electricals-db-3`
- `slv-electricals-db-4`
- `slv-electricals-db-5`
- `slv-electricals-db-6`
- `slv-electricals-db-7`
- `slv-electricals-db-8`
- `slv-electricals-db-9`
- `slv-electricals-db-10`

### 2. Create the tables in every database
For **each of the ten databases**, open its SQL Console, copy the complete contents of `schema.sql` from this repository, paste it into the console, and execute it. All ten databases need the same tables and indexes.

### 3. Bind all ten databases to the Pages project
Open **Workers & Pages → Pages → slv-electricals → Settings → Bindings** (labels may vary). Add these D1 bindings, selecting the matching database for each:

| Variable name | D1 database |
|---|---|
| `DB_1` | `slv-electricals-db-1` |
| `DB_2` | `slv-electricals-db-2` |
| `DB_3` | `slv-electricals-db-3` |
| `DB_4` | `slv-electricals-db-4` |
| `DB_5` | `slv-electricals-db-5` |
| `DB_6` | `slv-electricals-db-6` |
| `DB_7` | `slv-electricals-db-7` |
| `DB_8` | `slv-electricals-db-8` |
| `DB_9` | `slv-electricals-db-9` |
| `DB_10` | `slv-electricals-db-10` |

Save the bindings. The app uses them as one logical store: each saved document is assigned consistently to a shard; history searches all ten; edits and deletes find records across all ten. `DB_1` stores shared business settings and the central invoice/quotation counters. Do not remove or rename bindings after saving records.

### 4. Configure the shared login (never commit these values)
In the Pages project's **Settings → Variables and Secrets**, add these for the **Production** environment:
- `SLV_LOGIN_USERNAME`: choose a shared username for you and your friend.
- `SLV_LOGIN_PASSWORD`: choose a long, unique password and share it privately with your friend.
- `SESSION_SECRET`: a randomly generated secret of at least 32 random bytes. Store it as a secret, not in GitHub. Generate one locally with PowerShell, for example:
  ```powershell
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  [Convert]::ToBase64String($bytes)
  $rng.Dispose()
  ```
  Copy the generated output into the Cloudflare secret field. Do not paste it into chat or commit it to the repository.

If you also use Cloudflare's Preview deployments, configure the same three values and the same ten bindings in the Preview environment only if you want preview URLs to access the same data. For real business records, prefer the production URL.

### 5. Redeploy and test
1. Save the Cloudflare settings and trigger a new deployment from the `main` branch.
2. Open the production Pages URL. You should see the SLV Electricals sign-in screen.
3. Sign in with the username and password you configured.
4. Save a test quotation, open the site on another device, sign in, and confirm the document appears. Test editing, deleting the test document, and printing to PDF.
5. Delete the test document if you do not want to keep it.

If sign-in says the service is not configured, check that all three environment variables are present. If records cannot load or save, verify that all bindings are named exactly `DB_1` through `DB_10`, that `schema.sql` ran successfully on all ten databases, and that you redeployed after changing settings.

## Important storage limits
On Cloudflare's Free plan, D1 has a **5 GB total storage allowance across the account**, not 5 GB per database. Ten databases do not multiply that account-wide allowance. The current Free limits also include 10 databases per account, 500 MB per database, and daily row-read/write quotas. Check [Cloudflare's current D1 limits](https://developers.cloudflare.com/d1/platform/limits/) before relying on them, as limits and plans can change.

## Use it
1. Sign in on the deployed website from any device.
2. Click **Business details** and save the business's correct details once; they are shared across devices.
3. Choose **Quotation** or **Tax invoice / Bill**.
4. Enter the customer name and add work/material descriptions, quantity, and rate.
5. Enable GST only when it applies and set the correct rate.
6. Click **Save document** to store it in the cloud, or **Print / Save PDF** to create a shareable copy.

## Data, privacy, and limitations
- All signed-in users share the same records and business settings. Anyone with the shared login can view, edit, or delete documents, so share credentials only with the intended person.
- The API checks a signed session cookie before allowing access to document or settings endpoints. The password and signing secret belong only in Cloudflare's environment settings.
- The API currently returns up to 500 recent documents. Export important bills as PDFs and keep appropriate business backups.
- Legacy documents saved in the current browser are imported only when the cloud document list is empty. Documents in another device's local storage cannot be discovered automatically; import from that device is not automatic.
- Clearing history deletes the shared cloud document list for both users and cannot be undone.
- The app uses ten databases as one logical store, but there is no cross-database SQL transaction. Keep the bindings in place and maintain separate backups.
- Confirm the business's legal name, GSTIN, applicable tax rate, invoice numbering, and payment terms before issuing real invoices. This app does not submit invoices to the GST portal and is not a replacement for accounting or tax advice.

## Deploy
Deploy this repository as a Cloudflare Pages project connected to GitHub, production branch `main`, framework preset **None**, build command blank, output directory `.`. Pages Functions are deployed from the `functions/` directory automatically.
