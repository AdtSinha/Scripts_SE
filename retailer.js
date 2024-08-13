const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { retailerKeyMapper } = require('./retailerMapper');

const baseCountry = ['Belgium(French)'];

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

const modifyRetailer = (baseCountry, retailerMapper) => {
    return baseCountry.map(item => {
        const { _id, ...rest } = item;
        const correspondingItem = retailerMapper.find(element => element.code === rest.code);
        if (correspondingItem) {
          return { ...rest, ...correspondingItem };
        }
      }).filter(Boolean);
};

const insertModifiedRetailer = async (getModifiedRetailer, client) => {
  try {
    const database = client.db('commonDB');
    const collection = database.collection('retailerConfigsV2');
    const insertResult = await collection.insertMany(getModifiedRetailer);
    console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
    return insertResult.insertedCount;
  } catch (error) {
    console.error('Error inserting modified retailerConfigsV2 :', error);
    return 0;
  }
};

const getRetailers = async () => {
  let client;
  try {
    client = await connectToDatabase();
    const database = client.db('commonDB');
    const collection = database.collection('retailerConfigsV2');
    const result = await collection.find({ countryId: { $in: baseCountry } }).toArray();
    const retailersMapper = retailerKeyMapper;
    const getModifiedRetailer = modifyRetailer(result, retailersMapper);
    const insertModifiedResult = await insertModifiedRetailer(getModifiedRetailer, client);
    return insertModifiedResult;
  } catch (error) {
    console.error('Error getting retailerConfigsV2 :', error);
    return 0;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { getRetailers };