const axios = require('axios').default

function format (original) {
  const parasites = [' x ', ' feat', ' ft. ', ' | ', ' /', /* ' & ', */ ' (', ' [']

  for (const token of parasites) original = original.split(token, 1)[0]
  return original
}

module.exports = async (desc) => {
  const response = await axios.get('https://api.deezer.com/search/track', {
    params: {
      q: desc.title.formated
    }
  })
  console.log(response.data.data.length)
  for (let i = 0; i < response.data.data.length; i++) {
    if (
      (response.data.data[i].title === desc.title.original ||
      response.data.data[i].title === desc.title.formated ||
      format(response.data.data[i].title) === desc.title.formated) &&
      format(response.data.data[i].artist.name) === desc.artist.formated
    ) {
      return response.data.data[i].id
    }
  }
  throw new Error('track not found')
}
