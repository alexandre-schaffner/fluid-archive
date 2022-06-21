
module.exports.getPlatformTokens = async (users, id) => {
  const ObjectId = require('mongodb').ObjectId
  const options = { projection: { 'platform.tokens': 1 } }
  const query = { _id: ObjectId(id) }
  const result = await users.findOne(query, options)

  if (result === null) {
    throw new Error('User don\'t exists in the FluidDB')
  } else {
    return (result.platform.tokens)
  }
}

module.exports.getGoogleTokens = async (users, id) => {
  const ObjectId = require('mongodb').ObjectId
  const options = { projection: { 'google.tokens': 1 } }
  const query = { _id: ObjectId(id) }
  const result = await users.findOne(query, options)

  if (result === null) {
    throw new Error('User don\'t exists in the FluidDB')
  } else {
    return (result.google.tokens)
  }
}
