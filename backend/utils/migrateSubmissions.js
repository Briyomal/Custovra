// Migration script to add is_read field to existing submissions
import mongoose from 'mongoose';
import { Submission } from '../models/Submission.js';
import { connectDB } from '../db/connectDB.js';

const migrateSubmissions = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Update all submissions to have is_read = false by default
    const result = await Submission.updateMany(
      { is_read: { $exists: false } }, // Find submissions without is_read field
      { $set: { is_read: false } } // Set is_read to false
    );
    
    console.log(`Migration completed. Updated ${result.modifiedCount} submissions.`);
    
    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
migrateSubmissions();