module.exports = function (app, usersCollection, credentials, usersMap) {
  const user = require('../../middlewares/user')
  const getUserId = require('../../database/getUserId')
  const getLastLikedVideo = require('../../middlewares/getLastLikedVideo')
  const { google } = require('googleapis')
  const OAuth2 = google.auth.OAuth2

  app.post('/auth/register', function (req, res) {
    user.register(req, res, usersCollection)
  })

  app.get('/auth/authorized', (req, res) => {
    res.send('Authorization successful!')
  })

  app.post('/auth/login', function (req, res) {
    user.login(req, res, usersCollection)
  })

  app.post('/auth/google', (req, res) => {
    user.googleAuth(req, res, credentials, usersCollection)
  })
  app.post('/auth/deezer', (req, res) => {
    user.deezerAuth(req, res, usersCollection)
  })

  app.post('/auth/deezer_token', (req, res) => {
    user.getDeezerToken(req, res, usersCollection, usersMap)
  })

  app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code
    const oauth2Client = new OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      credentials.web.redirect_uris)

    try {
      if (req.query.error) {
        if (req.query.error === 'access_denied') {
          throw new Error('You need to authorize the app to use it')
        } else {
          throw new Error('Sorry, an error occured: ' + req.query.error)
        }
      }
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)
      const infos = await oauth2Client.getTokenInfo(oauth2Client.credentials.access_token)
      await usersCollection.updateOne(
        { email: infos.email },
        {
          $set: {
            google: {
              userId: infos.sub,
              tokens: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token
              }
            }
          }
        }
      )
      const mongoId = await getUserId(usersCollection, infos.email)
      const stringId = mongoId.toHexString()
      const lastLikedVideo = await getLastLikedVideo(oauth2Client, tokens.access_token)
      if (usersMap.get(stringId) === undefined) {
        usersMap.set(stringId, {
          google: {
            oauth2Client,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
          },
          lastLikedVideo /*,
          sync: false */
        })
      } else {
        usersMap.set(stringId, {
          google: {
            oauth2Client,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
          },
          lastLikedVideo,
          platform: usersMap.get(stringId).platform /*,
          sync: usersMap.get(stringId).platform !== undefined */
        })
      }
      console.log('Google', usersMap)
      res.redirect('/auth/authorized')
    } catch (err) {
      res.send(err.message)
      console.error(err)
    }
  })

  app.get('/deezercallback', (req, res) => {
    res.redirect('/auth/authorized')
  })
}
