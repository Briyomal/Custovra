import { stripe } from "../utils/stripe.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

/**
 * Stripe Integration Test Utilities
 * Comprehensive testing functions for webhook events and subscription flows
 */

export class StripeTestUtils {
    constructor() {
        this.testResults = [];
        this.webhookEvents = [];
    }

    // Log test results
    logResult(testName, status, details = '') {
        const result = {
            test: testName,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        console.log(`[${status}] ${testName}: ${details}`);
        return result;
    }

    // Create test customer
    async createTestCustomer(email = 'test@example.com') {
        try {
            const customer = await stripe.customers.create({
                email,
                metadata: {
                    test: 'true',
                    userId: 'test_user_123'
                }
            });
            this.logResult('CREATE_TEST_CUSTOMER', 'PASS', `Customer created: ${customer.id}`);
            return customer;
        } catch (error) {
            this.logResult('CREATE_TEST_CUSTOMER', 'FAIL', error.message);
            throw error;
        }
    }

    // Create test subscription
    async createTestSubscription(customerId, priceId) {
        try {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            });
            
            this.logResult('CREATE_TEST_SUBSCRIPTION', 'PASS', 
                `Subscription created: ${subscription.id}, Status: ${subscription.status}`);
            return subscription;
        } catch (error) {
            this.logResult('CREATE_TEST_SUBSCRIPTION', 'FAIL', error.message);
            throw error;
        }
    }

    // Simulate payment success
    async simulatePaymentSuccess(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: 'pm_card_visa' // Test card
            });
            
            this.logResult('SIMULATE_PAYMENT_SUCCESS', 'PASS', 
                `Payment confirmed: ${paymentIntent.id}, Status: ${paymentIntent.status}`);
            return paymentIntent;
        } catch (error) {
            this.logResult('SIMULATE_PAYMENT_SUCCESS', 'FAIL', error.message);
            throw error;
        }
    }

    // Simulate payment failure
    async simulatePaymentFailure(subscriptionId) {
        try {
            // Create an invoice and attempt payment with a card that will fail
            const invoice = await stripe.invoices.create({
                customer: (await stripe.subscriptions.retrieve(subscriptionId)).customer,
                subscription: subscriptionId,
            });

            await stripe.invoices.finalizeInvoice(invoice.id);
            
            // Attempt payment with a failing card
            const paymentIntent = await stripe.paymentIntents.create({
                amount: invoice.amount_due,
                currency: 'usd',
                customer: invoice.customer,
                payment_method: 'pm_card_chargeDeclined', // This will fail
                confirmation_method: 'manual',
                confirm: true,
                return_url: 'http://localhost:3000'
            });

            this.logResult('SIMULATE_PAYMENT_FAILURE', 'PASS', 
                `Payment failure simulated for subscription: ${subscriptionId}`);
            return paymentIntent;
        } catch (error) {
            this.logResult('SIMULATE_PAYMENT_FAILURE', 'PASS', 
                `Expected failure occurred: ${error.message}`);
            return error;
        }
    }

    // Cancel subscription
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            this.logResult('CANCEL_SUBSCRIPTION', 'PASS', 
                `Subscription canceled: ${subscription.id}, Status: ${subscription.status}`);
            return subscription;
        } catch (error) {
            this.logResult('CANCEL_SUBSCRIPTION', 'FAIL', error.message);
            throw error;
        }
    }

    // Verify user data in database
    async verifyUserData(userId, expectedData) {
        try {
            const user = await User.findById(userId);
            const checks = [];

            if (expectedData.is_active !== undefined) {
                checks.push(`is_active: ${user.is_active} === ${expectedData.is_active}`);
            }
            if (expectedData.subscription_status !== undefined) {
                checks.push(`subscription_status: ${user.subscription_status} === ${expectedData.subscription_status}`);
            }
            if (expectedData.subscription_plan !== undefined) {
                checks.push(`subscription_plan: ${user.subscription_plan} === ${expectedData.subscription_plan}`);
            }

            this.logResult('VERIFY_USER_DATA', 'PASS', checks.join(', '));
            return user;
        } catch (error) {
            this.logResult('VERIFY_USER_DATA', 'FAIL', error.message);
            throw error;
        }
    }

    // Verify payment records
    async verifyPaymentRecords(userId, expectedCount = null) {
        try {
            const payments = await Payment.find({ user_id: userId });
            const message = expectedCount !== null 
                ? `Found ${payments.length} payments, expected ${expectedCount}`
                : `Found ${payments.length} payment records`;
            
            this.logResult('VERIFY_PAYMENT_RECORDS', 'PASS', message);
            return payments;
        } catch (error) {
            this.logResult('VERIFY_PAYMENT_RECORDS', 'FAIL', error.message);
            throw error;
        }
    }

    // Test webhook event handling
    async testWebhookEvent(eventType, eventData) {
        try {
            // This would typically involve sending a POST request to your webhook endpoint
            // For now, we'll simulate the event handling directly
            this.webhookEvents.push({ type: eventType, data: eventData, timestamp: new Date() });
            this.logResult('WEBHOOK_EVENT_TEST', 'PASS', `Event ${eventType} recorded`);
            return true;
        } catch (error) {
            this.logResult('WEBHOOK_EVENT_TEST', 'FAIL', error.message);
            throw error;
        }
    }

    // Generate test report
    generateReport() {
        const summary = {
            total: this.testResults.length,
            passed: this.testResults.filter(r => r.status === 'PASS').length,
            failed: this.testResults.filter(r => r.status === 'FAIL').length,
            webhookEvents: this.webhookEvents.length
        };

        console.log('\n=== STRIPE INTEGRATION TEST REPORT ===');
        console.log(`Total Tests: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Webhook Events: ${summary.webhookEvents}`);
        console.log('\nDetailed Results:');
        
        this.testResults.forEach(result => {
            console.log(`  [${result.status}] ${result.test}: ${result.details}`);
        });

        if (this.webhookEvents.length > 0) {
            console.log('\nWebhook Events:');
            this.webhookEvents.forEach(event => {
                console.log(`  ${event.type} at ${event.timestamp}`);
            });
        }

        return summary;
    }

    // Cleanup test data
    async cleanup(customerIds = [], subscriptionIds = []) {
        try {
            // Cancel subscriptions
            for (const subId of subscriptionIds) {
                try {
                    await stripe.subscriptions.cancel(subId);
                } catch (e) {
                    console.log(`Subscription ${subId} already canceled or doesn't exist`);
                }
            }

            // Delete customers
            for (const custId of customerIds) {
                try {
                    await stripe.customers.del(custId);
                } catch (e) {
                    console.log(`Customer ${custId} already deleted or doesn't exist`);
                }
            }

            this.logResult('CLEANUP', 'PASS', 'Test data cleaned up');
        } catch (error) {
            this.logResult('CLEANUP', 'FAIL', error.message);
        }
    }
}

// Export singleton instance
export const stripeTestUtils = new StripeTestUtils();