const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { tilesKeyMapper } = require('./tilesMapper');

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';
const baseCountryTiles = ['Belgium(French)']

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

const modifyTiles = (baseTiles, tilesMapper) => {
    return baseTiles.map(item => {
      const { _id, ...rest } = item;
      const correspondingItem = tilesMapper.find(element => element.profile === rest.profile);
      if (correspondingItem) {
        return { ...rest, ...correspondingItem };
      }
    }).filter(Boolean);
  };

  const insertModifiedTiles = async (getModifiedBaseCountry, client) => {
    try {
      const database = client.db('commonDB');
      const collection = database.collection('tiles');
      const insertResult = await collection.insertMany(getModifiedBaseCountry);
      console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
      return insertResult.insertedCount;
    } catch (error) {
      console.error('Error inserting modified tiles:', error);
      return 0;
    }
  };

const getTiles = async () => {
    let client;
    try {
      client = await connectToDatabase();
      const database = client.db('commonDB');
      const collection = database.collection('tiles');
      const result = await collection.find({ countryId: { $in: baseCountryTiles } }).toArray();
      const tilesMapper = tilesKeyMapper;
      const getModifiedTiles = modifyTiles(result, tilesMapper);
      const insertedResult = await insertModifiedTiles(getModifiedTiles, client);
      return insertedResult;


    } catch (error) {
      console.error('Error getting tiles:', error);
      return 0;
    } finally {
      if (client) {
        await client.close();
      }
    }
  };
  
  module.exports = { getTiles };