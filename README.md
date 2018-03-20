nodebb-plugin-import-luna
========================

a UBB forum exporter to be required by [nodebb-plugin-import](https://github.com/akhoury/nodebb-plugin-import).

### What is this?

It's __just__ an exporter of Luna,  that provides an API that [nodebb-plugin-import](https://github.com/akhoury/nodebb-plugin-import)
can use to exporter source forum data and import it to NodeBB's database. So, it's not really a conventional nodebb-plugin.

### Why is it even a NodeBB plugin?

it doesn't really need to be, nor that you can use it within NodeBB it self, but, having this as a plugin have few benefits:
* a nodebb- namespace, since you can't really use it for anything else
* it can easily `require` NodeBB useful tools, currently

### Usage within NodeJS only

```
// you don't have to do this, nodebb-plugin-import will require this plugin and use its api
// but if you want a run a test

var exporter = require('nodebb-plugin-import-ubb');

exporter.testrun({
    dbhost: '127.0.0.1',
    dbport: 3306,
    dbname: 'ubb',
    dbuser: 'user',
    dbpass: 'password',

    tablePrefix: 'ubbt_'
}, function(err, results) {

    /*
        results[0] > config
        results[1] > [usersMap, usersArray]
        results[2] > [categoriesMap, categoriesArray]
        results[3] > [topicsMap, topicsArray]
        results[4] > [postsMap, postsArray]
    */
});

```


### Markdown note

read [nodebb-plugin-import#markdown-note](https://github.com/akhoury/nodebb-plugin-import#markdown-note)

### It's an exporter, why does it have 'import' in its title

To keep the namespacing accurate, this __exporter__ is designed to export data for [nodebb-plugin-import](https://github.com/akhoury/nodebb-plugin-import) only, also for a 1 time use, so why do you care.

