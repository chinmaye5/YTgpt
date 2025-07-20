# YT-GPT: Chat with YouTube App

A fullstack chatbot application that allows users to submit a YouTube video URL and ask questions about its content. It uses Google's Gemini API for answers, and stores conversations in MongoDB. The app is built with:

- **Frontend**: Next.js (React)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Cloud)
- **Auth**: JWT
- **LLM API**: Gemini API (Google AI)

---

## 🌐 Live Preview

>https://ytgpt-snowy.vercel.app

---

## 🛠️ Features

- User Registration & Login (JWT-based auth)
- Ask questions about YouTube videos
- Gemini API for AI-generated answers
- Conversation history saved to MongoDB
- Short and long answer modes
- Clean MVC architecture

---

## 📦 Installation

### 1. Clone the Repository

git clone https://github.com/chinmaye5/YTgpt.git
cd YTgpt
📁 Project Structure
YTgpt/
├── client/        # Frontend (Next.js)
└── server/        # Backend (Express.js)
🚀 Frontend Setup (Next.js)
Navigate to the frontend directory:
cd client
Install dependencies:
npm install
Create .env file:
NEXT_PUBLIC_API_URL=http://localhost:5000
Start the development server:
npm run dev
App will run at: http://localhost:3000
Frontend (client/.env)
NEXT_PUBLIC_API_URL=http://localhost:5000

🔧 Backend Setup (Node.js + Express)
Navigate to the backend directory:
cd server
Install dependencies:
npm install
Create .env file:
PORT=5000
MONGO_URI=<Your MongoDB URI>
JWT_SECRET=<Your JWT Secret>
GEMINI_API_KEY=<Your Gemini API Key>
Start the backend server:
node server.js
API will run at: http://localhost:5000


📄 License
This project is licensed under the MIT License.

🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

👤 Author
Chinmaye Hg
GitHub: @chinmaye5
