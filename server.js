// Built-in Node.js modules
const fs = require('fs').promises; // using promises version for async/await
const path = require('path');

// NPM modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // using verbose() to produce long stack traces

const public_dir = path.join(__dirname, 'public');
const template_dir = path.join(__dirname, 'templates');
const db_filename = path.join(__dirname, 'db', 'ec.db');

const app = express();
const port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        return console.error(`Error opening ${path.basename(db_filename)}: ${err.message}`);
    }
    console.log(`Now connected to ${path.basename(db_filename)}`);
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));

// GET request handler for home page '/' (redirect to desired route)
app.get('/', (req, res) => {
    res.redirect('/home');
});

//HOMEPAGE
app.get('/home', async (req, res) => {
    try {
        const page = await fs.readFile(path.join(template_dir, 'index.html'), 'utf-8');
        res.status(200).type('html').send(page);
    } catch (err) {
        res.status(404).send("Error: File Not Found");
    }
});


// default energy page
app.get('/energy/', (req, res) => {
    res.redirect('/energy/coal');
});

// Build a table row
const buildTableRow = (year, state, consumption) => `<tr><td>${year}</td><td>${state}</td><td>${consumption}</td></tr>`;

// Get previous and next energy types
const getPrevNext = (energys, energyIndex) => {
    const previous = `/energy/${energys[(energyIndex + energys.length - 1) % energys.length].toLowerCase()}`;
    const next = `/energy/${energys[(energyIndex + 1) % energys.length].toLowerCase()}`;
    return { previous, next };
};

//ENERGY.HTML
//URL SHOULD LOOK LIKE localhost:8000/energy/coal
app.get('/energy/:energytype', async (req, res) => {
    const energyType = req.params.energytype.toLowerCase();

    const energyPage = path.join(template_dir, 'energy.html');
    const energyPairs = { "coal": "Coal (Short Tons)", "geothermal": "Geothermal (Billion Btu)", "naturalgas": "Natural Gas (Mcf)", "othergas": "Other Gases (Billion Btu)", "petroleum": "Petroleum (Barrels)" };
    const energys = Object.keys(energyPairs);

    if (!energyPairs.hasOwnProperty(energyType)) {
        const message = `Error: no data for energy type ${energyType}`;
        return res.status(404).type('txt').send(message);
    }

    try {
        const data = await fs.readFile(energyPage, 'utf8');
        const query = 'SELECT * FROM "energy-consumption" WHERE type = "Total Electric Power Industry" and energy = ?';

        db.all(query, [energyPairs[energyType]], (err, rows) => {
            if (err) {
                return res.status(500).send(`Database error: ${err}`);
            }

            const response = data.toString();
            const energyIndex = energys.indexOf(energyType);
            const { previous, next } = getPrevNext(energys, energyIndex);

            let table = "";
            let yearsList = [];
            let energySourceTotals = [];

            for (let row of rows) {
                if (!yearsList.includes(row.year)) {
                    yearsList.push(row.year);
                }
                if (row.state === 'US-TOTAL' || row.state === 'US-Total') {
                    energySourceTotals.push(row.consumption);
                }
                table += buildTableRow(row.year, row.state, row.consumption);
            }

            const replacements = {
                '%%ENERGY_IMAGE%%': `/images/energy/${energyType}_logo.jpg`,
                '%%ENERGY_ALT_TEXT%%': `${rows[0].energy} highlighted on an image.`,
                '%%DATANAME%%': rows[0].energy,
                '%%PREVIOUS%%': previous,
                '%%NEXT%%': next,
                '%%DATA%%': table,
                '%%ENERGYTOTAL%%': `[${energySourceTotals}]`,
                '%%YEARSLIST%%': `[${yearsList}]`
            };

            let newResponse = response;
            for (let placeholder in replacements) {
                newResponse = newResponse.replaceAll(placeholder, replacements[placeholder]);
            }

            res.status(200).type('html').send(newResponse);
        });
    } catch (err) {
        res.status(500).send(`Error reading file: ${err}`);
    }
});


// Default state page
app.get('/state/', (req, res) => {
    res.redirect('/state/ak');
});

// Build a table row
const buildStateTableRow = (year, energy, consumption) => `<tr><td>${year}</td><td>${energy}</td><td>${consumption}</td></tr>`;

// Get previous and next states
const getPrevNextStates = (states, stateIndex) => {
    const previous = `/state/${states[(stateIndex + states.length - 1) % states.length].toLowerCase()}`;
    const next = `/state/${states[(stateIndex + 1) % states.length].toLowerCase()}`;
    return { previous, next };
};

