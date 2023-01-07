import express from 'express'
import mysql2 from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(express.static('public'));

let con, tables = process.env.TABLES ? JSON.parse(process.env.TABLES): null;
const idCol = process.env.ID_COLUMN || 'ID'



app.post('/login', async(req, res) => {
    try {
        con = await mysql2.createConnection({
            host: process.env.DB_HOST,
            user: req.body.username,
            password: req.body.password, 
            database: req.body.database 
        });
        if(!tables) {
            const [results, fields] = await con.execute(`SELECT * FROM information_schema.tables AS t WHERE table_schema='${req.body.database}'`);
            tables = results.map(result => result.TABLE_NAME);
        }
        res.redirect('/');
    } catch(e) {
        console.error(e);
        res.redirect('/login.html');
    }
});

app.post('/logout', (req, res) => {
    console.log('Ending');
    con.destroy();
    con = null;
    res.redirect('/login.html');
});

app.use((req, res, next) => {
    if(!con) {
        res.redirect('/login.html');
    } else {
        next();
    }
});

app.get('/', async(req, res) => {
    const allResults = {};
    req.query.error = req.query.error || "";
    for(let table of tables) {
        try {
            const [results, fields] = await con.execute(`SELECT * FROM ${table} ORDER BY id`);
            const fieldNames = fields.map (fieldInfo => fieldInfo.name);
            allResults[table] = { results: results, fieldNames: fieldNames };    
        } catch(e) {
            req.query.error += `Table ${table}: Error: ${e}`;
        }
    }
    res.render('index', { allResults: allResults, idCol: idCol, error: req.query.error } );
});



app.post('/:table([a-zA-Z_]+)/row/:id(\\d+)', async(req, res)=> {
    let sql = `UPDATE ${req.params.table} SET `;
    const placeholders  = Object.keys(req.body).map(col => `${col}=?`);
    sql += placeholders.join(',') + ` WHERE ${idCol}=${req.params.id}`;
    try {
        const [results, fields] = await con.execute(sql, Object.values(req.body));
        res.redirect('/');
    } catch(e) {
        res.redirect(`/?error=${e.message}, caused by "${e.sql}"`);
    }
});

app.post('/:table([a-zA-Z_]+)/row/:id(\\d+)/delete', async(req, res) => {
    try {
        const [results, fields] = await con.execute(`DELETE FROM ${req.params.table} where ${idCol}=${req.params.id}`);
        res.redirect('/');
    } catch(e) {
        res.redirect(`/?error=${e.message}, caused by "${e.sql}"`);
    }
});
    
app.post('/:table([a-zA-Z_]+)/row/create', async(req, res) => {
    const cols = Object.keys(req.body);
    let sql = `INSERT INTO ${req.params.table} (` + cols.join(',') + `) VALUES (` + cols.map(col => '?').join(',') + `)`;
    try {
        const [results, fields] = await con.execute(sql, Object.values(req.body));
        res.redirect('/');
    } catch(e) {
        res.redirect(`/?error=${e.message}, caused by "${e.sql}"`);
    }
});

app.listen(3100);
