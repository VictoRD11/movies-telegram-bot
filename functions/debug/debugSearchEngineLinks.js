const extractSearchEngineQuery = require('../src/utils/extractSearchEngineQuery')

extractSearchEngineQuery('https://g.co/kgs/7VVFfF')
    .then((it) => console.log(it)) // eslint-disable-line no-console