/**
 * Build gospel-map.json for the frontend from:
 * swami-sarvapriyananda-gospel-talk-map.json
 *
 * Usage: node scripts/build-gospel-data.js
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_SOURCE_PATH =
  "/Users/aniruddhakulkarni/Documents/CodexProjects/swami-sarvapriyananda-gospel-talk-map.json";
const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "gospel-map.json",
);

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing input file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slimTalk(talk) {
  return {
    speaker: talk.speaker,
    title: talk.title,
    videoId: talk.videoId,
    url: talk.url,
    mappingConfidence: talk.gospelReference?.mappingConfidence || null,
  };
}

function buildSearchText(chapter, sarvapriyanandaTalks, relatedTalks) {
  return [
    chapter.chapterNumber,
    `chapter ${chapter.chapterNumber}`,
    chapter.title,
    chapter.dateText,
    ...(chapter.sections || []),
    ...(chapter.keywords || []),
    ...sarvapriyanandaTalks.flatMap((talk) => [
      talk.speaker,
      talk.title,
      ...(talk.keywords || []),
    ]),
    ...relatedTalks.flatMap((talk) => [
      talk.speaker,
      talk.title,
      ...(talk.keywords || []),
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildGospelMap(source) {
  const chapters = (source.gospelChapters || []).map((chapter) => {
    const chapterKey = String(chapter.chapterNumber);
    const bucket = source.talksByChapter?.[chapterKey] || {};
    const sarvapriyanandaTalks = (bucket.sarvapriyanandaTalks || []).map(slimTalk);
    const relatedTalks = (bucket.relatedTalks || []).map(slimTalk);

    return {
      chapterNumber: chapter.chapterNumber,
      volume: chapter.volume,
      title: chapter.title,
      dateText: chapter.dateText,
      sourceUrl: chapter.sourceUrl,
      sections: chapter.sections || [],
      keywords: chapter.keywords || [],
      searchText: buildSearchText(chapter, bucket.sarvapriyanandaTalks || [], bucket.relatedTalks || []),
      sarvapriyanandaTalkCount: sarvapriyanandaTalks.length,
      relatedTalkCount: relatedTalks.length,
    };
  });

  const talksByChapter = {};
  for (const [chapterKey, bucket] of Object.entries(source.talksByChapter || {})) {
    talksByChapter[chapterKey] = {
      sarvapriyanandaTalks: (bucket.sarvapriyanandaTalks || []).map(slimTalk),
      relatedTalks: (bucket.relatedTalks || []).map(slimTalk),
    };
  }

  return {
    generatedAt: source.generatedAt,
    notes: source.notes,
    sources: source.sources,
    stats: source.stats,
    chapterCount: chapters.length,
    chapters,
    talksByChapter,
  };
}

function main() {
  const sourcePath = process.env.GOSPEL_MAP_PATH || DEFAULT_SOURCE_PATH;
  const outputPath = process.env.GOSPEL_OUTPUT_PATH || DEFAULT_OUTPUT_PATH;
  const source = loadJson(sourcePath);
  const output = buildGospelMap(source);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`Wrote ${outputPath} (${sizeKb} KB, ${output.chapterCount} chapters)`);
}

main();
