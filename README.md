# RetroBoard 🚀

<div align="center">
  <img src="public/logo-icon.svg" alt="RetroBoard Logo" width="120" />
  <br />
  <br />
  <p>
    <b>The modern, real-time retrospective tool for agile teams.</b>
  </p>
  <p>
    Collaborate instantly, vote on ideas, and celebrate wins with immersive reactions.
  </p>
</div>

---

## 🌟 Overview

**RetroBoard** reimagines the sprint retrospective. Gone are the days of clunky, static boards. We bring your team together with a fluid, real-time experience that feels alive. Whether you're running a classic "Start/Stop/Continue" or a "Lean Coffee" session, RetroBoard adapts to your workflow.

## ✨ Key Features

### 🤝 **Real-Time Collaboration**
- **Live Updates**: See cards appear, move, and update instantly via WebSocket integration.
- **Presence**: Know who is online and active in the board.

### 🎭 **Dynamic Templates**
Choose from industry-standard templates or create your own:
- **🏁 Start, Stop, Continue**: The classic agile format.
- **😡 Mad, Sad, Glad**: Focus on team morale and emotions.
- **🚦 Went Well, To Improve, Action Items**: The standard sprint review.
- **☕ Lean Coffee**: Structured, agenda-less discussion.

### 🎉 **Immersive Reactions**
Celebrate team wins with physics-based, center-stage animations:
- **👏 Applause**: A round of applause for great ideas.
- **🚀 Rocket**: Launch big wins to the moon.
- **💡 Lightbulb**: Highlight bright ideas.
- **💎 Gem**: Mark valuable insights.
- **⭐️ Star**: Recognize superstar efforts.

### 🗳️ **Smart Facilitation**
- **Voting**: Timer-based voting sessions to prioritize discussions.
- **Blur Mode**: Hide content to prevent groupthink until reveal time.
- **Timer**: Built-in countdowns to keep meetings on track.
- **Export**: Export board results to share with stakeholders.

### 🌍 **Internationalization**
- Fully localized in **English** and **Turkish**.

## 🛠️ Tech Stack

Built with the latest modern web technologies for performance and scale:

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
- **Language**: TypeScript
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: Zustand
- **Real-time**: Custom Polling & WebSockets
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & Web Animations API
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)
- **Database**: PostgreSQL (via Supabase/Neon)
- **Authentication**: JWT & Next Middleware

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/narince/simple-retro.git
   cd retroboardapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # Database (PostgreSQL)
   DATABASE_URL="postgresql://user:password@host:port/postgres?sslmode=require"
   
   # App URL (for redirects/CORS)
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   
   # Security Secrets
   JWT_SECRET="your-super-secret-jwt-key"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   ├── components/          # React components
│   │   ├── board/           # Board-specific components (Drag & Drop, Cards)
│   │   ├── dashboard/       # Dashboard UI
│   │   └── ui/              # Reusable UI primitives (Buttons, Inputs)
│   ├── lib/                 # Utilities, hooks, and helpers
│   ├── services/            # API & Database services
│   └── styles/              # Global styles
├── public/                  # Static assets
└── scripts/                 # Migration and utility scripts
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://www.tolganarince.com" target="_blank">Tolga Narince</a></p>
</div>
