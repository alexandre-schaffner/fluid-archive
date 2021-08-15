module.exports = async function (app, db, credentials, oauth2ClientMap) {
  const user = require('../../middlewares/user')
  const { google } = require('googleapis')
  const { SignJWT } = require('jose/jwt/sign')
  const crypto = require('crypto')
  const querystring = require('querystring')
  const https = require('https')
  const collection = db.collection('users')
  const OAuth2 = google.auth.OAuth2

  app.get('/ready', (req, res) => {
    res.send('You are now ready to use fluid ! Enjoy ;)')
  })

  app.post('/register', function (req, res) {
    user.register(req, res, db, credentials, oauth2ClientMap)
  })

  app.get('/deezer_auth', (req, res) => {
    user.deezerAuth(req, res, oauth2ClientMap)
  })

  app.post('/login', function (req, res) {
    user.login(req, res, db)
  })

  app.get('/logged', async (req, res) => {
    const jwt = await new SignJWT({ sub: req.query.sub })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fluid')
      .setAudience('http://localhost:' + process.env.PORT)
      .setExpirationTime('10min')
      .sign(crypto.createSecretKey(process.env.SECRET))

    res.send(jwt)
  })

  app.get('/oauth2callback', function (req, res) {
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
            // oauth2ClientMap.set(infos.sub, oauth2Client)
            res.redirect('/logged?sub=' + infos.email)
          }
        })
      } catch (err) {
        res.send(err)
        console.error(err)
      }
    }
  })

  app.get('/deezercallback', (req, res) => {
    if (req.query.code) {
      const query = {
        app_id: process.env.DEEZER_APP_ID,
        secret: process.env.DEEZER_SECRET,
        code: req.query.code,
        output: 'json'
      }
      https.get('https://connect.deezer.com/oauth/access_token.php?' + querystring.stringify(query), (response) => {
        let data = ''

        response.on('data', d => {
          data += d
        })
        response.on('end', async () => {
          const dataObj = JSON.parse(data)
          await collection.updateOne(
            { _id: 'alexandre.schaffner89@gmail.com' },
            {
              $set: {
                platform: {
                  accessToken: dataObj.access_token
                }
              }
            }
          )
          res.redirect('/ready')
        })
      })
      // res.redirect('frwqdLxcKeChmsi1F5ut4LIAt3QccjNXpxF6Kz5kZ9lJZCt7gX&expireshttps://connect.deezer.com/oauth/access_token.php?' + querystring.stringify(query))
    } else {
      res.send(req.query.error_reason)
    }
  })
}
