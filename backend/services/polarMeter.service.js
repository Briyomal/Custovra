import { polar } from "../utils/polarClient.js";
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";
import { MeterEvent } from "../models/MeterEvent.js";
import { Form } from "../models/Form.js";

// Polar meter IDs from product configuration
const METERS = {
    FORMS: '85271b84-0a60-4a29-bdd4-9d1116158421',        // Forms (Outlets/Branches)
    SUBMISSIONS: '597af079-bc2e-469a-a946-b662e3520bc9'  // Submissions (Reviews)
};

/**
 * Get customer's Polar customer ID
 */
const getPolarCustomerId = async (userId) => {
    const subscription = await Subscription.findOne({
        user_id: userId,
        external_provider: 'polar',
        customer_id: { $exists: true, $ne: null }
    }).sort({ created_at: -1 });

    if (!subscription?.customer_id) {
        throw new Error(`No Polar customer ID found for user ${userId}`);
    }

    return subscription.customer_id;
};

/**
 * Report usage to a specific Polar meter
 * @param {String} meterId - The Polar meter ID
 * @param {String} userId - User's MongoDB ID
 * @param {String} eventName - Event name for audit trail
 * @param {Number} increment - Usage amount to report (default 1)
 * @param {Object} metadata - Additional event data for audit
 */
export const reportMeterUsage = async (meterId, userId, eventName, increment = 1, metadata = {}) => {
    try {
        // Create audit record
        const meterEvent = await MeterEvent.create({
            user_id: userId,
            event_name: eventName,
            meter_type: eventName.includes('form') ? 'forms' : 'submissions',
            quantity: increment,
            metadata: {
                ...metadata,
                meterId
            },
            ingestion_status: 'pending'
        });

        try {
            // Get user and subscription info
            const user = await User.findById(userId);
            const subscription = await Subscription.findOne({
                user_id: userId,
                status: { $in: ['active', 'trialing'] }
            });

            if (!subscription) {
                throw new Error(`No active subscription found for user ${userId}`);
            }

            // Use externalCustomerId (MongoDB user ID) instead of Polar customer ID
            const externalCustomerId = userId.toString();

            console.log(`📊 Reporting ${increment} unit(s) to meter ${meterId} for external customer ${externalCustomerId}`);

            // Report usage to Polar using events API with externalCustomerId
            // Polar will automatically map this event to the meter based on configuration
            const response = await polar.events.ingest({
                events: [{
                    name: eventName,
                    externalCustomerId: externalCustomerId,
                    metadata: {
                        userId: userId.toString(),
                        userEmail: user.email,
                        meterId: meterId,
                        increment: increment,
                        ...metadata
                    }
                }]
            });

            // Update audit record
            meterEvent.ingestion_status = 'sent';
            meterEvent.polar_event_id = `${eventName}_${Date.now()}`;
            meterEvent.sent_at = new Date();
            await meterEvent.save();

            console.log(`✅ Meter usage reported: ${eventName} - ${increment} unit(s) (inserted: ${response.inserted || 0}, duplicates: ${response.duplicates || 0})`);
            return { success: true, event: meterEvent, response };

        } catch (polarError) {
            // Update audit record with error
            meterEvent.ingestion_status = 'failed';
            meterEvent.error_message = polarError.message || JSON.stringify(polarError);
            await meterEvent.save();

            console.error(`❌ Failed to report meter usage:`, polarError);
            throw polarError;
        }

    } catch (error) {
        console.error(`Error reporting meter usage:`, error);
        throw error;
    }
};

/**
 * Report form creation to Polar meter
 * Now reports ALL forms (not just overage) - Polar will handle the included benefits
 */
