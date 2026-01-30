# RetroBoard 🚀

**RetroBoard** is a modern, real-time retrospective tool designed for agile teams to collaborate effectively. Built with a focus on user experience, performance, and visual appeal.

<img src="public/assets/logo.svg" alt="RetroBoard Preview" width="120" />

## ✨ Key Features

- **Real-time Collaboration**: See changes instantly as team members add cards, vote, or move items.
- **Multiple Templates**:
  - **Start, Stop, Continue**: Classic agile format.
  - **Mad, Sad, Glad**: Emotional check-in.
  - **Went Well, To Improve, Action Items**: Standard sprint retro.
  - **Lean Coffee**: Structured discussion.
- **Interactive Reactions**: Celebrate wins with immersive emoji animations (Applause, Rockets, and more!).
- **Smart Voting**: timer-based voting sessions to keep meetings on track.
- **Drag & Drop**: Intuitive interface powered by `dnd-kit`.
- **Dark Mode**: Fully supported dark/light themes.
- **Multi-language**: Validated support for English and Turkish.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & Web Animations API
- **Database**: PostgreSQL (via Supabase/Neon)
- **Real-time**: Custom polling & WebSocket integration

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/retroboard.git
   cd retroboardapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/postgres"
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** to see the app.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
