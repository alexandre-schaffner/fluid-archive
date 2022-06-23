module.exports = async (users, email) => {
  const options = { projection: { email: 1 } }
  const query = { email }
  const result = await users.findOne(query, options)

  if (result === null) {
    throw new Error('User don\'t exists in the FluidDB')
  } else {
    console.dir(result._id)
    return (result._id)
  }
}
