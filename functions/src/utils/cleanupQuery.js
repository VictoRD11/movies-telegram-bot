export default (query) => query.replace(/[^a-zA-Z0-9\u0400-\u04FF]+/g, ' ').trim()