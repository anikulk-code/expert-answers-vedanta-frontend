/**
 * Build slim gita-map.json for the frontend from:
 * - swami-sarvapriyananda-gita-map.json (source of truth: mapping + English)
 * - gita-verse-cache.json (build-time only: slok + transliteration)
 *
 * Usage:
 *   node scripts/build-gita-data.js
 *
 * Optional env vars:
 *   GITA_MAP_PATH   path to map JSON
 *   GITA_CACHE_PATH path to verse cache JSON
 *   GITA_OUTPUT_PATH path to output JSON
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_MAP_PATH =
  "/Users/aniruddhakulkarni/Documents/CodexProjects/swami-sarvapriyananda-gita-map.json";
const DEFAULT_CACHE_PATH =
  "/Users/aniruddhakulkarni/Documents/CodexProjects/gita-verse-cache.json";
const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "gita-map.json",
);

const CHAPTER_NAMES = {
  1: "Arjuna's despondency",
  2: "Self-knowledge and steady wisdom",
  3: "karma yoga",
  4: "knowledge, action, and renunciation",
  5: "renunciation and action",
  6: "meditation",
  7: "knowledge of the Divine",
  8: "remembrance of Brahman",
  9: "the royal secret",
  10: "divine glories",
  11: "the cosmic form",
  12: "devotion",
  13: "the field and the knower",
  14: "the three gunas",
  15: "the supreme Person",
  16: "divine and demonic tendencies",
  17: "threefold faith",
  18: "liberation through renunciation",
};

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing input file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pickLecture(verseKey, lectures) {
  if (!lectures || lectures.length === 0) return null;
  if (lectures.length === 1) return lectures[0];

  const verse = parseInt(verseKey.split(".")[1], 10);

  const exactSingle = lectures.filter((lecture) => {
    const title = lecture.title || "";
    const singleVerse = new RegExp(
      `(?:^|[^0-9])Verse[s]?\\s+${verse}(?:[^0-9]|$)`,
      "i",
    );
    const rangeBefore = new RegExp(
      `Verses\\s+\\d+\\s*[-–]\\s*${verse}\\b`,
      "i",
    );
    const rangeAfter = new RegExp(
      `Verses\\s+${verse}\\s*[-–]\\s*\\d+`,
      "i",
    );
    return (
      singleVerse.test(title) &&
      !rangeBefore.test(title) &&
      !rangeAfter.test(title)
    );
  });

  if (exactSingle.length > 0) {
    return exactSingle[exactSingle.length - 1];
  }

  return lectures[lectures.length - 1];
}

function buildSlimMap(mapData, cacheData) {
  const verseMap = {};

  for (const [key, entry] of Object.entries(mapData.verseMap || {})) {
    const cacheEntry = cacheData[key] || {};
    const chosen = pickLecture(key, entry.lectures);

    verseMap[key] = {
      slok: cacheEntry.slok || "",
      transliteration: cacheEntry.transliteration || "",
      translation: entry.translation || null,
      translationSource: entry.translationSource || null,
      lecture: chosen
        ? {
            lectureNumber: chosen.lectureNumber,
            videoId: chosen.videoId,
            title: chosen.title,
            url: chosen.url,
          }
        : null,
    };
  }

  return {
    generatedAt: mapData.generatedAt,
    updatedAt: mapData.updatedAt || mapData.generatedAt,
    source: mapData.source,
    chapterVerseCounts: mapData.chapterVerseCounts,
    chapterNames: CHAPTER_NAMES,
    mappedVerseCount: Object.keys(verseMap).length,
    verseMap,
  };
}

function main() {
  const mapPath = process.env.GITA_MAP_PATH || DEFAULT_MAP_PATH;
  const cachePath = process.env.GITA_CACHE_PATH || DEFAULT_CACHE_PATH;
  const outputPath = process.env.GITA_OUTPUT_PATH || DEFAULT_OUTPUT_PATH;

  const mapData = loadJson(mapPath);
  const cacheData = loadJson(cachePath);
  const slim = buildSlimMap(mapData, cacheData);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(slim, null, 2)}\n`);

  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`Wrote ${outputPath} (${sizeKb} KB, ${slim.mappedVerseCount} verses)`);
}

main();
