module.exports = (videoTitle) => {
  const parasites = [' x ', ' feat', ' ft. ', ' | ', ' /', /* ' & ', */ ' (', ' [']
  const splitedVideoTitle = videoTitle.split(' - ', 2)
  let ogArtist = null
  let fArtist = null
  let ogTitle = null
  let fTitle = null

  ogArtist = splitedVideoTitle[0]
  ogTitle = splitedVideoTitle[1]
  if (!ogArtist || !ogTitle) {
    throw new Error('no artist or title found in the video title')
  }
  fArtist = ogArtist
  fTitle = ogTitle
  for (const token of parasites) {
    fArtist = fArtist.split(token, 1)[0]
    fTitle = fTitle.split(token, 1)[0]
  }
  return ({
    artist: {
      original: ogArtist,
      formated: fArtist
    },
    title: {
      original: ogTitle,
      formated: fTitle
    }
  })
}
