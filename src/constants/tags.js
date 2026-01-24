/**
 * Main tags for the "Explore by Topic" feature.
 * 
 * These are topics that have 5+ questions in the database.
 * Derived from Cosmos DB analysis - topics with minimum 5 questions.
 * 
 * This list should match the MAIN_TAGS_DB list in the backend (app/routers/tags.py).
 * 
 * To update: Run analysis on Cosmos DB to find topics with 5+ questions,
 * then update both this file and the backend constant.
 */

// Display names for the tags (as shown in UI)
export const MAIN_TAGS_DISPLAY = [
  'AI',
  'Advaita',
  'Buddhism',
  'Consciousness',
  'Enlightenment',
  'Experience',
  'Free Will',
  'God & Devotion',
  'Karma',
  'Maya',
  'Meditation',
  'Mind',
  'Mindfulness',
  'Non-Duality',
  'Personal Development',
  'Philosophy',
  'Prayer',
  'Reality',
  'Realization',
  'Reincarnation',
  'Science',
  'Sleep',
  'Spiritual Life',
  'Spiritual Practice',
  'Suffering & Ethics',
  'Theology',
  'Universe',
  'Yoga',
];

// Mapping from display name to database topic name (lowercase)
export const TAG_TO_DB_TOPIC = {
  'AI': 'artificial intelligence',
  'Advaita': 'advaita',
  'Buddhism': 'buddhism',
  'Consciousness': 'consciousness',
  'Enlightenment': 'enlightenment',
  'Experience': 'experience',
  'Free Will': 'free will',
  'God & Devotion': 'bhakti', // Also maps to 'devotion'
  'Karma': 'karma',
  'Maya': 'maya',
  'Meditation': 'meditation',
  'Mind': 'mind',
  'Mindfulness': 'mindfulness',
  'Non-Duality': 'non-duality',
  'Personal Development': 'personal development',
  'Philosophy': 'philosophy',
  'Prayer': 'prayer',
  'Reality': 'reality',
  'Realization': 'realization',
  'Reincarnation': 'reincarnation',
  'Science': 'science',
  'Sleep': 'sleep',
  'Spiritual Life': 'spiritual life',
  'Spiritual Practice': 'spiritual practice',
  'Suffering & Ethics': 'suffering', // Also maps to 'ethics'
  'Theology': 'theology',
  'Universe': 'universe',
  'Yoga': 'yoga',
};
