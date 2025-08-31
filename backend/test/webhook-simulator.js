import { stripe } from "../utils/stripe.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

/**
 * Webhook Event Simulator
 * Simulates different Stripe webhook events for testing
 */

export class WebhookSimulator {
    constructor() {
        this.simulatedEvents = [];
    }

    // Simulate checkout.session.completed event
    async simulateCheckoutCompleted(testUserId, customerId, subscriptionId) {
        console.log('\n🎯 SIMULATING: checkout.session.completed');
        
        const eventData = {
            id: 'cs_test_' + Date.now(),
            object: 'checkout.session',
            customer: customerId,
            subscription: subscriptionId,
            metadata: {
                userId: testUserId.toString(),
                planName: 'basic'
            },
            amount_total: 999,
            currency: 'usd',
            payment_status: 'paid'
        };

        try {
            // Import and call the handler directly
            const { handleSubscriptionCompleted } = await import('../controllers/payment.controller.js');
            await handleSubscriptionCompleted(eventData);

            this.simulatedEvents.push({
                type: 'checkout.session.completed',
                status: 'success',
                data: eventData,
                timestamp: new Date()
            });

            console.log('✅ checkout.session.completed simulated successfully');
            return { success: true, eventData };
        } catch (error) {
            console.error('❌ Failed to simulate checkout.session.completed:', error);
            return { success: false, error: error.message };
        }
    }

