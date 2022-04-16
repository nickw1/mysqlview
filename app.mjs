import express from 'express'
import mysql2 from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.set('view engine', 'ejs');

const con = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DBASE
});

const tables = JSON.parse(process.env.TABLES);

/* How you can obtain all tables in the database
const [results, fields] = await con.query(`SELECT * FROM information_schema.tables AS t WHERE table_schema='${process.env.DB_DBASE}'`);
const tables = results.map(result => result.TABLE_NAME);
*/

app.get('/', async(req, res) => {
    
    const allResults = {};
    for(let table of tables) {
        const [results, fields] = await con.query(`SELECT * FROM ${table} ORDER BY id`);
        const fieldNames = fields.map (fieldInfo => fieldInfo.name);
        allResults[table] = { results: results, fieldNames: fieldNames };    
    }
    res.render('index', { allResults: allResults} );
});

app.listen(3100);
