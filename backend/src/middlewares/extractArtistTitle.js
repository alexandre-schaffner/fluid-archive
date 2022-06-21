module.exports = (videoTitle) => {
  const parasites = [' x ', ' feat', ' ft. ', ' | ', ' /', ' & ', ' (', ' [']
  const splitedVideoTitle = videoTitle.split(' - ', 2)
  let artist = null
  let title = null

  artist = splitedVideoTitle[0]
  title = splitedVideoTitle[1]
  if (!artist || !title) {
    throw new Error('no artist or title found in the video title')
  }
  for (const token of parasites) {
    artist.replace(token, '')
    title.replace(token, '')
  }
  return ({
    artist,
    title
  })
}
// try {
//   console.log(extractArtistTitle(videoTitle))
// } catch (err) {
//   console.error(err.message)
// }
