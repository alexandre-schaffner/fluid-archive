module.exports.connectToDB = (url, dbName) => {
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(url, { useUnifiedTopology: true })

  client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  return (db)
}
