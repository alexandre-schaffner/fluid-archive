module.exports.connectToDB = async (url, dbName) => {
  const credentials = 'secret/X509-cert-431020356886184745.pem'
  const { MongoClient, ServerApiVersion } = require('mongodb')
  const client = new MongoClient(url, {
    sslKey: credentials,
    sslCert: credentials,
    serverApi: ServerApiVersion.v1,
    useUnifiedTopology: true
  })

  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  return (db)
}
