
import genieClient from "../utils/genieClient.js";
import { ManualPlan } from "../models/ManualPlan.js";
import { GeniePayment } from "../models/GeniePayment.js";
import { GenieSubscription } from "../models/GenieSubscription.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { verifyGenieSignature } from "../utils/verifyGenieSignature.js";
import { verifyGenieWebhookSignature } from "../utils/verifyGenieWebhookSignature.js";

const VITE_CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:5173"; // Fallback URL in case environment variable is not set
// Get user's Genie payment history
export const getGeniePaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Get Genie payments for this user
        const geniePayments = await GeniePayment.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20);

        // Format payment history
        const paymentHistory = geniePayments.map(payment => ({
            id: payment._id,
            source: 'genie',
            amount: payment.amount,
            currency: 'lkr',
            status: payment.payment_status,
            date: payment.created_at,
            plan: payment.plan_name,
            description: `${payment.plan_name} (${payment.billing_period})`,
            billing_period: payment.billing_period,
            payment_method: payment.payment_method,
            transaction_id: payment.transaction_id
        }));

        // Sort by date (newest first)
        const sortedPayments = paymentHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: sortedPayments });
    } catch (error) {
        console.error('Error getting Genie payment history:', error);
        res.status(500).json({ error: 'Failed to get Genie payment history.' });
    }
};

// Test endpoint to verify Genie payment integration
export const testGeniePaymentIntegration = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Genie payment integration is ready",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error testing Genie payment integration:', error);
        res.status(500).json({ error: 'Failed to test Genie payment integration.' });
    }
};

