# Node MySQL visualiser

An extremely simple Node and Express-based visualiser for a MySQL database.
Settings should be specified in `.env`:

- `DB_HOST` - database host machine, usually `localhost`
- `DB_USER` - database user
- `DB_PASS` - database password
- `DB_DBASE` - database name
- `TABLES` - the tables you want to visualise in JSON array format, e.g

```
TABLES=["wadsongs","ht_users"]
```

It is assumed that the tables contain an `id` column as they will be ordered by ID. If not, the server will fail!


## Installing and running

```
npm install
npm start 
```

then access via

```
http://localhost:3100
```
