var couchbase = require("couchbase");
var fs = require('fs');

var dbConfigFilename = '../settings/db-config.json';
var anonymousDbConfigFilename = '../settings/anonymous-db-config.json';

db = {
    enabled: false
}; 

db.playerTemplate = { 
    id: "",
    username: "",
    level: 1,
    defence_xp: 1,
    attack_xp: 1,
    kingdom: {
        theme: {
            background: "assets/img/background_map_5.png"
        }
    }
};

db.isValidPlayerObject = function(playerObject) {
    return true;
}

dbConfig = JSON.parse(fs.readFileSync(dbConfigFilename));
anonymousDbConfig = JSON.parse(fs.readFileSync(anonymousDbConfigFilename));

couchbase.connect(dbConfig, function(err, bucket) {
    if (err) {
        throw err;
    }
    db.bucket = bucket;
});

couchbase.connect(anonymousDbConfig, function(err, bucket) {
    if (err) {
        throw err;
    }
    db.anonymousBucket = bucket;
});
