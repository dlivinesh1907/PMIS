const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testMongo = async () => {
  console.log('Testing connection to MongoDB Atlas...');
  console.log('URI:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Connected to MongoDB Atlas cluster successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'FAILED to connect: ' + err.message);
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.log('\x1b[33m%s\x1b[0m', 'TIP: If authentication failed, try changing the password in backend/.env to Livi1907 or updating your user password in Atlas.');
    }
    process.exit(1);
  }
};

testMongo();
