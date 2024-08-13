const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { additionalServicesKeyMapper } = require('./additionalServicesMapper');

const baseCountry = ['Belgium(French)'];

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

const modifyAdditionalServices = (baseCountry, additionalSericesMapper) => {
    return baseCountry.map(item => {
        const { _id, ...rest } = item;
        const correspondingItem = additionalSericesMapper.find(element => element.profileTitle === rest.profileTitle);
        if (correspondingItem) {
          return { ...rest, ...correspondingItem };
        }
      }).filter(Boolean);
};

const insertModifiedAdditionalServices = async (getModifiedBaseCountry, client) => {
  try {
    const database = client.db('commonDB');
    const collection = database.collection('additionalServices');
    const insertResult = await collection.insertMany(getModifiedBaseCountry);
    console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
    return insertResult.insertedCount;
  } catch (error) {
    console.error('Error inserting modified additional services:', error);
    return 0;
  }
};

const getAdditionalServices = async () => {
  let client;
  try {
    client = await connectToDatabase();
    const database = client.db('commonDB');
    const collection = database.collection('additionalServices');
    const result = await collection.find({ countryId: { $in: baseCountry } }).toArray();
    const additionalSericesMapper = additionalServicesKeyMapper;
    const getModifiedAdditionalServices = modifyAdditionalServices(result, additionalSericesMapper);
    const insertModifiedResult = await insertModifiedAdditionalServices(getModifiedAdditionalServices, client);
    return insertModifiedResult;
  } catch (error) {
    console.error('Error getting additional services :', error);
    return 0;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { getAdditionalServices };