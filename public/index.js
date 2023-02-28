let idCol = 'id';

function LoginForm({onLogin, onLogout, loginStatus}) {
    
    const [loggedIn,setLoggedIn] = React.useState(loginStatus);
    const [error,setError] = React.useState("");
    const [provider,setProvider] = React.useState("mysql");
    const usernameAndPassword = provider=='mysql' ? <div>
        Username:<br />
        <input name="username" id='username' defaultValue="ephp001"/><br />
        Password:<br />
        <input name="password" id='password' type="password" /><br />
		</div> : "";
    const content = loggedIn ? 
        <div><input type='button' id='logout' value='logout' onClick={logout} /></div> :
        <div><h1>Login</h1><p className='error'>{error}</p>
        <div>Database Provider: 
        <select name="provider" id="provider" defaultValue={provider} onChange={updateProvider}>
        <option value='sqlite'>SQLite</option>
        <option value='mysql'>MySQL</option>
        </select><br />
		{usernameAndPassword}
        Database: <br />
        <input name="database" id='database' defaultValue="ephp001"/><br />
        <input type="button" onClick={login} value="Go!" />
        </div></div> ;

    function updateProvider() {
        setProvider(document.getElementById('provider').value);
    }

    async function login() {
        const data = provider == 'mysql' ? {
            provider : provider, 
            database : document.getElementById('database').value,
            username : document.getElementById('username').value,
            password : document.getElementById('password').value
        } : {
            provider : provider,
            database : document.getElementById('database').value,
        };

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        });
        if(response.status == 200) {
            setLoggedIn(true);
            setError("");
            onLogin(await response.json());
        } else {
            setError("Invalid login");
        }
    }

    async function logout() {
        const response = await fetch('/logout', {
            method: 'POST'
        });
        if(response.status == 200) {
            setLoggedIn(false);
            onLogout();
        }
    }
    return content;
}

function TableChooser({tableList, onChange}) {
    const options = tableList.map (table => <option key={'table'+table}>{table}</option>);
    return <select id="tableName" onChange={onChange}>
        <option>--Select--</option>
        {options}
        </select>;
}

function TableHead({fieldNames}) {
    const headers = fieldNames.filter(field => field != idCol).map (field => <th key={'header'+field}>{field}</th>); 
    return <tr><th>{idCol}</th>{headers}</tr>;
}

function TableRow({table, row, oddeven, onUpdate, onDelete}) {
    const cols = Object.keys(row).filter(k => k != idCol).map ( k => {
        return <td key={row[idCol]+k}><input name={k} id={k+'-'+row[idCol]} type='text' defaultValue={row[k]} /></td>;
    });
    return <tr className={oddeven}><td>{row[idCol]}</td>{cols}<td><input type='button' value='update' onClick={onUpdate.bind(this,table,row[idCol])} /></td><td><input type='button' value='delete' onClick={onDelete.bind(this,table,row[idCol])} /></td></tr>;
}



function ResultsTable({table, fullTableDetails, onUpdate, onDelete}) {

    const rows = Object.values(fullTableDetails.results);

    let tableRows = rows.map ( (row,i) => <TableRow row={row} oddeven={i%2 ? "odd":"even"} onUpdate={onUpdate} onDelete={onDelete} table={table} key={'row='+row[idCol]}/> );
    return <table>
        <thead>
        <TableHead key={table+'tableHead'} fieldNames={fullTableDetails.fieldNames} />
        </thead>
        <tbody>
        {tableRows}
        </tbody>
        </table>;
}

function InputNewRecord({table, tableData, onAdd}) {
    const inputs = tableData.fieldNames.filter(field => field != idCol).map (field => {
        return <tbody key={field+'-tbody'}><tr>
        <td><label htmlFor={field}>{field}</label></td>
        <td><input name={field} id={field+'-new'} type='text' /></td>
        </tr></tbody>;
    });

    return <div><h3>Create new record</h3>
        <table>
        {inputs}
        </table>
        <input type='button' value='Create record!' onClick={onAdd.bind(this,table)} />
        </div>;
}

