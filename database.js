const { MongoClient } = require('mongodb');
const { dbURL } = require('./config.json');

const databaseName = "testing";
const COLLECTIONS = {
    CHARACTER: "characters"
}

const client = new MongoClient(dbURL);

async function insertDocument(collectionName, document) {
    try {
        await client.connect();

        const db = client.db(databaseName);
        const coll = db.collection(collectionName);

        await coll.insertOne(document);
    } finally {
        await client.close();
    }
}

async function firstDocument(collectionName, query) {
    result = null;
    try {
        await client.connect();

        const db = client.db(databaseName);
        const coll = db.collection(collectionName);

        result = await coll.findOne(query);
    } finally {
        await client.close();
    }
    return result;
}

module.exports = {
    COLLECTIONS: COLLECTIONS,
    insertDocument: insertDocument,
    firstDocument: firstDocument
}