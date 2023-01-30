import express from 'express'
import mysql2 from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(express.static('public'));

import DB from './db.mjs';
const db = new DB();

let tables = process.env.TABLES ? JSON.parse(process.env.TABLES): null, allTables;
const idCol = process.env.ID_COLUMN || 'id'

const errors = [
    "Invalid login",
    "Database query error"
];

app.post('/login', async(req, res) => {
    try {
        await db.init(req.body.provider, { 
            host: process.env.DB_HOST,
            user: req.body.username,
            password: req.body.password, 
            database: req.body.database 
        }, idCol);

        allTables = await db.getAllTables(req.body.database);
        if(!tables) {
            tables = allTables;
        }
        res.redirect('/');
    } catch(e) {
        console.error(e);
        res.redirect('/login?error=1');
    }

});

app.post('/logout', (req, res) => {
    db.destroy();
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    const error = req.query.error > 0 && req.query.error <= errors.length ? errors[req.query.error-1] : ""; 
    res.render('login', { error: error } );
});

app.use((req, res, next) => {
    if(!db.conn) {
        res.redirect('/login');
    } else {
        next();
    }
});

app.get('/', async(req, res) => {
    const allResults = {};
    const error = req.query.error > 0 && req.query.error <= errors.length ? errors[req.query.error-1] : ""; 
    for(let table of tables) {
        try {
            allResults[table] = await db.getTableData(table); 
        } catch(e) {
            console.error(`Table ${table}: Error: ${e}`);
        }
    }
    res.render('index', { allResults: allResults, idCol: idCol, error: error, allTables: allTables } );
});

app.get('/table/:table([a-zA-Z_]+)', async(req, res) => {
    await showTable(res, req.params.table);
});

app.get('/table', async(req, res) => {
    await showTable(res, req.query.tableName);
});

app.post('/:table([a-zA-Z_]+)/row/:id(\\d+)', async(req, res)=> {
    let sql = `UPDATE ${req.params.table} SET `;
    const placeholders  = Object.keys(req.body).map(col => `${col}=?`);
    sql += placeholders.join(',') + ` WHERE ${idCol}=${req.params.id}`;
    try {
        await db.updateQuery(sql, Object.values(req.body));
        res.redirect('/');
    } catch(e) {
        console.error(e);
        res.redirect(`/?error=2`);
    }
});

app.post('/:table([a-zA-Z_]+)/row/:id(\\d+)/delete', async(req, res) => {
    try {
        await db.updateQuery(`DELETE FROM ${req.params.table} where ${idCol}=${req.params.id}`);
        res.redirect('/');
    } catch(e) {
        console.error(e);
        res.redirect(`/?error=2`);
    }
});
    
app.post('/:table([a-zA-Z_]+)/row/create', async(req, res) => {
    const cols = Object.keys(req.body);
    let sql = `INSERT INTO ${req.params.table} (` + cols.join(',') + `) VALUES (` + cols.map(col => '?').join(',') + `)`;
    try {
        await db.updateQuery(sql, Object.values(req.body));
        res.redirect('/');
    } catch(e) {
        console.error(e);
        res.redirect(`/?error=2`);
    }
});

async function showTable(res, table) {
    const allResults = {};
    try {
        allResults[table] = await db.getTableData(table);
    } catch(e) {
        console.error(e);
    }    
    res.render('index', { allResults: allResults, idCol: idCol, error: "", allTables: allTables } );
}

app.listen(3100);
