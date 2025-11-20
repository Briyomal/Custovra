import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { GenieSubscription } from '../models/GenieSubscription.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        console.log("mongo_uri: ", process.env.MONGO_URI)
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)

    } catch (error) {
        console.log("Error Connection to MongoDB: ", error.message)
        process.exit(1)
    }
};

const testSubscription = async () => {
  try {
    // Test user ID from the issue
    const userId = '674367ab5922f4ff223dbd5f';
    
    // Get user
    const user = await User.findById(userId);
    console.log('User:', user.email);
    console.log('Is Active:', user.is_active);
    console.log('Subscription Status:', user.subscription_status);
    console.log('Subscription Expiry (Stripe field):', user.subscription_expiry);
    
    // Get all Genie subscriptions for this user
    const genieSubscriptions = await GenieSubscription.find({ user_id: userId });
    console.log('\nGenie Subscriptions:');
    genieSubscriptions.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`);
      console.log('  Plan Name:', sub.plan_name);
      console.log('  Status:', sub.status);
      console.log('  Start Date:', sub.subscription_start);
      console.log('  End Date:', sub.subscription_end);
      console.log('  Is Active:', new Date() < new Date(sub.subscription_end) && sub.status === 'active');
    });
    
    // Check if user should be active based on Genie subscriptions
    const now = new Date();
    const hasActiveGenieSubscription = await GenieSubscription.exists({
      user_id: userId,
      subscription_end: { $gt: now },
      status: 'active'
    });
    
    console.log('\nHas Active Genie Subscription:', hasActiveGenieSubscription);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Connect to database and run test
connectDB().then(() => {
  testSubscription();
});