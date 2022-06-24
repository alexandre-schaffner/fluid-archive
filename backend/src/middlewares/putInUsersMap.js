module.exports = async (credentials, mongoId, usersMap, usersCollection) => {
  const getOAuth2Client = require('./getOAuth2Client')
  const getLastLikedVideo = require('./getLastLikedVideo')
  const result = await usersCollection.findOne({ _id: mongoId }, { projection: { _id: 1, google: 1, platform: 1 } })
  const oauth2Client = await getOAuth2Client(credentials, usersCollection, result._id)
  const lastLikedVideo = await getLastLikedVideo(oauth2Client, result.google.tokens.access_token) // récupérer la valeur stockée dans la db à la place ? // Cassé
  const stringId = result._id.toHexString()
  const setPlaylistID = require('./setPlaylistID')

  if (usersMap.get(mongoId.toHexString()) !== undefined) throw new Error('user already synced')
  if (
    !result.google.tokens.accessToken ||
    !result.google.tokens.refreshToken ||
    !result.platform.tokens.accessToken
  ) throw new Error('complete configuration first')
  usersMap.set(stringId, {
    google: {
      oauth2Client,
      accessToken: result.google.tokens.accessToken,
      refreshToken: result.google.tokens.refreshToken
    },
    lastLikedVideo,
    platform: {
      platform: result.platform.platform,
      playlist: await setPlaylistID(result.platform.playlist, result.platform.tokens.accessToken),
      accessToken: result.platform.tokens.accessToken
    }
  })
}
