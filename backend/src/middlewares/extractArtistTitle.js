module.exports = (videoTitle) => {
  const parasites = [' x ', ' feat', ' ft. ', ' | ', ' /', /* ' & ', */ ' (', ' [']
  const splitedVideoTitle = videoTitle.split(' - ', 2)
  let artist = null
  let title = null

  artist = splitedVideoTitle[0]
  title = splitedVideoTitle[1]
  if (!artist || !title) {
    throw new Error('no artist or title found in the video title')
  }
  for (const token of parasites) {
    artist = artist.split(token, 1)[0]
    title = title.split(token, 1)[0]
  }
  return ({
    artist,
    title
  })
}
