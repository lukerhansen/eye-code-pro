# Stripe Setup Guide

## Creating Products and Prices

To set up pricing for CodeSelect©, you need to create a product and price in your Stripe dashboard:

### 1. Create a Product

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Enter the following details:
   - **Name**: Can be "Base", "Per Doctor", or any name containing "doctor"
   - **Description**: "Per doctor monthly subscription for CodeSelect"
   - **Pricing model**: Recurring
   - **Price**: $99.00 per month (or your desired price)

### 2. Important Notes

- The system will look for products in this order:
  1. A product named exactly "Base"
  2. Any product with "doctor" in the name
  3. The first available product

- Make sure the product is **Active**
- Make sure the price is **Active**
- The price should be set to **Recurring** (monthly)

### 3. Troubleshooting

If pricing isn't showing correctly:

1. Check the console logs in development mode - they will show all products and prices found
2. Ensure your Stripe API keys are correctly set in your environment variables
3. Verify the product and price are both active in Stripe
4. Try refreshing the pricing page after making changes in Stripe

### 4. Environment Variables

Make sure you have these set:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```