export const reportFormCreation = async (userId, formId) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing'] }
        });

        if (!subscription) {
            console.log(`No active subscription for user ${userId}, skipping meter report`);
            return { success: false, reason: 'no_active_subscription' };
        }

        // Count active forms (including the one just created)
        const formCount = await Form.countDocuments({
            user_id: userId,
            is_active: true
        });

        // Report to Polar Forms meter - Polar will automatically handle included benefits
        const result = await reportMeterUsage(
            METERS.FORMS,
            userId,
            'form_created',
            1, // Increment by 1
            {
                formId: formId.toString(),
                formCount,
                timestamp: new Date().toISOString()
            }
        );

        // Update subscription tracking
        subscription.meter_usage_current_cycle.forms_overage = Math.max(0, formCount - 1);
        subscription.meter_usage_current_cycle.last_reset_date = subscription.meter_usage_current_cycle.last_reset_date || new Date();
        await subscription.save();

        return { success: true, formCount, reported: true };

    } catch (error) {
        console.error(`Error reporting form creation:`, error);
        // Don't throw - we don't want to fail form creation if meter reporting fails
        return { success: false, reason: 'error', error: error.message };
    }
};

/**
 * Report submission creation to Polar meter
 * Reports ALL submissions - Polar will handle the included benefits
 */
export const reportSubmissionCreation = async (userId, submissionId, formId) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing'] }
        });

        if (!subscription) {
            console.log(`No active subscription for user ${userId}, skipping submission meter report`);
            return { success: false, reason: 'no_active_subscription' };
        }

        // Report to Polar Submissions meter - Polar will automatically handle included benefits
        const result = await reportMeterUsage(
            METERS.SUBMISSIONS,
            userId,
            'submission_created',
            1, // Increment by 1 per submission
            {
                submissionId: submissionId.toString(),
                formId: formId.toString(),
                timestamp: new Date().toISOString()
            }
        );

        return { success: true, reported: true };

    } catch (error) {
        console.error(`Error reporting submission creation:`, error);
        // Don't throw - we don't want to fail submission if meter reporting fails
        return { success: false, reason: 'error', error: error.message };
    }
};

/**
 * Reset meter usage on plan change
 */
export const resetMeterUsage = async (userId) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing'] }
        });

        if (!subscription) {
            console.log(`No active subscription found for user ${userId}`);
            return;
        }

        subscription.meter_usage_current_cycle = {
            forms_overage: 0,
            submissions_used: 0,
            last_reset_date: new Date()
        };

        await subscription.save();
        console.log(`✅ Meter usage reset for user ${userId}`);

    } catch (error) {
        console.error(`Error resetting meter usage:`, error);
        throw error;
    }
};

/**
 * Fetch meter usage from Polar API using Customer State endpoint
 * This is the source of truth for billing - what customer sees in Polar portal
 * API: GET /v1/customers/external/{external_id}/state
 */
