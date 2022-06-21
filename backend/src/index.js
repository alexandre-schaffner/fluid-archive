async function main () {
  require('dotenv').config()
  const auth = require('./routes/auth/auth')
  const db = require('./database/db')
  const express = require('express')
  const fs = require('fs')
  const getLastLikedVideo = require('./middlewares/getLastLikedVideo')
  const putInUsersMap = require('./middlewares/putInUsersMap')
  const sync = require('./routes/sync')
  const app = express()

  try {
    const credentials = JSON.parse(fs.readFileSync('secret/oauth2Secret.json'))
    const dbName = process.env.DB_NAME
    const url = process.env.DB_URL
    const fluidDB = await db.connectToDB(url, dbName)
    const port = process.env.PORT
    const usersCollection = fluidDB.collection('users')
    const usersMap = new Map()

    const results = await usersCollection.find({ sync: true }, { projection: { _id: 1 } })
    for await (const user of results) {
      try {
        await putInUsersMap(credentials, user._id, usersMap, usersCollection)
      } catch (err) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: { sync: false }
          }
        )
      }
    }
    console.log(usersMap)

    app.use(express.json())

    sync(app, credentials, usersCollection, usersMap)
    auth(app, usersCollection, credentials, usersMap)
    setInterval(async (usersMap) => {
      if (usersMap.size) {
        // console.log(usersMap)
        for await (const [key, value] of usersMap.entries()) {
          await getLastLikedVideo(value.google.oauth2Client, value.google.accessToken)
        }
      }
    }, 5000, usersMap)
    // setInterval, checkNewSongs(usersMap)

    app.listen(port, function () {
      console.log('Platify listening at http://localhost:' + port)
    })
  } catch (err) {
    console.error(err)
  }
}

main()
