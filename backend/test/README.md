# Stripe Integration Testing Guide

This directory contains comprehensive testing utilities for verifying Stripe payment functionality and auto-renewal systems.

## 🧪 Test Components

### 1. **Stripe Test Utils** (`stripe-test-utils.js`)
- Basic utility functions for Stripe operations
- Test customer and subscription creation
- Payment simulation helpers
- Data verification functions

### 2. **Integration Tester** (`stripe-integration-tester.js`)
- Full integration test scenarios
- Tests subscription creation, payment processing, failures, and cancellations
- Comprehensive test reporting

### 3. **Webhook Simulator** (`webhook-simulator.js`)
- Simulates all Stripe webhook events
- Tests webhook event handling without external dependencies
- Sequence testing for complete subscription lifecycle

### 4. **Cron Job Tester** (`cron-test.js`)
- Tests daily subscription expiry cleanup
- Creates test scenarios for expired subscriptions
- Validates cron job logic

### 5. **Comprehensive Test Runner** (`comprehensive-test-runner.js`)
- Runs all tests in sequence
- Provides detailed reporting
- Handles cleanup automatically

## 🚀 Quick Start

### Method 1: Use API Endpoints (Recommended)

Start your backend server and use these endpoints:

```bash
# Run all tests
GET http://localhost:5000/api/test/stripe/all

# Run individual tests
GET http://localhost:5000/api/test/stripe/subscription-creation
GET http://localhost:5000/api/test/stripe/payment-success
GET http://localhost:5000/api/test/stripe/payment-failure
GET http://localhost:5000/api/test/stripe/cancellation
GET http://localhost:5000/api/test/stripe/auto-renewal

# Test cron job functionality
GET http://localhost:5000/api/test/cron/test-manually
POST http://localhost:5000/api/test/cron/create-test-scenarios

# Simulate webhook events
POST http://localhost:5000/api/test/webhook/simulate-sequence
{
  "testUserId": "user_id_here",
  "customerId": "cus_stripe_customer_id"
}

# Cleanup test data
DELETE http://localhost:5000/api/test/stripe/cleanup
```

### Method 2: Direct Script Execution

```bash
cd backend
node test/comprehensive-test-runner.js
```

## 📋 Test Scenarios Covered

### ✅ Subscription Creation Flow
- Tests checkout session creation
- Verifies user activation
- Checks subscription plan assignment
- Validates database updates

### ✅ Payment Success Flow
- Tests `invoice.payment_succeeded` webhook
- Verifies payment record creation
- Checks subscription renewal
- Validates expiry date updates

### ✅ Payment Failure Flow
- Tests `invoice.payment_failed` webhook
- Verifies user deactivation
- Checks subscription status updates
- Tests retry logic

### ✅ Subscription Cancellation
- Tests `customer.subscription.deleted` webhook
- Verifies user deactivation
- Checks status updates
- Validates access revocation

### ✅ Auto-Renewal Testing
- Tests automatic subscription renewal
- Verifies expiry date extension
- Checks payment record updates
- Validates user status maintenance

### ✅ Cron Job Functionality
- Tests daily expiry cleanup
- Verifies expired user deactivation
- Checks subscription status updates
- Validates cleanup logic

### ✅ Data Consistency
- Checks for orphaned records
- Verifies data integrity
- Tests relationship consistency
- Validates status synchronization

## 🔧 Environment Setup

Ensure these environment variables are set:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/your-db
```

## 📊 Test Reports

### Console Output Example:
```
🚀 STARTING COMPREHENSIVE STRIPE INTEGRATION TESTS

📋 [2024-01-01T12:00:00.000Z] Starting Environment Setup...
✅ [2024-01-01T12:00:00.100Z] Environment Setup completed in 100ms

📋 [2024-01-01T12:00:00.200Z] Starting Subscription Flow...
✅ [2024-01-01T12:00:01.200Z] Subscription Flow completed in 1000ms

📊 COMPREHENSIVE TEST REPORT
==================================================
Total Tests: 10
Passed: 10
Failed: 0
Success Rate: 100.0%
Total Duration: 5000ms

📋 Test Details:
✅ Environment Setup          100ms
✅ Database Connection        200ms
✅ Subscription Flow         1000ms
✅ Payment Processing         800ms
✅ Payment Failures           600ms
✅ Cancellation Flow          500ms
✅ Webhook Events            1200ms
✅ Cron Job Functionality     400ms
✅ Auto-renewal               300ms
✅ Data Consistency          100ms
```

## 🎯 Webhook Testing

### Individual Webhook Event Testing:
```bash
# Test specific webhook events
POST http://localhost:5000/api/test/webhook/simulate/checkout-completed
POST http://localhost:5000/api/test/webhook/simulate/payment-succeeded
POST http://localhost:5000/api/test/webhook/simulate/payment-failed
POST http://localhost:5000/api/test/webhook/simulate/subscription-updated
POST http://localhost:5000/api/test/webhook/simulate/subscription-deleted

# Request body for all webhook simulations:
{
  "testUserId": "64abc123def456789",
  "customerId": "cus_test_123",
  "subscriptionId": "sub_test_123"
}
```

## 🔍 Real Webhook Testing with Stripe CLI

### Setup Stripe CLI:
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:5000/api/payments/webhook

# This will give you a webhook secret like: whsec_1234...
# Add it to your .env file as STRIPE_WEBHOOK_SECRET
```

### Test Real Webhooks:
```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## 🧹 Cleanup

### Automatic Cleanup:
Most test methods include automatic cleanup. If manual cleanup is needed:

```bash
DELETE http://localhost:5000/api/test/stripe/cleanup
DELETE http://localhost:5000/api/test/cron/cleanup-scenarios
```

### Manual Database Cleanup:
```javascript
// In MongoDB shell or compass
db.users.deleteMany({ email: { $regex: /-test@example\.com$/ } });
db.payments.deleteMany({ subscription_id: { $regex: /test/ } });
```

## 🚨 Troubleshooting

### Common Issues:

1. **Stripe API Key Issues:**
   - Verify `STRIPE_SECRET_KEY` is set and valid
   - Check if using test or live keys consistently

2. **Webhook Secret Issues:**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches your endpoint
   - Verify webhook signature validation

3. **Database Connection:**
   - Check MongoDB is running
   - Verify `MONGO_URI` is correct

4. **Test Data Conflicts:**
   - Run cleanup before testing
   - Use unique test emails/IDs

### Debug Mode:
Set `NODE_ENV=development` for detailed logging.

## 📈 Success Criteria

All tests should pass with these results:
- ✅ Environment properly configured
- ✅ Database connected and accessible
- ✅ Stripe API calls successful
- ✅ Webhook events properly handled
- ✅ User status updates correctly
- ✅ Payment records created/updated
- ✅ Subscription expiry handling works
- ✅ Cron job logic functions correctly
- ✅ Auto-renewal processes payments
- ✅ Data consistency maintained

## 📞 Support

If tests fail or you encounter issues:
1. Check the detailed error messages in test output
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check Stripe dashboard for webhook delivery status
5. Review server logs for additional error details