function AllTables({allResults, onAdd, onUpdate, onDelete}) {

     const allTables = Object.keys(allResults).map (table => 
        <div key={table+'-div'}>
        <h2>Table {table}</h2>
        <ResultsTable table={table} fullTableDetails={allResults[table]} onUpdate={onUpdate} onDelete={onDelete} />
        <InputNewRecord table={table} tableData={allResults[table]} onAdd={onAdd} />
        </div>
    );
    return <div>{allTables}</div>;
}


function App({loginStatus, tables}) {

    const [results,setResults] = React.useState([]);
    const [selectedTable, setSelectedTable] = React.useState(null);
    const [tableList, setTableList] = React.useState(tables);
    const [loggedIn, setLoggedIn] = React.useState(loginStatus);
    const [error, setError] = React.useState("");
    let allTables=null;
//    ajaxSearch(table);

    React.useEffect(() => {
        if(loggedIn && selectedTable === null) { 
            ajaxSearch(true);
        }
    });

    async function ajaxSearch(showAllTables=false) {
        const sTable = document.getElementById('tableName').value !== '--Select--';    
        if(!sTable || showAllTables) {
            const table = !sTable ? null : document.getElementById('tableName').value;
            const json = table ? await fetch(`/table/${table}`).then(response => response.json()) : await fetch('/allTables').then(response => response.json());
            if(json.error) {
                setError(`Error with table ${table}: ${json.error.message}`);
                setResults({});
            } else {
                let res = { };
                if(table) {
                    res[table] = json; 
                } else {
                    res = json;
                }
                setSelectedTable(showAllTables ? "" : table);
                setResults(res);
                setError("");
            } 
        }
    }

    async function onAdd(table) {
        const details = { };
        results[table].fieldNames.filter(key => key != idCol).forEach ( col=> {
            details[col] = document.getElementById(`${col}-new`).value
        });
        const results2 = await fetch(`/${table}/row/create`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            }, body: JSON.stringify(details)
        }).then(response => response.json());

        details[idCol] = results2.id;
    
        const res = structuredClone(results);
        res[table].results[results2.id] = details;
        setResults(res);
    }

    async function onUpdate(table, id, e) {
        const details = { };
        results[table].fieldNames.filter(key => key != idCol).forEach ( col=> {
            details[col] = document.getElementById(`${col}-${id}`).value
        });
        details[idCol] = id;


        
        const results2 = await fetch(`/${table}/row/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            }, body: JSON.stringify(details)
        }).then(response => response.json());

        const res = structuredClone(results);
        res[table].results[id] = structuredClone(details);
        setResults(res);
    }

    async function onDelete(table, id, e) {
        const results2 = await fetch(`/${table}/row/${id}`, {
            method: 'DELETE'
        }).then(response => response.json());
        const res = structuredClone(results);
        delete res[table].results[id];
        setResults(res);
    }

    async function onLoggedIn(response) {
        setTableList(response.tables);    
        idCol = response.idCol;
        setLoggedIn(true);
    }

    async function onLoggedOut() {
        console.log('onLoggedOut()');
        setTableList([]);
        setLoggedIn(false);
    }

    const loginForm = <LoginForm onLogin={onLoggedIn} onLogout={onLoggedOut} loginStatus={loggedIn} />;
    return loggedIn ? <div>{loginForm}<h2>Table Chooser</h2><TableChooser onChange={ajaxSearch} tableList={tableList} /><h2>All Tables</h2><p className='error'>{error}</p><AllTables allResults={results} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd}/></div> : <div>{loginForm}</div>;
}

const root = ReactDOM.createRoot(
    document.getElementById('root')
);

fetch('/login').then(response => response.json()).then(response => {
    idCol = response.idCol;
    root.render(<App loginStatus={response.loggedIn} tables={response.tables} />)
});
