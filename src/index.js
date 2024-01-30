const fs = require('fs');
const { exit } = require('process');

const env = require('./environment-variables');
const { getVideoInfo, downloadThumbnail, downloadAudio, getVideoList } = require('./youtube-yt-dlp');
const { postEpisode } = require('./anchorfm-pupeteer');


function validateYoutubeVideoId(json) {
  if (json.id === undefined || json.id === null || typeof json.id !== 'string') {
    throw new Error('Id not present in JSON');
  }
}

async function main() {
  const videoList = await getVideoList(env.CHANNEL_URL);
  const videoArray = videoList.split(/\r?\n/);

  for (const youtubeVideoId of videoArray) {
    console.log(`Processing video: ${youtubeVideoId}`);
    await (async () => {
      const youtubeVideoInfo = await getVideoInfo(youtubeVideoId);
      const { title, description, uploadDate } = youtubeVideoInfo;
      console.log(`title: ${title}`);
      console.log(`description: ${description}`);
      console.log(`Upload date: ${JSON.stringify(uploadDate)}`);

      await Promise.all([downloadThumbnail(youtubeVideoId), downloadAudio(youtubeVideoId)]);

      console.log('Posting episode to anchorfm');
      try {
        await postEpisode(youtubeVideoInfo);
        fs.appendFileSync(env.DOWNLOADED_VIDEO_LIST_FILE, `youtube ${youtubeVideoId}`)
      } catch {
        console.log('Failed to post episode to anchorfm');
      }
    })();
  }
}

main()
  .then(() => console.log('Finished successfully.'))
  .catch((err) => {
    console.error(err);
    exit(1);
  });
