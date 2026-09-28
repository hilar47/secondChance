// Small sentiment-analysis microservice used to score item reviews/comments.
//   GET /sentiment?sentence=Great%20table   ->  { sentimentScore, sentiment }
const express = require('express');
const natural = require('natural');

const app = express();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
const tokenizer = new natural.WordTokenizer();

app.get('/sentiment', (req, res) => {
  const sentence = req.query.sentence;
  if (typeof sentence !== 'string' || !sentence.trim()) {
    return res.status(400).json({ error: 'No sentence provided' });
  }
  const score = analyzer.getSentiment(tokenizer.tokenize(sentence));
  let sentiment = 'neutral';
  if (score < -0.25) sentiment = 'negative';
  else if (score > 0.25) sentiment = 'positive';
  return res.json({ sentimentScore: score, sentiment });
});

const port = process.env.SENTIMENT_PORT || 3061;
if (require.main === module) app.listen(port, () => console.log(`Sentiment service on :${port}`)); // eslint-disable-line no-console
module.exports = app;
