#!/usr/bin/env node

/**
 * Stripe Integration Test Runner
 * Comprehensive testing script for all Stripe payment functionality
 */

import { stripeTester } from './stripe-integration-tester.js';
import { webhookSimulator } from './webhook-simulator.js';
import { testCronJobManually, createTestExpiryScenarios, cleanupTestScenarios } from './cron-test.js';
import { User } from '../models/User.js';
import { stripe } from '../utils/stripe.js';

class ComprehensiveTestRunner {
    constructor() {
        this.testResults = [];
        this.testData = {
            users: [],
            customers: [],
            payments: []
        };
    }

    // Log test progress
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Execute test with error handling
    async executeTest(testName, testFunction) {
        this.log(`Starting ${testName}...`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'PASS',
                duration,
                result
            });
            
            this.log(`${testName} completed in ${duration}ms`, 'success');
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                duration,
                error: error.message
            });
            
            this.log(`${testName} failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Test 1: Environment Setup Verification
    async testEnvironmentSetup() {
        this.log('Verifying environment configuration...');
        
        const requiredEnvVars = [
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'CLIENT_URL',
            'MONGO_URI'
        ];
        
        const missing = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
        
        // Test Stripe connection
        try {
            await stripe.accounts.retrieve();
            this.log('Stripe connection verified', 'success');
        } catch (error) {
            throw new Error(`Stripe connection failed: ${error.message}`);
        }\n        \n        return { success: true, message: 'Environment setup verified' };\n    }\n\n    // Test 2: Database Connection\n    async testDatabaseConnection() {\n        this.log('Testing database connection...');\n        \n        try {\n            // Try to count users to test DB connection\n            const userCount = await User.countDocuments();\n            this.log(`Database connected. Found ${userCount} users.`, 'success');\n            return { success: true, userCount };\n        } catch (error) {\n            throw new Error(`Database connection failed: ${error.message}`);\n        }\n    }\n\n    // Test 3: Subscription Creation Flow\n    async testSubscriptionFlow() {\n        this.log('Testing complete subscription flow...');\n        return await stripeTester.testSubscriptionCreation();\n    }\n\n    // Test 4: Payment Processing\n    async testPaymentProcessing() {\n        this.log('Testing payment processing...');\n        return await stripeTester.testPaymentSuccess();\n    }\n\n    // Test 5: Payment Failure Handling\n    async testPaymentFailures() {\n        this.log('Testing payment failure scenarios...');\n        return await stripeTester.testPaymentFailure();\n    }\n\n    // Test 6: Subscription Cancellation\n    async testCancellationFlow() {\n        this.log('Testing subscription cancellation...');\n        return await stripeTester.testSubscriptionCancellation();\n    }\n\n    // Test 7: Webhook Event Simulation\n    async testWebhookEvents() {\n        this.log('Testing webhook event handling...');\n        \n        // Create test user and customer for webhook testing\n        const testUser = new User({\n            email: 'webhook-test@example.com',\n            password: 'hashedpassword123',\n            name: 'Webhook Test User',\n            is_active: false\n        });\n        await testUser.save();\n        this.testData.users.push(testUser._id);\n        \n        const customer = await stripe.customers.create({\n            email: 'webhook-test@example.com',\n            metadata: { userId: testUser._id.toString() }\n        });\n        this.testData.customers.push(customer.id);\n        \n        // Update user with customer ID\n        testUser.stripeCustomerId = customer.id;\n        await testUser.save();\n        \n        // Run webhook sequence\n        const result = await webhookSimulator.runWebhookSequence(testUser._id, customer.id);\n        return result;\n    }\n\n    // Test 8: Cron Job Functionality\n    async testCronJobFunctionality() {\n        this.log('Testing cron job functionality...');\n        \n        // Create test scenarios\n        const scenarioResult = await createTestExpiryScenarios();\n        if (!scenarioResult.success) {\n            throw new Error('Failed to create test scenarios');\n        }\n        \n        // Test cron job logic\n        const cronResult = await testCronJobManually();\n        \n        // Cleanup test scenarios\n        await cleanupTestScenarios(scenarioResult.testUsers, scenarioResult.testPayments);\n        \n        return cronResult;\n    }\n\n    // Test 9: Auto-renewal Simulation\n    async testAutoRenewal() {\n        this.log('Testing auto-renewal functionality...');\n        return await stripeTester.testAutoRenewal();\n    }\n\n    // Test 10: Data Consistency Verification\n    async testDataConsistency() {\n        this.log('Verifying data consistency...');\n        \n        // Check for orphaned records\n        const usersWithoutCustomers = await User.find({ \n            stripeCustomerId: { $exists: false },\n            is_active: true \n        });\n        \n        const inconsistencies = [];\n        \n        if (usersWithoutCustomers.length > 0) {\n            inconsistencies.push(`${usersWithoutCustomers.length} active users without Stripe customer IDs`);\n        }\n        \n        return {\n            success: inconsistencies.length === 0,\n            inconsistencies,\n            message: inconsistencies.length === 0 ? 'Data consistency verified' : 'Data inconsistencies found'\n        };\n    }\n\n    // Run all tests\n    async runCompleteTestSuite() {\n        console.log('\\n🚀 STARTING COMPREHENSIVE STRIPE INTEGRATION TEST SUITE');\n        console.log('='.repeat(60));\n        \n        const tests = [\n            { name: 'Environment Setup', fn: () => this.testEnvironmentSetup() },\n            { name: 'Database Connection', fn: () => this.testDatabaseConnection() },\n            { name: 'Subscription Flow', fn: () => this.testSubscriptionFlow() },\n            { name: 'Payment Processing', fn: () => this.testPaymentProcessing() },\n            { name: 'Payment Failures', fn: () => this.testPaymentFailures() },\n            { name: 'Cancellation Flow', fn: () => this.testCancellationFlow() },\n            { name: 'Webhook Events', fn: () => this.testWebhookEvents() },\n            { name: 'Cron Job Functionality', fn: () => this.testCronJobFunctionality() },\n            { name: 'Auto-renewal', fn: () => this.testAutoRenewal() },\n            { name: 'Data Consistency', fn: () => this.testDataConsistency() }\n        ];\n        \n        for (const test of tests) {\n            await this.executeTest(test.name, test.fn);\n            console.log(''); // Add spacing between tests\n        }\n        \n        // Generate final report\n        await this.generateFinalReport();\n        \n        // Cleanup\n        await this.cleanup();\n        \n        return this.testResults;\n    }\n\n    // Generate comprehensive test report\n    async generateFinalReport() {\n        console.log('\\n📊 COMPREHENSIVE TEST REPORT');\n        console.log('='.repeat(50));\n        \n        const summary = {\n            total: this.testResults.length,\n            passed: this.testResults.filter(r => r.status === 'PASS').length,\n            failed: this.testResults.filter(r => r.status === 'FAIL').length,\n            totalDuration: this.testResults.reduce((sum, r) => sum + r.duration, 0)\n        };\n        \n        console.log(`Total Tests: ${summary.total}`);\n        console.log(`Passed: ${summary.passed}`);\n        console.log(`Failed: ${summary.failed}`);\n        console.log(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);\n        console.log(`Total Duration: ${summary.totalDuration}ms`);\n        \n        console.log('\\n📋 Test Details:');\n        this.testResults.forEach(result => {\n            const status = result.status === 'PASS' ? '✅' : '❌';\n            const duration = `${result.duration}ms`;\n            console.log(`${status} ${result.name.padEnd(25)} ${duration.padStart(10)}`);\n            if (result.error) {\n                console.log(`     Error: ${result.error}`);\n            }\n        });\n        \n        // Webhook simulation report\n        const webhookReport = webhookSimulator.getSimulationReport();\n        if (webhookReport.summary.totalEvents > 0) {\n            console.log('\\n🎯 Webhook Simulation Summary:');\n            console.log(`Events Simulated: ${webhookReport.summary.totalEvents}`);\n            console.log(`Successful: ${webhookReport.summary.successfulEvents}`);\n            console.log(`Failed: ${webhookReport.summary.failedEvents}`);\n            console.log(`Event Types: ${webhookReport.summary.eventTypes.join(', ')}`);\n        }\n        \n        // Recommendations\n        console.log('\\n💡 Recommendations:');\n        if (summary.failed > 0) {\n            console.log('❌ Some tests failed. Review the errors above and fix the issues.');\n        } else {\n            console.log('✅ All tests passed! Your Stripe integration is working correctly.');\n        }\n        \n        console.log('📝 Next steps:');\n        console.log('   1. Test with real Stripe webhooks using Stripe CLI');\n        console.log('   2. Verify webhook endpoint is accessible from Stripe');\n        console.log('   3. Test with actual subscription flows in staging environment');\n        console.log('   4. Monitor webhook events in production');\n        \n        return summary;\n    }\n\n    // Cleanup test data\n    async cleanup() {\n        this.log('Cleaning up test data...');\n        \n        try {\n            // Cleanup database test data\n            if (this.testData.users.length > 0) {\n                await User.deleteMany({ _id: { $in: this.testData.users } });\n                this.log(`Deleted ${this.testData.users.length} test users`);\n            }\n            \n            // Cleanup Stripe test data\n            for (const customerId of this.testData.customers) {\n                try {\n                    await stripe.customers.del(customerId);\n                } catch (error) {\n                    this.log(`Failed to delete customer ${customerId}: ${error.message}`, 'warning');\n                }\n            }\n            \n            // Cleanup via other test utilities\n            await stripeTester.cleanup();\n            await cleanupTestScenarios();\n            \n            this.log('Cleanup completed', 'success');\n        } catch (error) {\n            this.log(`Cleanup failed: ${error.message}`, 'error');\n        }\n    }\n}\n\n// Export for use\nexport const comprehensiveTestRunner = new ComprehensiveTestRunner();\n\n// If running directly\nif (import.meta.url === `file://${process.argv[1]}`) {\n    import('../db/connectDB.js').then(({ connectDB }) => {\n        connectDB().then(() => {\n            comprehensiveTestRunner.runCompleteTestSuite()\n                .then((results) => {\n                    console.log('\\n🎉 Test suite completed!');\n                    process.exit(0);\n                })\n                .catch((error) => {\n                    console.error('❌ Test suite failed:', error);\n                    process.exit(1);\n                });\n        });\n    });\n}