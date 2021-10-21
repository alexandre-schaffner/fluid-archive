
module.exports.getPlatformTokens = async (users, id) => {
  const ObjectID = require('mongodb').ObjectID
  const options = { projection: { 'platform.tokens': 1 } }
  const query = { _id: ObjectID(id) }
  const result = await users.findOne(query, options)

  if (result === null) {
    throw new Error('User don\'t exists in the FluidDB')
  } else {
    return (result.platform.tokens)
  }
}

module.exports.getGoogleTokens = async (users, id) => {
  const ObjectID = require('mongodb').ObjectID
  const options = { projection: { 'google.tokens': 1 } }
  const query = { _id: ObjectID(id) }
  const result = await users.findOne(query, options)

  if (result === null) {
    throw new Error('User don\'t exists in the FluidDB')
  } else {
    return (result.google.tokens)
  }
}
