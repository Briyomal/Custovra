
// server/controllers/payment.controller.js
import { Polar } from "@polar-sh/sdk";
import {
	User
} from "../models/User.js";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN, 
  server: process.env.POLAR_ENV || "sandbox", // Change to "production" when ready
});

export const createCheckout = async (req, res) => {
  try {
    // productId: the ID of the product in Polar
    // amount: the raw price you want to charge (e.g., calculated on backend)
    const { productId, amount, discountId, formLimit, submissionLimit, imageUpload, employeeManagement } = req.body;
    const user = await User.findById(req.userId);
    console.log("Body", req.body);
    console.log("Form Limit", formLimit);
    console.log("Submission Limit", submissionLimit);
    console.log("Image Upload", imageUpload);
    console.log("Employee Management", employeeManagement);

    //console.log("Discount ID", discountId);

    if (!productId || !user) {
    return res.status(400).json({ 
      message: 'Missing product ID or user',
      received: { productId, user: !!user } 
    });
  }
    // Using polar.checkouts.create as per the latest docs for Ad-hoc pricing
    const result = await polar.checkouts.create({
      products: [productId],
      discountId: discountId || undefined,

      // Ad-hoc price definition
      prices: {
        [productId]: [
          {
            amountType: "fixed",
            priceAmount: amount, // e.g., 10000 for $100.00
            priceCurrency: "usd",
          }
        ]
      },
      successUrl: `${process.env.CLIENT_URL}/billing?session_id={CHECKOUT_ID}`,
      customerEmail: user.email,
      externalCustomerId: user._id.toString(), 
      metadata: {
        userId: user._id.toString(),
        formLimit: limits?.formLimit?.toString(), // Metadata values must be strings
        imageUpload: limits?.imageUpload?.toString(),
        submissionLimit: limits?.submissionLimit?.toString(),
        employeeManagement: limits?.employeeManagement?.toString(),
      },
    });

    res.status(200).json({ url: result.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};