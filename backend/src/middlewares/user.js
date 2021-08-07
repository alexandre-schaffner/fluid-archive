function checkExistingUser (collection, email, res, callback) {
  const query = { 'logins.email': email }
  const options = { projection: { _id: 0, logins: { email: 1 } } }

  collection.findOne(query, options).then((result, error) => {
    if (error) {
      throw error
    } else {
      if (result != null) {
        res.send('Sorry, an account is already signed up with this email address.')
      } else {
        callback()
      }
    }
  })
}

module.exports.register = function (req, res, db, credentials, oauth2ClientMap) {
  const bcrypt = require('bcryptjs')
  const collection = db.collection('users')
  const { google } = require('googleapis')
  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris
  )
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'profile',
      'email'
    ],
    login_hint: req.body.email
  })

  checkExistingUser(collection, req.body.email, res, () => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        res.send('An error occured, please retry.')
        throw err
      }
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) {
          res.send('An error occured, please retry.')
          throw err
        }
        const doc = {
          logins: {
            email: req.body.email,
            password: hash
          },
          google: {
            userId: null,
            tokens: {
              accessToken: null,
              refreshToken: null
            }
          },
          platform: {
            platform: req.body.platform,
            playlist: req.body.playlist,
            accessToken: null,
            refreshToken: null
          }
        }
        collection.insertOne(doc, (error, result) => {
          if (error || result.insertedCount !== 1) {
            res.send('Sorry, an error occured during your registration...')
          } else {
            res.send('We\'re almost done, authorize this app by visiting this url: ' + authUrl)
          }
        })
      })
    })
  })
}

/* module.exports.login = function (req, res, db) {
  const bcrypt = require('bcryptjs')
  const collection = db.collection('user')
  const query = { 'logins.password': req.body.password }
  const options = { projection: { _id: 0, logins: { email: 1 } } }

  collection.findOne
} */
