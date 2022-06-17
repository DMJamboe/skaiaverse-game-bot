const db = require('./database');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const CSVToJSON = require('csvtojson');
const progress = require('cli-progress');

const argv = yargs(hideBin(process.argv)).argv

const rangeRegex = /^R[0-9]$/;
const healthRegex = /^[0-9]+\/[0-9]+$/;

function parseCard(card) {
    card.classes = card.classification.split(' ');
    card.aspect = card.pack.split('-')[0];
    if (rangeRegex.test(card.stats)) {
        card.range = card.stats;
    }
    else if (healthRegex.test(card.stats)) {
        card.attack = card.stats.split('/')[0];
        card.health = card.stats.split('/')[1];
    }
    else {
        console.log(`Failed to parse ${card.name} - ${card.stats.split('')}`);
        fails += 1;
        return {}; //parse error
    }
    return card;

}

let updates = 0;
let inserts = 0;
let fails = 0;
let ignore = 0;

if (!argv.d) {
    console.log('Update mode.');
    if (argv.file) {
        CSVToJSON().fromFile(argv.file)
            .then(async cards => {
                cards = cards.filter(card => card.name);
                parsedCards = cards.map(parseCard);
                parsedCards = parsedCards.filter(card => card.name);
                const pbar = new progress.SingleBar({
                    format: '[{bar}] {value}/{total} | {task}'
                }, progress.Presets.shades_classic);
                pbar.start(parsedCards.length, 0);
                for (const card of parsedCards) {
                    pbar.update(payload = {task: `Searching ${card.name}`});
                    checkCard = await db.findCard({"name": card.name});
                    if (checkCard && checkCard._id) {
                        delete checkCard._id;
                    }
                    if (JSON.stringify(card) === JSON.stringify(checkCard)) {
                        pbar.update(payload = {task: `Ignoring ${card.name}`});
                        ignore += 1;
                    } else if (checkCard) {
                        pbar.update(payload = {task: `Updating ${card.name}`});
                        updates += 1;
                        await db.replaceCard(checkCard, card);
                    } else {
                        pbar.update(payload = {task: `Inserting ${card.name}`});
                        inserts += 1;
                        await db.addCard(card);
                    }
                    pbar.increment();
                };
                pbar.update(payload = {task: `Complete`});
                pbar.stop();
                console.log(`\nInserted ${inserts} cards.\nUpdated  ${updates} cards.\nIgnored  ${ignore} cards.\nFailed   ${fails} cards.`);
            }).catch((err) => {
                console.log(err);
            })
    }
} else {
    console.log('Delete mode.');
}
