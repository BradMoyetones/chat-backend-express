# Chat Backend – Express + TypeScript + Prisma + Socket.IO

---

This is the backend of a real-time chat application built with modern technologies such as **Express.js**, **TypeScript**, **Socket.IO**, **mediasoup**, and **Prisma ORM**. It serves both as a RESTful API and a real-time WebSocket server for chat functionalities, including advanced WebRTC media handling via mediasoup.

## 🚀 Tech Stack

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![mediasoup](https://img.shields.io/badge/mediasoup-4A90E2?style=for-the-badge&logo=webrtc&logoColor=white)](https://mediasoup.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

- **TypeScript** – Strongly typed JavaScript for safer, scalable code.
- **Express.js** – Fast, minimalist web framework for building APIs.
- **Socket.IO** – Real-time bi-directional communication layer for chat.
- **mediasoup** – Advanced WebRTC media server for handling audio/video calls.
- **Prisma ORM** – Modern ORM to interact with MySQL database.
- **MySQL (XAMPP)** – Relational database used for persistent storage.

---

## 📦 Installation

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository:**
```bash
git clone https://github.com/BradMoyetones/chat-backend-express.git
cd chat-backend-express
```

2.  **Install dependencies:**
```bash
npm install
```

3.  **Create a `.env` file:**
Based on `.env.example`, create a `.env` file in the root of the project and set your database URL:
```
DATABASE_URL="mysql://user:password@localhost:3306/chat_app"
```
*Ensure you replace `user`, `password`, `localhost:3306`, and `chat_app` with your MySQL database details.*

4.  **Generate the Prisma client:**
```bash
npx prisma generate
```

5.  **Run database migrations:**
```bash
npx prisma migrate dev --name init
```

6.  **Start the development server:**
```bash
npm run dev
```

---

## 🔐 HTTPS Setup with mkcert

To enable HTTPS in your local development environment without certificate errors, follow these steps:

### 1. Install `mkcert`

```bash
brew install mkcert
```

### 2. Install the local root certificate

This step sets up a local Certificate Authority (CA) trusted by your system:

```bash
mkcert -install
```

### 3. Generate a local certificate for your IP

Replace `192.168.x.x` with your local IP address (you can find it using `ifconfig` or `ipconfig`):

```bash
mkcert 192.168.x.x
```

### 4. Use the certificates in your Node.js/Express server

Example configuration:

```ts
import https from 'https'
import fs from 'fs'
import app from './app' // Your Express app

const key = fs.readFileSync('./certs/192.168.x.x-key.pem')
const cert = fs.readFileSync('./certs/192.168.x.x.pem')

const server = https.createServer({ key, cert }, app)

server.listen(3003, () => {
  console.log('HTTPS server running at https://192.168.x.x:3003')
})
```

---

### ✅ Optional: Use a custom domain like `chat.localdev`

You can generate a certificate for a custom local domain instead of using your IP:

```bash
mkcert chat.localdev
```

Then, map the domain to your local IP by editing your /etc/hosts file:

```bash
192.168.x.x    chat.localdev
```

---

## 📁 Project Structure

The backend is organized following a modular architecture:

```bash
src/
├── controllers/    # Business logic and request handlers
├── routes/         # Express route definitions
├── models/         # (Optional) Custom logic or data abstractions
├── middlewares/    # Express middlewares
├── app.ts          # Main application setup and middleware configuration
└── server.ts       # Server initialization and Socket.IO integration
```


*To export the current file/folder structure (excluding `node_modules`, `.git`, and `dist`), you can use the `tree` command:*

```bash
tree -a -I 'node_modules|.git|dist' > structure.txt
```

## 🛠️ Useful Commands

| Command                                       | Description                                       |
|----------------------------------------------|---------------------------------------------------|
| `npm run dev`                                 | Start development server using nodemon            |
| `npm run build`                               | Compile the project to JavaScript (`dist/`)       |
| `npm start`                                   | Run the compiled project                          |
| `npx prisma migrate dev --name init`          | Run initial migration and apply changes           |
| `npx prisma generate`                         | Regenerate Prisma client after schema changes     |
| `npx prisma studio`                           | Launch Prisma Studio (GUI for DB management)      |

## 📌 Notes

- Make sure **MySQL** is running via **XAMPP** or any other MySQL server.
- You can use **Prisma Studio** to visualize and edit data in your database.
- Prisma schema is located in `prisma/schema.prisma`.
- **Socket.IO** is initialized in `server.ts` and ready to handle real-time events like message sending and receiving.
- **mediasoup** is integrated for handling real-time WebRTC audio/video calls in the backend.

## 👨‍💻 Author

Built with ❤️ by [Brad](https://github.com/BradMoyetones)
