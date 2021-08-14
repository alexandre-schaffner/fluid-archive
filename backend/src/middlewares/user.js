async function checkExistingUser (users, email) {
  const query = {
    _id: email
  }
  const options = {
    projection: {
      _id: 1
    }
  }
  try {
    const existingUser = await users.findOne(query, options)
    return (existingUser)
  } catch (err) {
    throw new Error(err)
  }
}

module.exports.register = async function (req, res, db, credentials, oauth2ClientMap) {
  const bcrypt = require('bcryptjs')
  const users = db.collection('users')
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
  try {
    const existingUser = await checkExistingUser(users, req.body.email)
    if (existingUser !== null) {
      throw new Error('User already exists.')
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)
    const doc = {
      _id: req.body.email,
      password: hash,
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
    const result = await users.insertOne(doc)
    if (result.insertedCount !== 1) {
      throw new Error('An error occured while inserting your data in the db')
    } else {
      res.send('We\'re almost done, authorize this app by visiting this url: ' + authUrl)
    }
  } catch (err) {
    res.send(err.message)
  }
}

module.exports.login = async function (req, res, db) {
  const bcrypt = require('bcryptjs')
  const users = db.collection('users')
  const query = { _id: req.body.email }
  const options = { projection: { _id: 1, password: 1 } }

  try {
    const result = await users.findOne(query, options)
    if (result === null) {
      throw new Error('You are not registered yet.')
    } else {
      const passwordCheck = await bcrypt.compare(req.body.password, result.password)
      if (passwordCheck === true) {
        res.send('Sucessfully logged in')
      } else {
        throw new Error('Wrong password.')
      }
    }
  } catch (err) {
    res.send(err.message)
  }
}
