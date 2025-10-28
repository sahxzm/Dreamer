# Dreamer - Personal Productivity Platform

A comprehensive productivity and habit tracking application built with Vue.js 3, TypeScript, and Supabase.

## Features

- **Task Management**: Create, organize, and track daily tasks with priority levels
- **Goal Tracking**: Set and monitor both mini-goals and long-term objectives with progress tracking
- **Journaling**: Digital journal with mood tracking, reflection templates, and search functionality
- **Pomodoro Timer**: Focus sessions with customizable work/break intervals and audio notifications
- **Streak Tracking**: LeetCode-style activity heatmaps and habit formation tools
- **Real-time Sync**: Cloud synchronization with Supabase for seamless data access
- **Authentication**: Secure user authentication with OAuth providers (Google, GitHub, Discord)

## Tech Stack

- **Frontend**: Vue.js 3, TypeScript, Vite
- **Styling**: Tailwind CSS with custom glassmorphism effects
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Pinia
- **Data Visualization**: ECharts
- **Audio**: Howler.js for notifications
- **Icons**: Iconify Vue

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/nidhising/Dreamer.git
   cd Dreamer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── pages/         # Application pages/routes
├── stores/        # Pinia state management
├── api/           # Supabase API configuration
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
