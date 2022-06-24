const axios = require('axios').default

module.exports = async function (playlistName, deezerAccessToken) {
  let response = await axios.get('https://api.deezer.com/user/me/playlists', {
    params: {
      access_token: deezerAccessToken
    }
  })
  for (let i = 0; i < response.data.data.length; i++) {
    if (response.data.data[i].title === playlistName) {
      console.log('playlist id: ' + response.data.data[i].id)
      return (response.data.data[i].id)
    }
  }
  console.log('creating a new playlist...')
  response = await axios.post('https://api.deezer.com/user/me/playlists', null, {
    params: {
      access_token: deezerAccessToken,
      title: playlistName
    }
  })
  return response.data.id
}
