const axios = require('axios').default

module.exports = async ({ artist, title }) => {
  const response = await axios.get('https://api.deezer.com/search/track', {
    params: {
      q: title
    }
  })
  for (let i = 0; i < response.total; i++) {
    if (
      // response.data[i].artist.name === artist &&
      response.data[i].title === title
    ) return response.data[i].id
  }
  throw new Error('track not found')
}
