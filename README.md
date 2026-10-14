# SLV Electricals — Quotations & Bills

A lightweight, mobile-friendly quotation and billing app for SLV Electricals.

## Features
- Create quotations and bills / tax invoices
- Add customer details and any number of work or material line items
- Automatically calculate quantities, rates, discounts, optional GST, totals, advance received, and balance due
- Add business address, phone, email, GSTIN, and payment instructions once in **Business details**
- Live A4 document preview
- Print or choose **Save as PDF** from the browser print dialog
- Save and reopen recent documents on the same browser/device

## Use it
1. Open the deployed website, or open `index.html` in a modern browser.
2. Click **Business details** and enter the correct business information.
3. Choose **Quotation** or **Tax invoice / Bill**.
4. Enter the customer name, add work/material descriptions, quantity and rate.
5. Enable GST only when it applies and set the correct rate.
6. Click **Save document** to keep an editable copy in this browser, or **Print / Save PDF** to make a shareable document.

## Important notes
- No login or server/database is required. Documents are stored in this browser using local storage, so they do not automatically sync to another device or browser.
- Export important documents as PDF and keep a backup. Clearing browser data can remove locally saved documents.
- Confirm the business's legal name, GSTIN, applicable tax rate, invoice numbering, and payment terms before issuing real invoices.
- This app is a simple local-first tool, not accounting software and does not submit invoices to the GST portal.

## Deploy
Deploy the repository as a static site on Cloudflare Pages or GitHub Pages. The site entry point is `index.html`.
