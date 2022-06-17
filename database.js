const { MongoClient } = require('mongodb');
const { dbURL } = require('./config.json');

const { dbName } = require('./config.json');
const COLLECTIONS = {
    CHARACTER: "characters",
    CARDS: "cards"
}

const client = new MongoClient(dbURL);

async function insertDocument(collectionName, document) {
    try {
        await client.connect();

        const db = client.db(dbName);
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

        const db = client.db(dbName);
        const coll = db.collection(collectionName);

        result = await coll.findOne(query);
    } finally {
        await client.close();
    }
    return result;
}

async function deleteOneDocument(collectionName, query) {
    try {
        await client.connect();

        const db = client.db(dbName);
        const coll = db.collection(collectionName);

        result = await coll.deleteOne(query);
    } finally {
        await client.close();
    }
    return result;
}

async function replaceDocument(collectionName, filter, replacement) {
    try {
        await client.connect();

        const db = client.db(dbName);
        const coll = db.collection(collectionName);

        result = await coll.replaceOne(filter, replacement);
    } finally {
        await client.close();
    }
    return result;
}

async function fetchAll(collectionName, project) {
    try {
        await client.connect();

        const db = client.db(dbName);
        const coll = db.collection(collectionName);

        result = await coll.find().project(project).toArray();
    } finally {
        await client.close();
    }
    return result;
}

async function fetchUnique(collectionName, field) {
    try {
        await client.connect();

        const db = client.db(dbName);
        const coll = db.collection(collectionName);

        result = await coll.distinct(field);
    } finally {
        await client.close();
    }
    return result;
}

module.exports = {
    COLLECTIONS: COLLECTIONS,
    insertDocument: insertDocument,
    firstDocument: firstDocument,
    deleteOneDocument: deleteOneDocument,
    replaceDocument: replaceDocument,
    addCharacter: async (character) => { return insertDocument(COLLECTIONS.CHARACTER, character) },
    findCharacter: async (query) => { return firstDocument(COLLECTIONS.CHARACTER, query) },
    deleteCharacter: async (query) => { return deleteOneDocument(COLLECTIONS.CHARACTER, query) },
    addCard: async (card) => { return insertDocument(COLLECTIONS.CARDS, card) },
    replaceCard: async (filter, card) => { return replaceDocument(COLLECTIONS.CARDS, filter, card) },
    findCard: async (query) => { return firstDocument(COLLECTIONS.CARDS, query) },
    getCardNames: async (query) => { return fetchUnique(COLLECTIONS.CARDS, 'name') }
}