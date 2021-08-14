module.exports = async function (app, db, credentials, oauth2ClientMap) {
  const user = require('../../middlewares/user')
  const { google } = require('googleapis')
  const OAuth2 = google.auth.OAuth2

  app.post('/register', function (req, res) {
    user.register(req, res, db, credentials, oauth2ClientMap)
  })

  app.post('/login', function (req, res) {
    user.login(req, res, db)
  })

  app.get('/logged', function (req, res) {
    res.send('Credentials are correct')
  })

  app.get('/oauth2callback', async function (req, res) {
    const collection = db.collection('users')
    const code = req.query.code
    const oauth2Client = new OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      credentials.web.redirect_uris)

    if (req.query.error) {
      if (req.query.error === 'access_denied') {
        res.send('You need to authorize the app to use it')
      } else {
        res.send('Sorry, an error occured: ' + req.query.error)
      }
    } else {
      try {
        oauth2Client.getToken(code, async (err, token) => {
          if (err) {
            throw new Error(err)
          } else {
            oauth2Client.setCredentials(token)
            const infos = await oauth2Client.getTokenInfo(oauth2Client.credentials.access_token)
            console.log(oauth2Client.credentials)
            await collection.updateOne(
              { _id: infos.email },
              {
                $set: {
                  google: {
                    userId: infos.sub,
                    tokens: {
                      accessToken: oauth2Client.credentials.access_token,
                      refreshToken: oauth2Client.credentials.refresh_token
                    }
                  }
                }
              }
            )
            oauth2ClientMap.set(infos.sub, oauth2Client)
            res.redirect('/logged')
          }
        })
      } catch (err) {
        res.send(err)
        console.error(err)
      }
    }
  })
}