    // Simulate invoice.payment_succeeded event
    async simulatePaymentSucceeded(testUserId, customerId, subscriptionId) {
        console.log('\n🎯 SIMULATING: invoice.payment_succeeded');
        
        try {
            // First, create a checkout session with the metadata
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ 
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Test Product' },
                        unit_amount: 999,
                        recurring: { interval: 'month' }
                    },
                    quantity: 1 
                }],
                success_url: 'http://localhost:3000/success',
                cancel_url: 'http://localhost:3000/cancel',
                customer: customerId,
                metadata: {
                    userId: testUserId.toString(),
                    planName: 'basic'
                }
            });

            // Simulate the invoice payment succeeded event data
            const eventData = {
                id: 'in_test_' + Date.now(),
                object: 'invoice',
                customer: customerId,
                subscription: subscriptionId,
                amount_paid: 999,
                created: Math.floor(Date.now() / 1000),
                lines: {
                    data: [{
                        amount_total: 999,
                        period: {
                            end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
                        }
                    }]
                }
            };

            // Manually update the user and payment records (simulating webhook handler)
            const subscriptionExpiry = new Date(eventData.lines.data[0].period.end * 1000);
            
            await User.findByIdAndUpdate(testUserId, {
                is_active: true,
                subscription_plan: subscriptionId,
                subscription_expiry: subscriptionExpiry,
                subscription_status: 'active'
            });

            await Payment.findOneAndUpdate(
                { user_id: testUserId, subscription_id: subscriptionId },
                {
                    plan: 'basic',
                    amount: 9.99,
                    payment_date: new Date(),
                    subscription_expiry: subscriptionExpiry,
                    updated_at: new Date()
                },
                { upsert: true, new: true }
            );

            this.simulatedEvents.push({
                type: 'invoice.payment_succeeded',
                status: 'success',
                data: eventData,
                timestamp: new Date()
            });

            console.log('✅ invoice.payment_succeeded simulated successfully');
            return { success: true, eventData };
        } catch (error) {
            console.error('❌ Failed to simulate invoice.payment_succeeded:', error);
            return { success: false, error: error.message };
        }
    }

    // Simulate invoice.payment_failed event
    async simulatePaymentFailed(testUserId, customerId, subscriptionId) {
        console.log('\n🎯 SIMULATING: invoice.payment_failed');
        
        const eventData = {
            id: 'in_test_failed_' + Date.now(),
            object: 'invoice',
            customer: customerId,
            subscription: subscriptionId,
            attempt_count: 1,
            billing_reason: 'subscription_cycle',
            amount_due: 999
        };

        try {
            // Simulate the payment failed handler logic
            await User.findByIdAndUpdate(testUserId, {
                subscription_status: 'past_due',
                is_active: false
            });

            this.simulatedEvents.push({
                type: 'invoice.payment_failed',
                status: 'success',
                data: eventData,
                timestamp: new Date()
            });

            console.log('✅ invoice.payment_failed simulated successfully');
            return { success: true, eventData };
        } catch (error) {
            console.error('❌ Failed to simulate invoice.payment_failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Simulate customer.subscription.updated event
    async simulateSubscriptionUpdated(testUserId, customerId, subscriptionId) {
        console.log('\n🎯 SIMULATING: customer.subscription.updated');
        
        const eventData = {
            id: subscriptionId,
            object: 'subscription',
            customer: customerId,
            status: 'active',
            current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
            items: {
                data: [{
                    price: {
                        id: 'price_test_123',
                        product: 'prod_RFhrLxBtwAHvvP' // Maps to 'Basic' in productMap
                    }
                }]
            }
        };

        try {
            const endDate = new Date(eventData.current_period_end * 1000);
            
            await User.findByIdAndUpdate(testUserId, {
                subscription_plan: subscriptionId,
                subscription_expiry: endDate,
                subscription_status: eventData.status,
                is_active: eventData.status === 'active'
            });

            await Payment.findOneAndUpdate(
                { user_id: testUserId, subscription_id: subscriptionId },
                {
                    plan: 'Basic',
                    subscription_expiry: endDate,
                    updated_at: new Date()
                },
                { upsert: true }
            );

            this.simulatedEvents.push({
                type: 'customer.subscription.updated',
                status: 'success',
                data: eventData,
                timestamp: new Date()
            });

            console.log('✅ customer.subscription.updated simulated successfully');
            return { success: true, eventData };
        } catch (error) {
            console.error('❌ Failed to simulate customer.subscription.updated:', error);
            return { success: false, error: error.message };
        }
    }

    // Simulate customer.subscription.deleted event
    async simulateSubscriptionDeleted(testUserId, customerId, subscriptionId) {
        console.log('\n🎯 SIMULATING: customer.subscription.deleted');
        
        const eventData = {
            id: subscriptionId,
            object: 'subscription',
            customer: customerId,
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000)
        };

        try {
            await User.findByIdAndUpdate(testUserId, {
                is_active: false,
                subscription_status: 'canceled'
            });

            this.simulatedEvents.push({
                type: 'customer.subscription.deleted',
                status: 'success',
                data: eventData,
                timestamp: new Date()
            });

            console.log('✅ customer.subscription.deleted simulated successfully');
            return { success: true, eventData };
        } catch (error) {
            console.error('❌ Failed to simulate customer.subscription.deleted:', error);
            return { success: false, error: error.message };
        }
    }

    // Run comprehensive webhook simulation
    async runWebhookSequence(testUserId, customerId) {
        console.log('\n🚀 RUNNING COMPREHENSIVE WEBHOOK SEQUENCE');
        console.log('==========================================');
        
        const subscriptionId = 'sub_test_' + Date.now();
        const results = {};

        try {
            // 1. Checkout completed
            results.checkoutCompleted = await this.simulateCheckoutCompleted(testUserId, customerId, subscriptionId);
            await this.delay(1000);

            // 2. Payment succeeded
            results.paymentSucceeded = await this.simulatePaymentSucceeded(testUserId, customerId, subscriptionId);
            await this.delay(1000);

            // 3. Subscription updated
            results.subscriptionUpdated = await this.simulateSubscriptionUpdated(testUserId, customerId, subscriptionId);
            await this.delay(1000);

            // 4. Payment failed
            results.paymentFailed = await this.simulatePaymentFailed(testUserId, customerId, subscriptionId);
            await this.delay(1000);

            // 5. Subscription deleted
            results.subscriptionDeleted = await this.simulateSubscriptionDeleted(testUserId, customerId, subscriptionId);

            console.log('\n📊 WEBHOOK SEQUENCE SUMMARY:');
            Object.entries(results).forEach(([event, result]) => {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${event}: ${result.success ? 'SUCCESS' : result.error}`);
            });

            return {
                success: true,
                results,
                subscriptionId,
                eventsSimulated: this.simulatedEvents.length
            };

        } catch (error) {
            console.error('❌ Webhook sequence failed:', error);
            return {
                success: false,
                error: error.message,
                results
            };
        }
    }

    // Helper method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get simulation report
    getSimulationReport() {
        const summary = {
            totalEvents: this.simulatedEvents.length,
            successfulEvents: this.simulatedEvents.filter(e => e.status === 'success').length,
            failedEvents: this.simulatedEvents.filter(e => e.status === 'failed').length,
            eventTypes: [...new Set(this.simulatedEvents.map(e => e.type))]
        };

        return {
            summary,
            events: this.simulatedEvents
        };
    }

    // Reset simulator
    reset() {
        this.simulatedEvents = [];
        console.log('🔄 Webhook simulator reset');
    }
}

// Export singleton instance
export const webhookSimulator = new WebhookSimulator();