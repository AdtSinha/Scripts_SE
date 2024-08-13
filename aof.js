const { MongoClient } = require('mongodb');
//const { aofKeyMapper } = require('./aofMapper');

const uri = 'mongodb://prodSupportSeRwAll:testW1234@docdb-cluster-prod.cluster-c9za9eeyodcj.us-east-1.docdb.amazonaws.com:27017/test?authSource=admin&readPreference=primary&retryWrites=false&directConnection=true&tls=true&tlsCAFile=C%3A%5CUsers%5CSESA710455%5CDownloads%5Ccertificate.pem';
const baseCountryAof = ['536175646920417261626961']

const connectToDatabase = async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  return client;
};

// const modifyAof = (baseProfile, profileKeyMapper) => {
//   return baseProfile.map(item => {
//     const { _id, ...rest } = item;
//     const correspondingItem = profileKeyMapper.find(element => element.areaOfFocusCode === rest.areaOfFocusCode);
//     if (correspondingItem) {
//       return { ...rest, ...correspondingItem };
//     }
//   }).filter(Boolean);
// };


const modifyAof = (baseAof, aofMapper) => {
  const resultMap = new Map();
  const uniqueSet = new Set();
  baseAof.forEach(item => {
    const { _id, ...itemWithoutId } = item;
    const correspondingItems = aofMapper.filter(element => element.country === item.country && element.title === item.title);
    if (correspondingItems.length > 0) {
      correspondingItems.forEach(correspondingItem => {
        const key = `${item.title}-${correspondingItem.areaOfFocus}`;
        if (!uniqueSet.has(key)) {
          const modifiedItem = { ...itemWithoutId, areaOfFocus: correspondingItem.areaOfFocus, ...correspondingItem };
          resultMap.set(key, modifiedItem);
          uniqueSet.add(key);
        }
      });
    } else {
      const key = `${item.title}-${itemWithoutId.areaOfFocus}`;
      if (!uniqueSet.has(key)) {
        resultMap.set(key, itemWithoutId);
        uniqueSet.add(key);
      }
    }
  });
  return Array.from(resultMap.values());
};


  const insertModifiedAof = async (getModifiedBaseCountry, client) => {
    try {
      const database = client.db('commonDB');
      const collection = database.collection('areaOfFocus');
      const insertResult = await collection.insertMany(getModifiedBaseCountry);
      console.log(`${insertResult.insertedCount} documents were inserted into the collection`);
      return insertResult.insertedCount;
    } catch (error) {
      console.error('Error inserting modified profiles:', error);
      return 0;
    }
  };

const getAof = async (aofKeyMapper) => {
    let client;
    try {
      client = await connectToDatabase();
      const database = client.db('commonDB');
      const collection = database.collection('areaOfFocus');
      const result = await collection.find({ countryId: { $in: baseCountryAof } }).toArray();
      const aofMapper = aofKeyMapper;
      const getModifiedAof = modifyAof(result, aofMapper);
      const insertModifiedResult = await insertModifiedAof(getModifiedAof, client);
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
  
  module.exports = { getAof };