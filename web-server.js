const http = require('http');
const express = require('express');
const path = require('path');
const R = require('ramda');
const fs = require('fs');
const { exec } = require('child_process');
const { titleCase } = require('change-case');
const { locations } = require('./locations')
const { itemNames } = require('./item-names')
const { getAuctionsTableView, saveAuctions } = require('./auctions');

exec(`start http://localhost:22009/visual/`)
const isDev = process.env.ALBION_DEV || false;
// if (!isDev) {
//     console.log = () => { };
// }

const orderTypes = {
    MARKETPLACE_SELLORDER_FINISHED: "Sell",
    MARKETPLACE_BUYORDER_FINISHED: "Buy",
}

const clientView = R.pipe(
    R.map(R.pipe(
        R.converge(R.merge, [R.identity, R.applySpec({
            itemName: R.pipe(
                R.prop("ItemTypeId"),
                R.converge(R.propOr(R.__, R.__, itemNames), [R.unary(titleCase), R.identity]),
            ),
        })]),
        R.evolve({
            location: R.converge(R.propOr(R.__, R.__, locations), [R.identity, R.identity]),
            message_type_name: R.prop(R.__, orderTypes),
        }),
    )),
    R.values,
    R.reverse,
)

const tableView = R.pipe(
    clientView,
    R.values,
    R.map(R.pipe(
        R.omit(["rest"]),
        R.values
    )),
    R.concat([[
        "Id",
        "Location",
        "Type",
        "Another Id",
        "Buyer Name",
        "Item Type Id",
        "Amount",
        "Unit Price Silver",
        "Total After Taxes",
        "Name",
    ]]),
    R.map(R.join("\t")),
    R.join("\n"),
)

const combineDB = R.mergeWith(R.merge);

const finalParser = R.pipe(
    R.groupBy(R.head),
    R.evolve({
        readMail: R.pipe(
            R.groupBy(R.path([1, "Id"])),
            R.map(R.path([0, 1])),
        ),
        getMailInfo: R.pipe(
            R.map(R.path([1])),
            R.mergeAll, // Dedup step
        )
    }),
    R.values,
    ([x, y]) => combineDB(x || {}, y || {}),
);

const dbReducer = (previous, next) => combineDB(previous, finalParser(next))

let db = {};
let update = {};
let updateID = Math.random();

const app = express();

const autoSave = () => {
    save(() => { }, true);
    setTimeout(() => {
        autoSave();
    }, 2000);
}

module.exports.receiveMessage = ([channel, body]) => {
    if (channel === "readMail" || channel === "getMailInfo") {
        const entry = [channel, body];
        db = dbReducer(db, [entry]);
        updateID = Math.random();
        // database.push(entry);
        // console.log(entry[0], JSON.stringify(entry[1], undefined, 3));
    }
}

app.use("/visual", express.static(path.join(__dirname, "/static")));

app.use((req, res) => {

    if (req.url === '/save') {
        return save(() => res.end("saved!"));
    }

    if (req.url.substr(0, '/view'.length) === '/view') {
        if (update[req.url] === updateID) {
            res.status(304);
            res.end();
            return;
        }
        update[req.url] = updateID;
        res.end(
            JSON.stringify(clientView(db))
        );
        return;
    }

    if (req.url === '/database') {
        res.end(JSON.stringify(db));
        return;
    }

    if (req.url === '/table') {
        res.end(tableView(db));
        return;
    }

    if (req.url === '/table-auctions') {
        res.end(getAuctionsTableView());
        return;
    }

    if (req.url === '/shutdown') {
        save(() => {
            saveAuctions(() => {
                res.end("Shutting down");
                process.exit(0);
            })
            // save(() => {
            // }, true);
        });
        return;
    }
    res.end();
});

const server = http.createServer(app);

const dataDir = process.cwd();

const save = (then = () => { }, bak = false) => {
    fs.writeFile(path.join(dataDir, bak ? "./database.bak.json" : "./database.json"), JSON.stringify(db), (e) => {
        e ? console.error(e) : void 0;
        then()
    });
};

const load = () => {
    fs.readFile(path.join(dataDir, "./database.json"), (e, data) => e ?
        console.error(e) : (
            db = JSON.parse(data.toString()),
            updateID = Math.random(),
            autoSave()
        )
    );
}

load();

//graceful shutdown
process.on("SIGINT", function () {
    save(() => {
        process.exit();
    });
});

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

const hostname = '127.0.0.1';
const port = 22009;
server.listen(port, hostname, () => {
    console.log("Server listening on ", hostname, port)
});
