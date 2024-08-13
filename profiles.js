const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { profileKeyMapper } = require('./profileMapper');

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';
const baseCountryProfile = ['Belgium(French)']

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

const modifyProfile = (baseProfile, profileKeyMapper) => {
    return baseProfile.map(item => {
      const { _id, ...rest } = item;
      const correspondingItem = profileKeyMapper.find(element => element.country === rest.country && element.title === rest.title);
      if (correspondingItem) {
        return { ...rest, ...correspondingItem };
      }
    }).filter(Boolean);
  };

  const insertModifiedProfiles = async (getModifiedBaseCountry, client) => {
    try {
      const database = client.db('commonDB');
      const collection = database.collection('profiles');
      const insertResult = await collection.insertMany(getModifiedBaseCountry);
      console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
      return insertResult.insertedCount;
    } catch (error) {
      console.error('Error inserting modified profiles:', error);
      return 0;
    }
  };

const getProfiles = async () => {
    let client;
    try {
      client = await connectToDatabase();
      const database = client.db('commonDB');
      const collection = database.collection('profiles');
      const result = await collection.find({ countryId: { $in: baseCountryProfile } }).toArray();
      const profileMapper = profileKeyMapper;
      const getModifiedProfiles = modifyProfile(result, profileMapper);
      const insertModifiedResult = await insertModifiedProfiles(getModifiedProfiles, client);
      return insertModifiedResult;


    } catch (error) {
      console.error('Error getting profiles:', error);
      return 0;
    } finally {
      if (client) {
        await client.close();
      }
    }
  };
  
  module.exports = { getProfiles };