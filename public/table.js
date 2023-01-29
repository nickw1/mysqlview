
const idCol = 'ID';

function TableChooser({tableList, onChange}) {
    const options = tableList.map (table => <option key={'table'+table}>{table}</option>);
    return <select id="tableName" onChange={onChange}>
        <option>--Select--</option>
        {options}
        </select>;
}

function TableHead({fieldNames}) {
    const headers = fieldNames.map (field => <th key={'header'+field}>{field}</th>); 
    return <tr>{headers}</tr>;
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


function App({tableList, table}) {

    console.log('App()');
    const [results,setResults] = React.useState([]);
    const [selectedTable, setSelectedTable] = React.useState(table);
    let allTables=null;
//    ajaxSearch(table);

    async function ajaxSearch() {
        const table = (document.getElementById('tableName').value == '--Select--' ? null: document.getElementById('tableName').value);
        const allTables = table ? await fetch(`/table/${table}`).then(response => response.json()) : await fetch('/allTables').then(response => response.json());
        console.log(`allTables`);
        console.log(allTables);
        let res = { };
        if(table) {
            res[table] = allTables;
        } else {
            res = allTables;
        }
        setSelectedTable ( table );
        setResults(res);
    }

    async function onAdd(table) {
        const details = { };
        results[table].fieldNames.filter(key => key != idCol).forEach ( col=> {
            details[col] = document.getElementById(`${col}-new`).value
        });
        console.log('onAdd()');
        console.log(details);
        const results2 = await fetch(`/${table}/row/create`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            }, body: JSON.stringify(details)
        }).then(response => response.json());

        console.log(results2);
        details[idCol] = results2.id;
    
        console.log(results[table]);
        const res = structuredClone(results);
        res[table].results[results2.id] = details;
        setResults(res);
    }

    async function onUpdate(table, id, e) {
        const details = { };
        results[table].fieldNames.filter(key => key != idCol).forEach ( col=> {
            console.log(`${col}-${id}`);
            details[col] = document.getElementById(`${col}-${id}`).value
        });
        details[idCol] = id;

        console.log('onUpdate()');
        console.log(details);

        
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
    return <div><h2>Table Chooser</h2><TableChooser onChange={ajaxSearch} tableList={tableList} /><h2>All Tables</h2><AllTables allResults={results} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd}/></div>;

}

const root = ReactDOM.createRoot(
    document.getElementById('tableHolder')
);

const tableList = ['accommodation','acc_dates','acc_users'];
root.render(<App tableList={tableList} table='accommodation' />)
