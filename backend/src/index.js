const { default: axios } = require('axios')

async function main () {
  require('dotenv').config()
  const auth = require('./routes/auth/auth')
  const db = require('./database/db')
  const express = require('express')
  const fs = require('fs')
  const getLastLikedVideo = require('./middlewares/getLastLikedVideo')
  const putInUsersMap = require('./middlewares/putInUsersMap')
  const getTrackID = require('./middlewares/getTrackID')
  const extractArtistTitle = require('./middlewares/extractArtistTitle')
  const managePlaylist = require('./routes/managePlaylist')
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
        console.log(usersMap)
      } catch (err) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: { sync: false }
          }
        )
      }
    }
    // console.log(usersMap)

    app.use(express.json())

    sync(app, credentials, usersCollection, usersMap)
    auth(app, usersCollection, credentials, usersMap)
    managePlaylist(app, credentials, usersCollection, usersMap)
    setInterval(async (usersMap) => {
      if (usersMap.size) {
        for await (const [key, value] of usersMap.entries()) {
          try {
            const lastLikedVideo = await getLastLikedVideo(value.google.oauth2Client, value.google.accessToken)
            if (lastLikedVideo !== usersMap.get(key).lastLikedVideo) {
              const desc = extractArtistTitle(lastLikedVideo)
              const trackID = await getTrackID(desc)
              console.log('artist: ' + desc.artist.original + ', title: ' + desc.title.formated + ', track id: ' + trackID)
              await axios.post('https://api.deezer.com/playlist/' + value.platform.playlist + '/tracks', null, {
                params: {
                  access_token: value.platform.accessToken,
                  songs: trackID
                }
              })
              usersMap.set(key, {
                google: usersMap.get(key).google,
                platform: usersMap.get(key).platform,
                lastLikedVideo
              })
              console.log(usersMap)
            }
          } catch (err) {
            console.error(err.message)
          }
        }
      }
    }, 5000, usersMap)

    app.listen(port, function () {
      console.log('Fluid listening at http://localhost:' + port)
    })
  } catch (err) {
    console.error(err)
  }
}

main()
