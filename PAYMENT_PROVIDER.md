# Payment Provider Setup

In dev mode (`NODE_ENV !== 'production'`) all charges and payouts auto-succeed instantly.
In production, wire up the providers below.

---

## Checkout payments (Paynow — Zimbabwe primary)

**Steps:**
1. Register at https://www.paynow.co.zw/
2. Get your Integration ID and Integration Key from the merchant portal
3. Set environment variables:
   ```
   PAYNOW_INTEGRATION_ID=<your-integration-id>
   PAYNOW_INTEGRATION_KEY=<your-integration-key>
   PAYNOW_RETURN_URL=https://yourdomain.com/payment/return
   PAYNOW_RESULT_URL=https://yourdomain.com/payment/result
   ```
4. Install the SDK: `npm install paynow`
5. In `backend/bridge/payments.js`, replace the `// TODO: Paynow charge` comment:
   ```javascript
   const Paynow = require('paynow')
   const paynow = new Paynow(process.env.PAYNOW_INTEGRATION_ID, process.env.PAYNOW_INTEGRATION_KEY)
   paynow.returnUrl = process.env.PAYNOW_RETURN_URL
   paynow.resultUrl = process.env.PAYNOW_RESULT_URL

   // For EcoCash:
   const payment = paynow.createPayment(orderRef, phone)
   payment.add('Order ' + orderRef, amount)
   const response = await paynow.sendMobile(payment, phone, 'ecocash')
   // response.success, response.redirectUrl, response.pollUrl

   // For card / bank:
   const payment = paynow.createPayment(orderRef, 'customer@email.com')
   payment.add('Order ' + orderRef, amount)
   const response = await paynow.send(payment)
   // response.success, response.redirectUrl
   ```

---

## EcoCash mobile money (direct B2C payouts)

Used for driver and merchant payout requests.

**Steps:**
1. Contact Econet Wireless Zimbabwe to get a merchant API account
2. Set environment variables:
   ```
   ECOCASH_MERCHANT_CODE=<your-merchant-code>
   ECOCASH_MERCHANT_PIN=<your-merchant-pin>
   ECOCASH_API_URL=https://api.ecocash.co.zw/v1
   ```
3. In `backend/bridge/payments.js`, replace the `// TODO: EcoCash B2C payout` comment:
   ```javascript
   const res = await fetch(`${process.env.ECOCASH_API_URL}/transactions/initiate`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${process.env.ECOCASH_MERCHANT_PIN}`,
     },
     body: JSON.stringify({
       merchantCode: process.env.ECOCASH_MERCHANT_CODE,
       merchantPin: process.env.ECOCASH_MERCHANT_PIN,
       merchantNumber: process.env.ECOCASH_MERCHANT_CODE,
       transactionOperationType: 'SENDMONEY',
       subscriberMSISDN: account,   // e.g. 0771234567
       amount: amount.toFixed(2),
       currency: 'ZWG',
       clientCorrelator: payoutId,
       narration: 'Spotly Driver Payout',
       references: { merchantReference: payoutId },
     }),
   })
   const data = await res.json()
   // data.transactionOperationStatus === 'COMPLETED'
   ```

---

## InnBucks (alternative payout rail)

**Steps:**
1. Register as a business at https://www.innbucks.com/
2. Set environment variables:
   ```
   INNBUCKS_CLIENT_ID=<your-client-id>
   INNBUCKS_CLIENT_SECRET=<your-client-secret>
   INNBUCKS_API_URL=https://api.innbucks.com/v1
   ```

---

## Stripe (card payments — diaspora / international)

For customers paying with Visa/Mastercard from outside Zimbabwe.

**Steps:**
1. Create an account at https://stripe.com/
2. Set environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Install: `npm install stripe`
4. In `backend/bridge/payments.js`:
   ```javascript
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
   const intent = await stripe.paymentIntents.create({
     amount: Math.round(amount * 100),  // cents
     currency: 'usd',
     metadata: { orderRef },
   })
   // Return intent.client_secret to the client
   ```

---

## Environment variables summary

| Variable | Purpose |
|---|---|
| `PAYNOW_INTEGRATION_ID` | Paynow merchant integration ID |
| `PAYNOW_INTEGRATION_KEY` | Paynow merchant integration key |
| `PAYNOW_RETURN_URL` | URL to redirect after payment |
| `PAYNOW_RESULT_URL` | Webhook URL for Paynow callbacks |
| `ECOCASH_MERCHANT_CODE` | EcoCash B2C merchant code |
| `ECOCASH_MERCHANT_PIN` | EcoCash B2C merchant PIN |
| `ECOCASH_API_URL` | EcoCash API base URL |
| `INNBUCKS_CLIENT_ID` | InnBucks OAuth client ID |
| `INNBUCKS_CLIENT_SECRET` | InnBucks OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (for card payments) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NODE_ENV` | Set to `production` to disable dev auto-confirm |
