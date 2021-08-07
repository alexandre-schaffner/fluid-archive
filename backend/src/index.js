function main () {
  require('dotenv').config()
  const express = require('express')
  const url = process.env.DB_URL
  const dbName = process.env.DB_NAME
  const port = process.env.PORT
  const fs = require('fs')
  const connectToDB = require('./database/db')
  const db = connectToDB(url, dbName)
  const app = express()
  const auth = require('./routes/auth/auth')
  const oauth2ClientMap = new Map()

  app.use(express.json())

  fs.readFile(
    'secret/oauth2Secret.json',
    function (err, data) {
      if (err) {
        console.log('Failed to open client secret file: ' + err)
        return
      }
      auth(app, db, JSON.parse(data), oauth2ClientMap)
    }
  )

  app.listen(port, function () {
    console.log('Platify listening at http://localhost:' + port)
  })
}

main()
