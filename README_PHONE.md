# Tusome EduShelf — Phone-Only Cloud Deployment

This package is prepared for deploying the existing Daraja sandbox server from an Android phone. It uses a Node.js web service and Render's public HTTPS URL. Render documents that web services provide a public `onrender.com` URL, support Node.js, and terminate HTTPS at the edge.

## What you need

- Android phone
- A GitHub account
- Your Daraja sandbox app
- Your Daraja Consumer Key, Consumer Secret, Shortcode and Passkey

**Never put your M-PESA PIN, Consumer Secret, or Passkey in chat or inside `index.html`.** Put secrets only into the hosting service's private environment-variable fields.

## Phone-only steps

### 1. Create a GitHub repository

On your phone, open GitHub in your browser and create a new repository, for example `tusome-edushelf`. Keep it private if you prefer.

### 2. Upload this package

Extract this ZIP. Upload all of these files/folders to the repository:

- `index.html`
- `server.mjs`
- `package.json`
- `.env.example`
- `.gitignore`
- `render.yaml`
- `data/transactions.json`
- `README.md`
- `README_PHONE.md`

Do **not** upload a real `.env` file containing your secrets.

### 3. Create the Render service

In Render, choose **New → Web Service**, connect the GitHub repository, and use:

- Runtime: **Node**
- Build command: `npm install`
- Start command: `npm start`
- Plan: **Free** for sandbox testing

The included `render.yaml` also contains these settings.

### 4. Add the Daraja environment variables

In the Render service's Environment Variables section, add:

- `MPESA_ENV` = `sandbox`
- `MPESA_BASE_URL` = `https://sandbox.safaricom.co.ke`
- `MPESA_CONSUMER_KEY` = your sandbox Consumer Key
- `MPESA_CONSUMER_SECRET` = your sandbox Consumer Secret
- `MPESA_SHORTCODE` = your sandbox shortcode
- `MPESA_PASSKEY` = your sandbox passkey
- `MPESA_TRANSACTION_TYPE` = `CustomerPayBillOnline`

For `MPESA_CALLBACK_URL`, first deploy the service so Render gives you its public HTTPS address. Then set:

`https://YOUR-RENDER-SERVICE.onrender.com/api/payments/callback`

Save the environment variables and redeploy if Render asks you to.

### 5. Check the server

Open:

`https://YOUR-RENDER-SERVICE.onrender.com/api/health`

You should receive JSON showing `ok: true`. After all Daraja variables are present, `configured` should be `true`.

### 6. Put the callback URL into Daraja

Use the same HTTPS callback URL in your Daraja sandbox configuration if the portal asks you to configure a callback URL.

### 7. Open Tusome EduShelf

Open:

`https://YOUR-RENDER-SERVICE.onrender.com/`

Your Tusome EduShelf frontend and backend will now be served from the same HTTPS address.

### 8. Test the sandbox payment

Use the sandbox test instructions/credentials provided by Daraja. Do not use a real M-PESA PIN for a sandbox simulation unless Safaricom's current sandbox instructions specifically require a test value.

## Important limitation

This is a **sandbox/testing deployment**. The current prototype stores transactions in a JSON file. A production payment platform should use a proper database, server-side entitlement checks, secure teacher payout handling, authentication, audit logging, and appropriate business/payment compliance.

## Official references

- Safaricom Daraja: https://developer.safaricom.co.ke/
- Render Web Services: https://render.com/docs/web-services
