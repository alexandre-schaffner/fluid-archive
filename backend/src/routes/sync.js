
module.exports = (app, credentials, usersCollection, usersMap) => {
  const checkJWT = require('../middlewares/checkJWT')
  const { ObjectId } = require('mongodb')
  const putInUsersMap = require('../middlewares/putInUsersMap')

  app.get('/is_sync', async (req, res) => {
    try {
      const jwt = await checkJWT(req, usersCollection)
      const mongoId = ObjectId(jwt.sub)

      const result = await usersCollection.findOne({ _id: mongoId }, { projection: { sync: 1 } })
      res.send({
        status: result.sync
      })
    } catch (err) {
      res.send(err.message)
    }
  })

  app.get('/sync', async (req, res) => {
    try {
      const jwt = await checkJWT(req, usersCollection)
      const mongoId = ObjectId(jwt.sub)

      const updateRes = await usersCollection.updateOne(
        { _id: mongoId },
        {
          $set: { sync: true }
        }
      )
      if (updateRes.matchedCount === 0) {
        throw new Error('You are not registered yet.')
      }
      await putInUsersMap(credentials, mongoId, usersMap, usersCollection)
      res.send({ state: 'sync' })
    } catch (err) {
      res.send(err.message)
    }
  })

  app.get('/unsync', async (req, res) => {
    try {
      const jwt = await checkJWT(req, usersCollection)
      const mongoId = ObjectId(jwt.sub)
      const stringId = mongoId.toHexString()

      const updateRes = await usersCollection.updateOne(
        { _id: mongoId },
        {
          $set: { sync: false }
        }
      )
      if (updateRes.matchedCount === 0) {
        throw new Error('You are not registered yet.')
      }
      usersMap.delete(stringId)
      res.send({ state: 'unsync' })
      console.log(usersMap)
    } catch (err) {
      res.send(err.message)
    }
  })
}
