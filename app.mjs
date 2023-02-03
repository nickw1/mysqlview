import express from 'express';
import mysql2 from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(express.static('public'));
app.use(express.json());

import DB from './db.mjs';
const db = new DB();

let tables = process.env.TABLES ? JSON.parse(process.env.TABLES): null, allTables;
const idCol = 'id';

app.post('/login', async(req, res) => {
    try {
        await db.init(req.body.provider, { 
            host: process.env.DB_HOST,
            user: req.body.username,
            password: req.body.password, 
            database: req.body.database 
        }, idCol);

        allTables = await db.getAllTables(req.body.database||null);
        if(!tables) {
            tables = allTables;
        }
        res.json(tables);
    } catch(e) {
        res.status(401).json({error:e});
    }

});

app.get('/login', (req, res) => {
    res.json({loggedIn: db.conn ? true: false, tables: tables || []});
});

app.post('/logout', (req, res) => {
    db.destroy();
    tables = null;
    res.json({success: 1});
});

app.use((req, res, next) => {
    if(!db.conn) {
        res.status(401).json({error: 'Need to have a valid database connection.'});
    } else {
        next();
    }
});

app.get('/allTables', async(req, res) => {
    const allResults = {};
    for(let table of tables) {
        try {
            allResults[table] = await db.getTableData(table); 
        } catch(e) {
            console.error(`Table ${table}: Error: ${e}`);
        }
    }
    res.json(allResults);
});

app.get('/table/:table([a-zA-Z_]+)', async(req, res) => {
    res.json(await showTable(res, req.params.table));
});

app.get('/table', async(req, res) => {
    res.json(await showTable(res, req.query.tableName));
});

app.post('/:table([a-zA-Z_]+)/row/:id(\\d+)', async(req, res)=> {
    let sql = `UPDATE ${req.params.table} SET `;
    const placeholders  = Object.keys(req.body).map(col => `${col}=?`);
    sql += placeholders.join(',') + ` WHERE ${idCol}=${req.params.id}`;
    try {
        await db.updateQuery(sql, Object.values(req.body));
        res.json({success:1});
    } catch(e) {
        console.error(e);
        res.json({error:e});
    }
});

app.delete('/:table([a-zA-Z_]+)/row/:id(\\d+)', async(req, res) => {
    try {
        await db.updateQuery(`DELETE FROM ${req.params.table} where ${idCol}=${req.params.id}`);
        res.json({success:1});
    } catch(e) {
        console.error(e);
        res.json({error:e});
    }
});
    
app.post('/:table([a-zA-Z_]+)/row/create', async(req, res) => {
    const cols = Object.keys(req.body);
    let sql = `INSERT INTO ${req.params.table} (` + cols.join(',') + `) VALUES (` + cols.map(col => '?').join(',') + `)`;
    try {
        const results = await db.updateQuery(sql, Object.values(req.body));
        res.json({id: results.insertId});
    } catch(e) {
        console.error(e);
        res.json({error:e});
    }
});

async function showTable(res, table) {
    const allResults = {};
    try {
        return await db.getTableData(table);
    } catch(e) {
        console.error(e);
        res.json({error:e});
    }    
}

app.listen(3100);

