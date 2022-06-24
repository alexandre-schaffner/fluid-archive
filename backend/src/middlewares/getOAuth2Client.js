module.exports = async (credentials, usersCollection, mongoId) => {
  const { google } = require('googleapis')
  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris
  )
  const query = { _id: mongoId }
  const options = { projection: { _id: 1, 'google.tokens': 1 } }
  const result = await usersCollection.findOne(query, options)

  const tokens = result.google.tokens
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('no Google account linked')
  }
  oauth2Client.setCredentials({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
  return (oauth2Client)
}
