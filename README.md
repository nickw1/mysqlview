# Node MySQL visualiser

An extremely simple Node and Express-based visualiser and editor for a MySQL database.
Settings should be specified in `.env` (an example is supplied):

- `DB_HOST` - database host machine, usually `localhost`
- `ID_COLUMN` - the column to use for the ID.
- `TABLES` - the tables you want to visualise in JSON array format, e.g

```
TABLES=["wadsongs","ht_users"]
```

It is assumed that all tables use the same column name for the ID, specified with the `ID_COLUMN` setting. 


## Installing and running

```
npm install
npm start 
```

then access via

```
http://localhost:3100
```
