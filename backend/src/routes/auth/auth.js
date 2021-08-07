
module.exports = function (app, db, credentials, oauth2ClientMap) {
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
    res.send('Successfully logged in')
  })

  app.get('/oauth2callback', function (req, res) {
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
        res.send('Sorry, an error occured')
      }
    } else {
      oauth2Client.getToken(code, (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err)
        } else {
          oauth2Client.setCredentials(token)
          oauth2Client.getTokenInfo(oauth2Client.credentials.access_token).then((infos, err) => {
            if (err) {
              console.log(err)
            } else {
              collection.updateOne(
                { 'logins.email': infos.email },
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
              ).then((resolve, error) => {
                if (error) {
                  throw error
                } else {
                  oauth2ClientMap.set(infos.sub, oauth2Client)
                }
              })
            }
          })
        }
      })
      res.redirect('/logged')
    }
  })
}
