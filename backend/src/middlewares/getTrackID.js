const axios = require('axios').default

module.exports = async ({ artist, title }) => {
  const response = await axios.get('https://api.deezer.com/search/track', {
    params: {
      q: title
    }
  })
  console.log(artist, title)
  for (let i = 0; i < response.data.total; i++) {
    if (
      // response.data[i].artist.name === artist &&
      response.data.data[i].title === title
    ) return response.data.data[i].id
  }
  throw new Error('track not found')
}
