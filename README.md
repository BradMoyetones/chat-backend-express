# Chat Backend – Express + TypeScript + Prisma + Socket.IO

---

This is the backend of a real-time chat application built with modern technologies such as **Express.js**, **TypeScript**, **Socket.IO**, and **Prisma ORM**. It serves both as a RESTful API and a real-time WebSocket server for chat functionalities.

## 🚀 Tech Stack

* **TypeScript** – Strongly typed JavaScript for safer, scalable code.
* **Express.js** – Fast, minimalist web framework for building APIs.
* **Socket.IO** – Real-time bi-directional communication layer for chat.
* **Prisma ORM** – Modern ORM to interact with MySQL database.
* **MySQL (XAMPP)** – Relational database used for persistent storage.

---

## 📦 Installation

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository:**
```bash
git clone [https://github.com/your-username/your-chat-backend.git](https://github.com/your-username/your-chat-backend.git)
cd your-chat-backend
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