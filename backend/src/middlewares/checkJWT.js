module.exports = async function checkJWT (req, usersCollection) {
  const jwt = require('jsonwebtoken')
  const { ObjectId } = require('mongodb')

  if (!req.headers.authorization) {
    throw new Error('No JWT provided')
  }
  const token = await jwt.verify(
    req.headers.authorization.replace('Bearer ', ''),
    process.env.SECRET,
    { algorithms: ['HS256'], issuer: 'Fluid' }
  )
  const result = await usersCollection.findOne({ _id: ObjectId(token.sub) }, { projection: { _id: 1 } })
  if (result === null) {
    throw new Error('User not registered')
  }
  return (token)
}