export const fetchMeterUsageFromPolar = async (userId) => {
    try {
        // Find active subscription (Polar is the only provider now)
        const subscription = await Subscription.findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing'] }
        });

        if (!subscription) {
            console.log(`No active subscription for user ${userId}`);
            return null;
        }

        const externalCustomerId = userId.toString();
        console.log(`📊 Fetching customer state from Polar for external customer ${externalCustomerId}`);

        // Fetch customer state which includes all active meters with current balance
        // Using raw fetch since SDK method might not be available
        const polarEnv = process.env.POLAR_ENV || 'sandbox';
        const baseUrl = polarEnv === 'production' ? 'https://api.polar.sh' : 'https://sandbox-api.polar.sh';
        const url = `${baseUrl}/v1/customers/external/${encodeURIComponent(externalCustomerId)}/state`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Polar API error: ${response.status} ${response.statusText} - ${await response.text()}`);
        }

        const customerState = await response.json();

        if (!customerState || !customerState.active_subscriptions || customerState.active_subscriptions.length === 0) {
            console.log(`No active subscriptions found in customer state`);
            return null;
        }

        // Get the first active subscription for period dates
        const activeSubscription = customerState.active_subscriptions[0];

        // IMPORTANT: Meters are at CUSTOMER level (active_meters), NOT inside subscription
        const meters = customerState.active_meters;

        if (!meters || meters.length === 0) {
            console.log(`No active_meters found in customer state`);
            return null;
        }

        console.log(`✅ Found ${meters.length} active meters at customer level`);

        // Extract meter data from customer's active_meters
        // Each meter has: meter_id, consumed_units, credited_units, balance
        // consumed_units = actual usage
        // credited_units = included in plan (credits)
        // balance = credited - consumed (positive = remaining, negative = overage)

        // Find meters by known IDs
        let formsMeter = meters.find(m => m.meter_id === METERS.FORMS);
        let submissionsMeter = meters.find(m => m.meter_id === METERS.SUBMISSIONS);

        if (formsMeter) {
            console.log(`✅ Forms meter found: consumed=${formsMeter.consumed_units}, credited=${formsMeter.credited_units}, balance=${formsMeter.balance}`);
        } else {
            console.log(`⚠️ Forms meter not found with ID ${METERS.FORMS}`);
        }

        if (submissionsMeter) {
            console.log(`✅ Submissions meter found: consumed=${submissionsMeter.consumed_units}, credited=${submissionsMeter.credited_units}, balance=${submissionsMeter.balance}`);
        } else {
            console.log(`⚠️ Submissions meter not found with ID ${METERS.SUBMISSIONS}`);
        }

        const formsCurrent = formsMeter?.consumed_units || 0;
        const formsIncluded = formsMeter?.credited_units || 0;
        // Overage = consumed - credited (when negative balance, or when consumed > credited)
        const formsOverage = Math.max(0, formsCurrent - formsIncluded);

        const submissionsCurrent = submissionsMeter?.consumed_units || 0;
        const submissionsIncluded = submissionsMeter?.credited_units || 0;
        const submissionsOverage = Math.max(0, submissionsCurrent - submissionsIncluded);

        // Fetch product details to get meter pricing
        const productId = activeSubscription.product_id;
        let formsPricePerUnit = null;
        let submissionsPricePerUnit = null;

        if (productId) {
            try {
                const productUrl = `${baseUrl}/v1/products/${productId}`;
                const productResponse = await fetch(productUrl, {
                    headers: {
                        'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (productResponse.ok) {
                    const product = await productResponse.json();

                    // Find the metered prices for each meter
                    if (product.prices && Array.isArray(product.prices)) {
                        // Find prices that match our meters
                        const formsPrices = product.prices.filter(p =>
                            p.amount_type === 'metered_unit' &&
                            p.meter_id === (formsMeter?.meter_id || METERS.FORMS)
                        );
                        const submissionsPrices = product.prices.filter(p =>
                            p.amount_type === 'metered_unit' &&
                            p.meter_id === (submissionsMeter?.meter_id || METERS.SUBMISSIONS)
                        );

                        // Extract price per unit (unit_amount is in cents as string)
                        if (formsPrices.length > 0 && formsPrices[0].unit_amount) {
                            formsPricePerUnit = parseFloat(formsPrices[0].unit_amount) / 100; // Convert cents to dollars
                        }
                        if (submissionsPrices.length > 0 && submissionsPrices[0].unit_amount) {
                            submissionsPricePerUnit = parseFloat(submissionsPrices[0].unit_amount) / 100; // Convert cents to dollars
                        }

                        console.log(`💰 Fetched pricing: Forms=$${formsPricePerUnit}/unit, Submissions=$${submissionsPricePerUnit}/unit`);
                    }
                }
            } catch (pricingError) {
                console.error(`⚠️ Could not fetch product pricing:`, pricingError.message);
                // Continue without pricing info
            }
        }

        const meterData = {
            forms: {
                current: formsCurrent,
                included: formsIncluded,
                overage: Math.max(0, formsOverage),
                pricePerUnit: formsPricePerUnit // Price per unit in dollars
            },
            submissions: {
                current: submissionsCurrent,
                included: submissionsIncluded,
                overage: Math.max(0, submissionsOverage),
                pricePerUnit: submissionsPricePerUnit // Price per unit in dollars
            },
            periodStart: activeSubscription.current_period_start || null,
            periodEnd: activeSubscription.current_period_end || null
        };

        console.log(`✅ Fetched meter usage from Polar:`, JSON.stringify(meterData, null, 2));
        return meterData;

    } catch (error) {
        console.error(`❌ Error fetching meter usage from Polar:`, error.message || error);
        if (error.statusCode) {
            console.error(`HTTP Status: ${error.statusCode}`);
        }
        // Return null so we can fallback to database counts
        return null;
    }
};
