module.exports = async (oauth2Client, accessToken) => {
  const gaxiosOptions = { url: 'https://youtube.googleapis.com/youtube/v3/videos?part=snippet&maxResults=1&myRating=like&access_token=' + accessToken }
  try {
    const response = await oauth2Client.request(gaxiosOptions)
    return (response.data.items[0].snippet.title)
  } catch (err) {
    console.error('err', err)
    throw (err)
  }
}
