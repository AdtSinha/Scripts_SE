const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { countryKeyMapper } = require('./countryMapper');

const baseCountry = ['BE'];

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

const modifyBaseCountry = (baseCountry, countryMapper) => {
  return baseCountry.map(item => {
    const correspondingItem = countryMapper.find(element => element.code === item.code);
    if (correspondingItem) {
      return { ...item, ...correspondingItem };
    }
  }).filter(Boolean);
};

const insertModifiedBaseCountry = async (getModifiedBaseCountry, client) => {
  try {
    const database = client.db('commonDB');
    const collection = database.collection('countries');
    const insertResult = await collection.insertMany(getModifiedBaseCountry);
    console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
    return insertResult.insertedCount;
  } catch (error) {
    console.error('Error inserting modified base country:', error);
    return 0;
  }
};

const getBaseCountry = async () => {
  let client;
  try {
    client = await connectToDatabase();
    const database = client.db('commonDB');
    const collection = database.collection('countries');
    const result = await collection.find({ code: { $in: baseCountry } }).toArray();
    const countryMapper = countryKeyMapper;
    const getModifiedBaseCountry = modifyBaseCountry(result, countryMapper);
    const insertModifiedResult = await insertModifiedBaseCountry(getModifiedBaseCountry, client);
    return insertModifiedResult;
  } catch (error) {
    console.error('Error getting base country:', error);
    return 0;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { getBaseCountry };