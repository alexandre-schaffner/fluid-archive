module.exports = (app, credentials, usersCollection, usersMap) => {
  const checkJWT = require('../middlewares/checkJWT')
  const { ObjectId } = require('mongodb')
  const putInUsersMap = require('../middlewares/putInUsersMap')

  app.post('/set_playlist', async (req, res) => {
    try {
      const jwt = await checkJWT(req, usersCollection)
      const mongoId = ObjectId(jwt.sub)

      const updateRes = await usersCollection.updateOne(
        { _id: mongoId },
        {
          $set: { 'platform.playlist': req.body.title }
        }
      )
      if (updateRes.matchedCount === 0) {
        throw new Error('You are not registered yet.')
      }
      await putInUsersMap(credentials, mongoId, usersMap, usersCollection)
      res.send({ newPlaylist: req.body.title })
    } catch (err) {
      res.send(err.message)
    }
  })
}
