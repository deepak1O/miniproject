const { MongoClient } = require('mongodb');

// Replace with your MongoDB Atlas connection string
const uri = 'mongodb+srv://deepakkumarsingh:25471436100805@cluster0.gx8sj9x.mongodb.net/?retryWrites=true&w=majority';

async function findUserByPhoneNumber(phoneNumber) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to the MongoDB Atlas cluster
    await client.connect();
    console.log('Connected to the database');

    // Specify the database and collection you want to query
    const database = client.db('test');
    const collection = database.collection('users');

    // Query the collection for a user with the specified phone number
    const query = { Phonenumber: phoneNumber };
    const user = await collection.findOne(query);

    if (user) {
      const lc= user.credit;
      return lc;
    } else {
      const lc=('No user found with phone number:', phoneNumber);
      return lc;
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the connection when done
    await client.close();
    console.log('Connection closed');
  }
}
module.exports =findUserByPhoneNumber;
