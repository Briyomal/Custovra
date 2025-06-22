import { stripe } from "../utils/stripe.js";
import { User } from '../models/User.js'; // Assuming your User model is here

export const createCustomerPortalSession = async (req, res) => {
  try {
    // req.userId is expected to be set by your verifyToken middleware
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const customerId = user.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Stripe Customer ID not found for this user. Please ensure a subscription has been created.' });
    }

    // Specify the URL where Stripe should redirect the user after they are done in the portal.
    // Ensure CLIENT_URL is defined in your .env
    const returnUrl = `${process.env.CLIENT_URL}/billing`; // Or your desired return page

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session.' });
  }
};