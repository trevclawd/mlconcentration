# ML Concentration

An interactive Machine Learning learning app with concentration-style card matching.

## Features

- **6 Game Modes**: Memorize, Concentration (card matching), Drag & Drop, Listen & Learn, Practice, Timed Challenge
- **5 Lesson Decks**: 65+ ML concepts covering Fundamentals, Neural Networks, Deep Learning, Optimization, and NLP/CV
- **AI-Powered Explanations**: Get AI-generated explanations for any concept via OpenAI
- **Text-to-Speech**: Listen to concepts and explanations using OpenAI TTS
- **Daily Reports**: Automated daily reports on newest real estate listings (7 AM Central time)

## Real Estate Integration

The app includes a real estate market analysis system that:

- Scrapes property listings from 100+ miles around College Station, TX
- Filters by price ($120K-$160K), property type, bedrooms, bathrooms
- Scores properties based on value gap, price per sqft, and other metrics
- Sends daily reports of the newest properties to Telegram

## Setup

1. Copy this app directory to your server
2. Run `node server.js`
3. Access via browser at `http://localhost:8893/`

## Files

- `index.html` - Main application UI
- `script.js` - Game logic and ML concepts
- `styles.css` - Enhanced dark theme styling
- `server.js` - HTTP server
- `decks/index.json` - Deck metadata
- `decks/ml-*.json` - Individual lesson decks
- `daily-real-estate-report.js` - Real estate report generator
- `scheduler-real-estate.js` - Daily scheduler for 7 AM Central

## Deck Contents

1. **ML Fundamentals** (13 concepts): Supervised/unsupervised learning, model training, overfitting, classification, regression
2. **Neural Networks** (13 concepts): Layers, activations, backpropagation, ReLU, dropout, weight initialization
3. **Deep Learning** (13 concepts): CNNs, RNNs, LSTMs, transformers, attention mechanisms
4. **Optimization & Training** (13 concepts): Loss functions, optimizers, learning rate, regularization
5. **NLP & Computer Vision** (13 concepts): Tokenization, embeddings, BERT, GPT, ResNet, Vision Transformers

## Configuration

- Set your OpenAI API key in Settings for TTS and AI explanations
- Adjust volume controls for Japanese/English audio in Listen mode

## License

MIT