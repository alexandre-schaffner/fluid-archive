/* checkExistingUser
* ------------------
* Decription:
*   Check if the user already exists in the db.
*
* Return on
*   Success:
*     The results of the db request (null if the user does not exist).
*   Error:
*     Throw an error
*/
async function checkExistingUser (users, email) {
  const query = {
    email: email
  }
  const options = {
    projection: {
      email: 1
    }
  }
  try {
    const existingUser = await users.findOne(query, options) !== null
    return (existingUser)
  } catch (err) {
    throw new Error(err)
  }
}

/* Registration
* ---------
* Decription:
*   Check if the user already exists in the db based on the user's email address.
*   If he don't already exist, register the new user in the db.
*
* Send on
*   Success:
*     A JWT (after being redirected to /logged)
*   Error:
*     An error message
*/
module.exports.register = async function (req, res, users) {
  const bcrypt = require('bcryptjs')
  const jwt = require('jsonwebtoken')

  try {
    if (await checkExistingUser(users, req.body.email)) {
      throw new Error('User already exists.')
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)
    const doc = {
      email: req.body.email,
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
        tokens: {
          accessToken: null,
          refreshToken: null
        }
      },
      sync: false
    }
    const result = await users.insertOne(doc)
    if (result.insertedCount !== 1) {
      throw new Error('An error occured while inserting your data in the db')
    } else {
      try {
        const token = await jwt.sign({ sub: result.insertedId },
          process.env.SECRET,
          {
            algorithm: 'HS256',
            expiresIn: '1h',
            issuer: 'Fluid'
          }
        )
        res.send({ accessToken: token })
      } catch (err) {
        throw new Error('Can\'t sign the JWT')
      }
    }
  } catch (err) {
    res.send(err.message)
  }
}

/* Login
* ------
* Description:
*   Login middleware.
*   If the user exists,
*   compare the given password with the corresponding hash in the db.
*
* Send on
*   Sucess:
*     A JWT
*   Error:
*     An error message
*/
module.exports.login = async function (req, res, users) {
  const bcrypt = require('bcryptjs')
  const jwt = require('jsonwebtoken')
  const options = { projection: { _id: 1, password: 1 } }
  const query = { email: req.body.email }

  try {
    const result = await users.findOne(query, options)
    if (result === null) {
      throw new Error('You are not registered yet.')
    }
    const passwordCheck = await bcrypt.compare(req.body.password, result.password)
    if (passwordCheck === true) {
      const token = await jwt.sign({ sub: result._id },
        process.env.SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '1h',
          issuer: 'Fluid'
        }
      )
      res.send({ accessToken: token })
    } else {
      throw new Error('Wrong password.')
    }
  } catch (err) {
    res.send(err.message)
  }
}

/* Google authentication
* ----------------------
*  Description:
*    Create and redirect the user to a Google authentication page.
*    On this page, the user should authorize the app.
*/
module.exports.googleAuth = async function (req, res, credentials, users) {
  const ObjectId = require('mongodb').ObjectId
  const checkJWT = require('./checkJWT')
  const { google } = require('googleapis')
  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris)

  try {
    const token = await checkJWT(req, users)
    const query = { _id: ObjectId(token.sub) }
    const options = { projection: { email: 1 } }
    const result = await users.findOne(query, options)
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'profile',
        'email'
      ],
      login_hint: result.email
    })
    res.send(authUrl)
  } catch (err) {
    res.send(err.message)
  }
}

/* Deezer authentication
* ----------------------
* Description:
*   Redirect the user to a Deezer authentication page.
*   On this page the user should authorize the app.
*/
module.exports.deezerAuth = async function (req, res, users) {
  const querystring = require('querystring')
  const checkJWT = require('./checkJWT')

  try {
    await checkJWT(req, users)
    const query = {
      app_id: process.env.DEEZER_APP_ID,
      redirect_uri: 'http://localhost:3000/deezercallback',
      perms: 'offline_access,manage_library',
      response_type: 'token'
    }
    res.send('https://connect.deezer.com/oauth/auth.php?' + querystring.stringify(query))
  } catch (err) {
    res.send(err.message)
  }
}

/* Retrieve Deezer access token
* -----------------------------
* Description:
* Retrieve deezer access token and store it in the db.
*/
module.exports.getDeezerToken = async function (req, res, users, usersMap) {
  const ObjectId = require('mongodb').ObjectId
  const checkJWT = require('./checkJWT')

  try {
    const token = await checkJWT(req, users)
    const mongoId = ObjectId(token.sub)
    const stringId = mongoId.toHexString()
    await users.updateOne(
      { _id: mongoId },
      {
        $set: {
          'platform.tokens.accessToken': req.body.access_token
        }
      }
    )
    if (usersMap.get(stringId) === undefined) {
      usersMap.set(stringId, {
        platform: {
          platform: 'Deezer',
          accessToken: req.body.access_token
        }
      })
    } else {
      usersMap.set(stringId, {
        google: usersMap.get(stringId).google,
        lastLikedVideo: usersMap.get(stringId).lastLikedVideo,
        platform: {
          platform: 'Deezer',
          accessToken: req.body.access_token
        }
      })
    }
    console.log('Deezer', usersMap)
    res.send('Access token retrieved successfully')
  } catch (err) {
    res.send(err.message)
  }
}
