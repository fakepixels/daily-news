# Daily Tech News

A modern, responsive tech news aggregator that fetches and displays the latest technology news from multiple trusted sources including Bloomberg, TechCrunch, New York Times, Associated Press, and any source of choice. 

![Daily Tech News](screenshot.png)

## Features

- 🔄 Real-time news updates from multiple sources
- 🌓 Dark/Light theme support
- 🔍 Advanced search functionality
- 📱 Responsive design
- 🤖 AI-powered article explanations
- ✨ Smooth animations and transitions
- 📖 Article reading progress tracking
- ⌨️ Keyboard navigation support
- 🎯 Smart content filtering and cleaning

## Tech Stack

- **Framework**: Next.js 15
- **Animation**: Framer Motion
- **News API**: Exa
- **AI Integration**: OpenAI

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/daily-news.git
cd daily-news
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
EXA_API_KEY=your_exa_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features

### News Aggregation
- Fetches latest tech news from multiple sources
- Smart content filtering to remove duplicates and irrelevant content
- Automatic article summarization using GPT-3.5
- Clean article text processing to remove ads and boilerplate content

### Search Functionality
- Real-time search across all news sources
- Advanced filtering and sorting options
- Responsive search interface with loading states

### Article Interaction
- Modal view for detailed article reading
- AI-powered article explanations
- Article progress tracking
- Keyboard navigation (left/right arrows for navigation, ESC to close)
- External links to original articles

### User Interface
- Modern, clean design
- Dark/Light theme toggle
- Smooth transitions and animations
- Responsive grid layout
- Loading states and error handling
- Real-time clock display

## API Integration

### Exa API
Used for fetching news content with features like:
- Advanced search queries
- Content extraction
- Date filtering
- Author extraction

### OpenAI API
Used for:
- Article summarization
- Generating article explanations
- Content analysis

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Exa API key
- OpenAI API key

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