//STATE.HTML
//URL SHOULD LOOK LIKE localhost:8000/state/ak
app.get('/state/:statename', async (req, res) => {
    const stateName = req.params.statename.toUpperCase();

    const statePage = path.join(template_dir, 'state.html');
    const states = ["AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"];

    if (!states.includes(stateName)) {
        const message = `Error: no data for state ${stateName}`;
        return res.status(404).type('txt').send(message);
    }

    try {
        const data = await fs.readFile(statePage, 'utf8');
        const query = 'SELECT * FROM "energy-consumption" WHERE type = "Total Electric Power Industry" and state=?';

        db.all(query, [stateName], (err, rows) => {
            if (err) {
                return res.status(500).send(`Database error: ${err}`);
            }

            const response = data.toString();
            const stateIndex = states.indexOf(stateName);
            const { previous, next } = getPrevNextStates(states, stateIndex);

            let table = "";
            let yearsList = [];
            let yearDict = {};

            // Prepare for the graphs
            const energies = ['Coal (Short Tons)', 'Petroleum (Barrels)', 'Natural Gas (Mcf)', 'Other Gases (Billion Btu)', 'Geothermal (Billion Btu)'];
            const energyYearTotals = energies.reduce((acc, energy) => {
                acc[energy] = new Array(32).fill(0);
                return acc;
            }, {});

            for (let row of rows) {
                if (!yearsList.includes(row.year)) {
                    yearsList.push(row.year);
                }

                if (energies.includes(row.energy)) {
                    const yearIndex = yearsList.indexOf(row.year);
                    energyYearTotals[row.energy][yearIndex] += isNaN(row.consumption) ? 0 : row.consumption;
                }

                table += buildStateTableRow(row.year, row.energy, row.consumption);
            }

            const replacements = {
                '%%STATE_IMAGE%%': `/images/state/${stateName}_logo.jpg`,
                '%%STATE_ALT_TEXT%%': `${stateName} highlighted on a map.`,
                '%%DATANAME%%': stateName,
                '%%PREVIOUS%%': previous,
                '%%NEXT%%': next,
                '%%DATA%%': table,
                '%%STATE_IMG%%': "/images/state/usatest.png",
                '%%COALTOTAL%%': `[${energyYearTotals['Coal (Short Tons)']}]`,
                '%%PETROLTOTAL%%': `[${energyYearTotals['Petroleum (Barrels)']}]`,
                '%%NATGASTOTAL%%': `[${energyYearTotals['Natural Gas (Mcf)']}]`,
                '%%OTHERGASTOTAL%%': `[${energyYearTotals['Other Gases (Billion Btu)']}]`,
                '%%GEOTOTAL%%': `[${energyYearTotals['Geothermal (Billion Btu)']}]`,
                '%%YEARSLIST%%': `[${yearsList}]`,
            };

            let newResponse = response;
            for (let placeholder in replacements) {
                newResponse = newResponse.replaceAll(placeholder, replacements[placeholder]);
            }

            res.status(200).type('html').send(newResponse);
        });
    } catch (err) {
        res.status(500).send(`Error reading file: ${err}`);
    }
});


// Default year page
app.get('/year/', (req, res) => {
    res.redirect('/year/2021');
});

// Build a year table row
const buildYearTableRow = (state, energy, consumption) => `<tr><td>${state}</td><td>${energy}</td><td>${consumption}</td></tr>`;

// Get previous and next years
const getPrevNextYears = (years, yearIndex) => {
    const previous = `/year/${years[(yearIndex + years.length - 1) % years.length]}`;
    const next = `/year/${years[(yearIndex + 1) % years.length]}`;
    return { previous, next };
};

//YEAR.HTML
//URL SHOULD LOOK LIKE localhost:8000/year/2005
app.get('/year/:year', async (req, res) => {
    const yearPage = path.join(template_dir, 'year.html');
    const year = req.params.year;
    const years = Array.from({ length: 32 }, (_, i) => (1990 + i).toString());

    if (!years.includes(year)) {
        const message = `Error: no data for year ${year}`;
        return res.status(404).type('txt').send(message);
    }

    try {
        const data = await fs.readFile(yearPage, 'utf8');
        const query = 'SELECT * FROM "energy-consumption" WHERE type = "Total Electric Power Industry" and year=?';

        db.all(query, [year], (err, rows) => {
            if (err) {
                return res.status(500).send(`Database error: ${err}`);
            }

            const response = data.toString();
            const yearIndex = years.indexOf(year);
            const { previous, next } = getPrevNextYears(years, yearIndex);

            let table = "";

            // Prepare for the graphs
            const energies = ['Coal (Short Tons)', 'Petroleum (Barrels)', 'Natural Gas (Mcf)', 'Other Gases (Billion Btu)', 'Geothermal (Billion Btu)'];
            const energyYearTotals = energies.reduce((acc, energy) => {
                acc[energy] = 0;
                return acc;
            }, {});

            for (let row of rows) {
                table += buildYearTableRow(row.state, row.energy, row.consumption);

                if (energies.includes(row.energy)) {
                    energyYearTotals[row.energy] += isNaN(row.consumption) ? 0 : row.consumption;
                }
            }

            const replacements = {
                '%%YEAR_IMAGE%%': `/images/year/${year}_logo.jpg`,
                '%%YEAR_ALT_TEXT%%': `${year} highlighted on a timeline.`,
                '%%DATANAME%%': year,
                '%%PREVIOUS%%': previous,
                '%%NEXT%%': next,
                '%%DATA%%': table,
                '%%COALTOTAL%%': energyYearTotals['Coal (Short Tons)'],
                '%%PETROLTOTAL%%': energyYearTotals['Petroleum (Barrels)'],
                '%%NATGASTOTAL%%': energyYearTotals['Natural Gas (Mcf)'],
                '%%OTHERGASTOTAL%%': energyYearTotals['Other Gases (Billion Btu)'],
                '%%GEOTOTAL%%': energyYearTotals['Geothermal (Billion Btu)']
            };

            let newResponse = response;
            for (let placeholder in replacements) {
                newResponse = newResponse.replaceAll(placeholder, replacements[placeholder]);
            }

            res.status(200).type('html').send(newResponse);
        });

    } catch (err) {
        res.status(500).send(`Error reading file: ${err}`);
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
