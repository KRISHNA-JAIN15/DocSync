# 📄 DocSync

**DocSync** is a real-time collaborative document editing app. Built with **Next.js**, it leverages **WebSockets** for live syncing across users and integrates **Google Authentication** for secure access.

## 🚀 Features

- 🔄 Real-time document sync using WebSockets  
- 🔐 Google OAuth 2.0 for authentication  
- ✍️ Collaborative editing interface  
- ⚡ Fast and modern UI powered by Next.js

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js  
- **Real-time Sync**: WebSockets  
- **Authentication**: Google Auth

## 📦 Getting Started

1. Clone the repo  
   ```bash
   git clone https://github.com/your-username/docsync.git
   cd docsync

2. Install dependencies  
   ```bash
   npm install
   
3. Create a .env.local file in the root directory and add your Google OAuth credentials:
   ```bash
    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    NEXTAUTH_URL=http://localhost:3000

4. Run the development server
   ```bash
   npm run dev
   
5. Open your browser and go to
    ```bash
    http://localhost:3000

## ✅ Future Improvements
- 📝 Document version history and rollback

- 🧑‍🤝‍🧑 Role-based permissions for editing/viewing

- 🎨 Rich text editor with formatting options

- 📤 Export documents to PDF or Markdown
