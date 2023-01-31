import mysql2 from 'mysql2/promise';
import Database from 'better-sqlite3';

class DB {

    async init(provider, params, idCol='id') {
        try {
            this.provider = provider;
            this.conn = await this.initDB(params);
            this.idCol = idCol;
        } catch(e) {
            this.conn = null;
            throw e;
        }
    }

    async initDB(params) {
        switch(this.provider) {
            case "mysql":
                return await mysql2.createConnection({
                    host: params.host,
                    user: params.user,
                    password: params.password,
                    database: params.database
                });
                break;

            case "sqlite":
                return new Database(params.database);
        }
        return null; 
    }

    async selectQuery(sql, params=[]) {
        switch(this.provider) {
            case "mysql":
                const [results, fields] = await this.conn.execute(sql, params);
                return results;
                break;

            case "sqlite":
                return this.conn.prepare(sql).all(params);
                break;
        }
    }

    async updateQuery(sql, params=[]) {
        switch(this.provider) {
            case "mysql":
                const [results, fields] = await this.conn.execute(sql, params);
                return results.affectedRows;
                break;

            case "sqlite":
                const info = this.conn.prepare(sql).run(params);
                return info.changes;
                break;
        }
    }

    async getAllTables(database) {
        switch(this.provider) {
            case "mysql":
                const [results, fields] = await this.conn.execute(`SELECT * FROM information_schema.tables AS t WHERE table_schema='${database}'`);
                return results.map(result => result.TABLE_NAME);
                break;

            case "sqlite":
                const stmt = this.conn.prepare("SELECT tbl_name FROM sqlite_master WHERE type='table' ORDER BY tbl_name");
                const results2 = stmt.all();
                console.log(results2);
                return results2.map(row => row.tbl_name);
                break;
        }
    }

    async getTableData(table) {
        const data = {
            results: [], 
            fieldNames: []
        };

        switch(this.provider) {
            case "mysql":
                const [results, fields] = await this.conn.execute(`SELECT * FROM ${table} ORDER BY ${this.idCol}`);
                data.fieldNames = fields.map(fieldInfo => fieldInfo.name);
                data.results = results;
                break;
            
            case "sqlite":
                data.fieldNames = this.conn.prepare(`pragma table_info(${table})`).all().map (fieldInfo => fieldInfo.name);
                data.results = this.conn.prepare(`SELECT * FROM ${table} ORDER BY ${this.idCol}`).all();
                break;
        }
        return data; 
    }

    destroy() {
        switch(this.provider) {
            case "mysql":
                this.conn.destroy();
                break;
            
        }
        this.conn = null;
    }
}

export default DB;