// Webhook handler for Genie payment notifications
export const handleGeniePaymentWebhook = async (req, res) => {
    try {
        const rawBody = req.body;
        const signature = req.headers["x-genie-signature"];

        // 1️⃣ Verify signature
        if (!verifyGenieWebhookSignature(rawBody, signature)) {
            console.error("❌ Invalid Genie webhook signature");
            return res.sendStatus(401);
        }

        // 2️⃣ Parse event
        const event = JSON.parse(rawBody.toString());

        console.log("✅ Genie webhook event:", event);

        // 3️⃣ Validate payload
        if (!event.localId || !event.transactionId || !event.state) {
            console.error("❌ Invalid webhook payload:", event);
            return res.sendStatus(400);
        }

        // 4️⃣ Extract INTERNAL payment ID
        const paymentId = event.localId.replace("payment_", "");

        // 5️⃣ Update payment with FINAL Genie data
        await GeniePayment.updateOne(
            { _id: paymentId },
            {
                $set: {
                    transaction_id: event.transactionId,
                    customer_id: event.customerId
                }
            }
        );

        // 6️⃣ State machine
        switch (event.state) {
            case "SUCCESS":
            case "CONFIRMED":
                await handlePaymentSuccess({
                    paymentId,
                    id: event.transactionId,
                    state: event.state,
                    paymentToken: event.paymentToken
                });
                break;

            case "FAILED":
                await handlePaymentFailed({ paymentId });
                break;

            case "CANCELLED":
                await handlePaymentCancelled({ paymentId });
                break;

            default:
                console.log("Unhandled Genie state:", event.state);
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error("Webhook error:", err);
        return res.sendStatus(200); // prevent retries
    }
};



export const createGeniePaymentRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { planId, billingPeriod, formSelection } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated.'
            });
        }

        // Get plan details
        const plan = await ManualPlan.findById(planId);
        if (!plan) {
            console.log('Plan not found for ID:', planId);
            return res.status(404).json({
                success: false,
                error: 'Plan not found.'
            });
        }

        // Calculate amount based on billing period using final discounted prices
        let amount;
        switch (billingPeriod) {
            case 'yearly':
                amount = plan.final_prices?.yearly || plan.price_yearly;
                break;
            case 'half_yearly':
                amount = plan.final_prices?.half_yearly || plan.price_half_yearly;
                break;
            case 'monthly':
            default:
                amount = plan.final_prices?.monthly || plan.price_monthly;
                break;
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        switch (billingPeriod) {
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            case 'half_yearly':
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            case 'monthly':
            default:
                endDate.setMonth(endDate.getMonth() + 1);
                break;
        }

        // Get user details for customer creation
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.'
            });
        }

        // Check if this is an upgrade by looking at form selection data
        const isUpgrade = formSelection && typeof formSelection === 'object' && formSelection.isUpgrade;

        // If this is an upgrade, cancel the current subscription immediately
        if (isUpgrade) {
            const currentSubscription = await GenieSubscription.findOne({
                user_id: userId,
                status: 'active'
            });

            if (currentSubscription) {
                // Mark current subscription as cancelled
                currentSubscription.status = 'cancelled';
                currentSubscription.cancelled_at = new Date();
                await currentSubscription.save();
                console.log('Cancelled current subscription for upgrade:', currentSubscription._id);
            }
        }


        // Create payment request in our system with pending status (do this early to get payment ID)
        const paymentData = {
            user_id: userId,
            plan_id: planId,
            plan_name: plan.name,
            amount,
            payment_method: 'genie_card',
            payment_status: 'pending',
            billing_period: billingPeriod,
            subscription_start: startDate,
            subscription_end: endDate,
            form_selection: formSelection,
            customer_id: null
        };


        const newPayment = new GeniePayment(paymentData);
        await newPayment.save();

        // Create customer in Genie if not exists
        let customerId = null;
        let customerResponse = null;

        try {
            customerResponse = await genieClient.post("/public-customers/", {
                name: user.name,
                email: user.email,
                billingEmail: user.email
            });
            customerId = customerResponse.data.id;
            console.log("Created Genie customer with ID:", customerId);

            // Update payment with customer ID
            newPayment.customer_id = customerId;
            await newPayment.save();
        } catch (customerError) {
            console.error("Error creating Genie customer:", customerError.response?.data || customerError.message);
            // If customer already exists, we'll use the payment link approach instead
        }

        // Parse form selection data if it exists
        let parsedFormSelection = null;
        if (formSelection) {
            try {
                // If it's already an object, use it directly
                if (typeof formSelection === 'object') {
                    parsedFormSelection = formSelection;
                } else {
                    // If it's a string, parse it
                    parsedFormSelection = JSON.parse(formSelection);
                }

                // Update payment with parsed form selection
                newPayment.form_selection = parsedFormSelection;
                await newPayment.save();
            } catch (parseError) {
                console.error('Error parsing form selection data:', parseError);
                parsedFormSelection = null;
            }
        }

        // Create a payment link or card payment request
        let paymentUrl = null;
        let transactionId = null;
        let errorMessage = null;

        // Use the ngrok URL for redirect since Genie doesn't support localhost
        const redirectBaseUrl = process.env.SERVER_URL_NGROK || process.env.VITE_SERVER_URL || "http://localhost:5173";
        const billingPath = "/billing"; // The actual billing page path

        try {
            // Try to create a card payment request first (faster for returning customers)
            try {
                const paymentResponse = await genieClient.post("/connect/v1/payments/card", {
                    amount: amount * 100, // Convert to cents for Genie API
                    currency: "LKR",
                    localId: `payment_${newPayment._id}`,

                    customer: customerId ? { id: customerId } : undefined,
                    cardOnFile: true, // enables recurring setup
                    redirectUrl: `${redirectBaseUrl}/api/genie/billing-redirect`,
                    //webhook: `${process.env.VITE_SERVER_URL}/api/genie/webhook`,
                    webhook: `${process.env.GENIE_WEBHOOK_URL}`,
                });

                paymentUrl = paymentResponse.data.url;
                transactionId = paymentResponse.data.id;
                console.log("Successfully created card payment request");
            } catch (cardPaymentError) {
                console.error("Error creating card payment request:", cardPaymentError.response?.data || cardPaymentError.message);
                errorMessage = cardPaymentError.response?.data?.message || cardPaymentError.message;

                // If card payment fails, fall back to transaction (payment link) with full customer details
                console.log("Falling back to transaction (payment link) creation with full customer details");
                try {
                    const transactionResponse = await genieClient.post("/public/v2/transactions", {
                        amount: amount * 100, // Convert to cents for Genie API
                        currency: "LKR",
                        localId: `payment_${newPayment._id}`,
                        customer: {
                            name: user.name,
                            email: user.email,
                            billingEmail: user.email
                        },
                        redirectUrl: `${redirectBaseUrl}/api/genie/billing-redirect`,
                        //webhook: `${process.env.VITE_SERVER_URL}/api/genie/webhook`
                        webhook: `${process.env.GENIE_WEBHOOK_URL}`,
                    });

                    paymentUrl = transactionResponse.data.url;
                    transactionId = transactionResponse.data.id;
                } catch (transactionError) {
                    console.error("Error creating transaction (payment link):", transactionError.response?.data || transactionError.message);
                    // If both attempts fail, we'll handle it in the outer catch block
                    throw transactionError;
                }
            }

            // Update payment with transaction details
            if (transactionId) {
                newPayment.transaction_id = transactionId;
            }
            if (paymentUrl) {
                newPayment.payment_url = paymentUrl;
            }
            await newPayment.save();

        } catch (paymentError) {
            console.error("Error creating Genie payment:", paymentError.response?.data || paymentError.message);
            errorMessage = paymentError.response?.data?.message || paymentError.message;

            // Return error response immediately
            return res.status(500).json({
                success: false,
                error: errorMessage || 'Failed to create payment link. Please contact support.',
                data: {
                    payment: newPayment
                }
            });
        }

        // If we don't have a payment URL, return an error
        if (!paymentUrl) {
            return res.status(500).json({
                success: false,
                error: errorMessage || 'Failed to create payment link. Please contact support.',
                data: {
                    payment: newPayment
                }
            });
        }

        // Return success response with payment URL for immediate redirect
        res.json({
            success: true,
            data: {
                payment: newPayment,
                paymentUrl: paymentUrl
            },
            message: 'Payment request created successfully. Redirecting to payment page.'
        });
    } catch (error) {
        console.error('Error creating Genie payment request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create Genie payment request.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const handleRedirect = async (req, res) => {
    const { transactionId, state, signature, message } = req.query;

    const clientBaseUrl =
        process.env.NODE_ENV === "production"
            ? process.env.VITE_CLIENT_URL
            : "http://localhost:5173";

    const billingPath = "/billing";

    // 1️⃣ Basic validation
    if (!transactionId || !state || !signature) {
        return res.redirect(
            `${clientBaseUrl}${billingPath}?paymentStatus=error&message=Invalid payment response`
        );
    }

    // 2️⃣ Verify Genie signature
    const isValid = verifyGenieSignature({
        transactionId,
        state,
        signature
    });

    if (!isValid) {
        console.error("❌ Invalid Genie signature");
        return res.redirect(
            `${clientBaseUrl}${billingPath}?paymentStatus=error&message=Invalid payment signature`
        );
    }

    // 3️⃣ UX mapping ONLY
    let mappedStatus = "error";
    if (state === "SUCCESS" || state === "CONFIRMED") mappedStatus = "success";
    else if (state === "FAILED") mappedStatus = "failed";
    else if (state === "CANCELLED") mappedStatus = "cancelled";

    return res.redirect(
        `${clientBaseUrl}${billingPath}?paymentStatus=${mappedStatus}&message=${encodeURIComponent(
            message || "Payment processed"
        )}`
    );
};


// Process form selection after payment completion
export const processFormSelectionAfterGeniePayment = async (userId, formSelection) => {
    try {
        console.log('Processing form selection after Genie payment completion for user:', userId, 'formSelection:', formSelection);

        if (!formSelection || !formSelection.selectedFormIds || !Array.isArray(formSelection.selectedFormIds)) {
            console.log('No valid form selection data provided');
            return { success: true, message: 'No form selection to process' };
        }

        const { selectedFormIds, isUpgrade, targetPlanId } = formSelection;

        if (isUpgrade) {
            // For upgrades, unlock all selected forms
            const unlockResult = await Form.updateMany(
                {
                    _id: { $in: selectedFormIds },
                    user_id: userId
                },
                {
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                }
            );

            console.log('Unlock result for upgrade:', unlockResult);

            // Update the Genie subscription with selected forms
            const genieSubscription = await GenieSubscription.findOne({
                user_id: userId,
                status: 'active'
            });

            if (genieSubscription) {
                const existingSelectedForms = genieSubscription.forms_selected || [];
                const updatedSelectedForms = [...new Set([...existingSelectedForms, ...selectedFormIds])];
                genieSubscription.forms_selected = updatedSelectedForms;
                await genieSubscription.save();
                console.log('Updated Genie subscription with selected forms:', updatedSelectedForms);
            }

            return {
                success: true,
                message: `Successfully unlocked ${selectedFormIds.length} form(s) after payment completion.`,
                unlockedForms: selectedFormIds.length
            };
        } else {
            // For downgrades, lock/unlock forms based on selection
            // Get all user's forms (both active and inactive/draft forms)
            const allUserForms = await Form.find({
                user_id: userId
            });

            // Check if we have more forms than the new plan allows
            const targetPlan = await ManualPlan.findById(targetPlanId);
            if (!targetPlan) {
                throw new Error('Target plan not found');
            }

            const newPlanLimit = targetPlan.form_limit;

            // Lock the forms that are not selected
            const formsToLock = allUserForms.filter(form => !selectedFormIds.includes(form._id.toString()));

            console.log('Forms to lock for downgrade:', formsToLock.map(f => ({ id: f._id, name: f.form_name })));

            // Lock the unselected forms (set is_locked: true, keep is_active status unchanged)
            if (formsToLock.length > 0) {
                const lockResult = await Form.updateMany(
                    {
                        _id: { $in: formsToLock.map(f => f._id) },
                        user_id: userId
                    },
                    {
                        is_locked: true,
                        lockedAt: new Date(),
                        lockReason: `Locked due to downgrade to ${targetPlan.name} plan`
                    }
                );
                console.log('Lock result for downgrade:', lockResult);
            }

            // Unlock the selected forms (just in case they were locked)
            const unlockResult = await Form.updateMany(
                {
                    _id: { $in: selectedFormIds },
                    user_id: userId
                },
                {
                    is_locked: false,
                    $unset: { lockedAt: 1, lockReason: 1 } // Remove lock fields
                }
            );

            console.log('Unlock result for downgrade:', unlockResult);

            // Update the Genie subscription with selected forms
            const genieSubscription = await GenieSubscription.findOne({
                user_id: userId,
                status: 'active'
            });

            if (genieSubscription) {
                genieSubscription.forms_selected = selectedFormIds;
                await genieSubscription.save();
                console.log('Updated Genie subscription with selected forms:', selectedFormIds);
            }

            // Count forms that should be locked (the excess forms)
            const lockedFormCount = Math.max(0, allUserForms.length - newPlanLimit);

            return {
                success: true,
                message: `Successfully updated form status after payment completion. ${selectedFormIds.length} form(s) kept, ${lockedFormCount} form(s) locked.`,
                activeForms: selectedFormIds.length,
                lockedForms: lockedFormCount
            };
        }
    } catch (error) {
        console.error('Error processing form selection after Genie payment completion:', error);
        return { success: false, error: 'Failed to process form selection after Genie payment completion' };
    }
};

// Handle successful payment
const handlePaymentSuccess = async (paymentData) => {
    try {
        console.log("Processing Genie payment event:", paymentData);
        const payment = await GeniePayment.findById(paymentData.paymentId);

        if (!payment) {
            console.log("Payment not found:", paymentData.paymentId);
            return;
        }

        // 3️⃣ 🔐 Idempotency check
        if (payment.payment_status === "completed") {
            console.log("Payment already completed, skipping processing");
            return;
        }

        // 4️⃣ Only continue if SUCCESS or CONFIRMED
        if (!["SUCCESS", "CONFIRMED"].includes(paymentData.state)) {
            console.log(
                "Payment not successful, skipping subscription creation. State:",
                paymentData.state
            );
            return;
        }

        // 5️⃣ Mark payment as completed
        payment.payment_status = "completed";
        await payment.save();

        // 6️⃣ Get plan
        const plan = await ManualPlan.findById(payment.plan_id);
        if (!plan) {
            console.log("Plan not found for payment:", payment._id);
            return;
        }

        // 7️⃣ Handle subscription
        let subscription = await GenieSubscription.findOne({
            user_id: payment.user_id,
            status: "active"
        });

        const isUpgrade = payment.form_selection?.isUpgrade;
        let previousPlanId = null;

        // 8️⃣ Retrieve card token
        let cardToken = paymentData.paymentToken || null;

        if (!cardToken) {
            try {
                const tokenResponse = await genieClient.get(
                    `/connect/v1/customers/${payment.customer_id}/tokens`
                );
                cardToken = tokenResponse.data?.data?.[0]?.token || null;
            } catch (err) {
                console.error("Failed to retrieve Genie card token:", err.message);
            }
        }

        // 9️⃣ Create or update subscription
        if (subscription) {
            // If there's an existing subscription, store its ID and cancel it
            previousPlanId = subscription.plan_id;
            subscription.status = "cancelled";
            subscription.cancelled_at = new Date();
            await subscription.save();
            
            console.log("Cancelled previous subscription:", subscription._id);
        }

        // Create new subscription
        const newSubscription = new GenieSubscription({
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            plan_name: plan.name,
            status: "active",
            billing_period: payment.billing_period,
            subscription_start: payment.subscription_start,
            subscription_end: payment.subscription_end,
            amount: payment.amount,
            currency: "LKR",
            auto_renew: true, // Enable auto-renew by default
            customer_id: payment.customer_id,
            card_token: cardToken, // Store card token for recurring payments
            previous_plan_id: previousPlanId,
            payment_method: payment.payment_method,
            forms_selected: payment.form_selection?.selectedFormIds || []
        });

        await newSubscription.save();
        console.log("Created new subscription:", newSubscription._id);

        // 1️⃣0️⃣ Update user's subscription info
        await User.findByIdAndUpdate(
            payment.user_id,
            {
                $set: {
                    subscription_expiry: payment.subscription_end,
                    current_plan_id: payment.plan_id,
                    is_subscribed: true
                }
            }
        );

        // 1️⃣1️⃣ Process form selection if needed
        if (payment.form_selection) {
            const result = await processFormSelectionAfterGeniePayment(
                payment.user_id,
                payment.form_selection
            );
            console.log("Form selection processing result:", result);
        }

        // 1️⃣2️⃣ Create audit log
        await AuditLog.create({
            user_id: payment.user_id,
            action: "SUBSCRIPTION_CREATED",
            reference_id: newSubscription._id,
            details: {
                plan_id: payment.plan_id,
                plan_name: plan.name,
                amount: payment.amount,
                billing_period: payment.billing_period,
                previous_plan_id: previousPlanId
            }
        });

        console.log("Successfully processed payment and created subscription for user:", payment.user_id);

    } catch (error) {
        console.error("Error processing Genie payment:", error);
    }
};


// Handle failed payment
const handlePaymentFailed = async (paymentData) => {
    try {
        console.log('Processing failed Genie payment:', paymentData);

        // Find the payment record
        const payment = await GeniePayment.findOne({
            $or: [
                { transaction_id: paymentData.id },
                { _id: paymentData.paymentId }
            ]
        });

        if (!payment) {
            console.log('Payment record not found for transaction:', paymentData.id);
            return;
        }

        // Update payment status
        payment.payment_status = 'failed';
        await payment.save();

        console.log('Successfully updated payment status to failed');
    } catch (error) {
        console.error('Error processing failed Genie payment:', error);
    }
};

// Handle cancelled payment
const handlePaymentCancelled = async (paymentData) => {
    try {
        console.log('Processing cancelled Genie payment:', paymentData);

        // Find the payment record
        const payment = await GeniePayment.findOne({
            $or: [
                { transaction_id: paymentData.id },
                { _id: paymentData.paymentId }
            ]
        });

        if (!payment) {
            console.log('Payment record not found for transaction:', paymentData.id);
            return;
        }

        // Update payment status
        payment.payment_status = 'cancelled';
        await payment.save();

        console.log('Successfully updated payment status to cancelled');
    } catch (error) {
        console.error('Error processing cancelled Genie payment:', error);
    }
};

// Process recurring payment for auto-renewing subscriptions
export const processRecurringPayment = async (subscriptionId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log("Processing recurring payment:", subscriptionId);

        // 🔒 Lock subscription during processing (prevents double charge)
        const subscription = await GenieSubscription.findOne({
            _id: subscriptionId,
            status: "active",
            auto_renew: true,
        })
            .populate("user_id")
            .populate("plan_id")
            .session(session);

        if (!subscription) {
            await session.abortTransaction();
            return { success: false, error: "Subscription not eligible for renewal" };
        }

        const user = subscription.user_id;
        const plan = subscription.plan_id;

        if (!user || !plan) {
            await session.abortTransaction();
            return { success: false, error: "User or plan missing" };
        }

        // 🧮 Calculate amount (server-side only)
        let amount;
        switch (subscription.billing_period) {
            case "yearly":
                amount = plan.final_prices?.yearly ?? plan.price_yearly;
                break;
            case "half_yearly":
                amount = plan.final_prices?.half_yearly ?? plan.price_half_yearly;
                break;
            case "monthly":
            default:
                amount = plan.final_prices?.monthly ?? plan.price_monthly;
        }

        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return { success: false, error: "Invalid billing amount" };
        }

        // 📅 New billing dates
        const startDate = new Date();
        const endDate = new Date(startDate);

        if (subscription.billing_period === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
        else if (subscription.billing_period === "half_yearly") endDate.setMonth(endDate.getMonth() + 6);
        else endDate.setMonth(endDate.getMonth() + 1);

        // 💳 Create payment (pending)
        const payment = await GeniePayment.create(
            [{
                user_id: user._id,
                plan_id: plan._id,
                plan_name: plan.name,
                amount,
                currency: "LKR",
                payment_method: "genie_card",
                payment_status: "pending",
                billing_period: subscription.billing_period,
                subscription_start: startDate,
                subscription_end: endDate,
                customer_id: subscription.customer_id,
            }],
            { session }
        );

        // ❌ No saved card
        if (!subscription.card_token) {
            payment[0].payment_status = "failed";
            await payment[0].save({ session });

            await session.commitTransaction();
            return { success: false, error: "No saved card token", payment: payment[0] };
        }

        // 💳 Charge card
        const chargeResponse = await genieClient.post(
            "/connect/v1/payments/card/charge",
            {
                amount: amount * 100,
                currency: "LKR",
                customer: { id: subscription.customer_id },
                card: { token: subscription.card_token },
                description: `Recurring payment - ${plan.name}`,
                metadata: {
                    subscription_id: subscription._id,
                    payment_id: payment[0]._id,
                },
            }
        );

        if (chargeResponse?.data?.status !== "SUCCESS") {
            throw new Error("Genie payment failed");
        }

        // ✅ Payment success
        payment[0].payment_status = "completed";
        payment[0].transaction_id = chargeResponse.data.id;
        await payment[0].save({ session });

        // 🔁 Update subscription
        subscription.subscription_start = startDate;
        subscription.subscription_end = endDate;
        subscription.last_payment_id = payment[0]._id;
        subscription.renewal_history.push({
            payment_id: payment[0]._id,
            date: new Date(),
        });

        await subscription.save({ session });

        // 👤 Update user
        user.subscription_expiry = endDate;
        await user.save({ session });

        // 📝 Audit log
        await AuditLog.create(
            [{
                user_id: user._id,
                action: "RECURRING_PAYMENT_SUCCESS",
                reference_id: payment[0]._id,
                amount,
            }],
            { session }
        );

        await session.commitTransaction();
        return { success: true, payment: payment[0] };

    } catch (error) {
        await session.abortTransaction();
        console.error("Recurring payment error:", error);
        return { success: false, error: "Recurring payment failed" };
    } finally {
        session.endSession();
    }
};

// Toggle auto-renew for a subscription
export const toggleAutoRenew = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        // 🔒 Atomic toggle (prevents race condition)
        const subscription = await GenieSubscription.findOneAndUpdate(
            { user_id: userId, status: "active" },
            [{ $set: { auto_renew: { $not: "$auto_renew" } } }],
            { new: true }
        );

        if (!subscription) {
            return res.status(404).json({ success: false, error: "Active subscription not found" });
        }

        // 📝 Audit log
        await AuditLog.create({
            user_id: userId,
            action: "TOGGLE_AUTO_RENEW",
            new_value: subscription.auto_renew,
            ip: req.ip,
            user_agent: req.headers["user-agent"],
        });

        res.json({
            success: true,
            data: {
                auto_renew: subscription.auto_renew,
                message: `Auto-renew ${subscription.auto_renew ? "enabled" : "disabled"}`,
            },
        });
    } catch (error) {
        console.error("Toggle auto-renew error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};
