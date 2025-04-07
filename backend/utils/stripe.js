import Stripe from "stripe";

console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY);
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);