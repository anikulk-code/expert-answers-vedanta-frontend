# Expert Answers - Vedanta Frontend

Frontend application for the Expert Answers platform, focused on Vedanta topic with Sarvapriyananda as the expert.

## Features

- Ask questions and receive answers from YouTube video segments
- Topic: Vedanta
- Expert: Sarvapriyananda (sole expert)
- Video segment display with timestamps
- Clean, focused user experience

## Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

### Running the Application

```bash
# Development
npm start

# Build for production
npm run build
```

The app will run on http://localhost:3000

## Architecture

- **Separation of Concerns**: Frontend consumes APIs only
- **Topic-Specific**: Tailored for Vedanta with Sarvapriyananda
- **API Integration**: Connects to expert-answers-backend API

## Development Roadmap

- **Version 0**: Basic question input and video display
- **Version 1**: Enhanced UI with timestamp navigation
- **Version 2**: Advanced filtering and expert selection

