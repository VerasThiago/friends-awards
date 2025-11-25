![Friends Awards Banner](/Users/verasthiago/.gemini/antigravity/brain/5b17eb7a-632a-4c9a-900d-d84da884e38f/friends_awards_banner_1764111282160.png)

# Friends Awards

A real-time, interactive voting application for hosting your own awards ceremony with friends! 🏆

## ✨ Features

- **Real-time Voting**: Users can vote instantly from their own devices.
- **Live Admin Panel**: Control the flow of the awards, reveal winners, and manage categories.
- **Dramatic Reveals**: Suspenseful animations for revealing the winner.
- **Tie-Breaker Mode**: Automatically handles ties with a dedicated tie-breaker round.
- **Responsive Design**: Works great on mobile and desktop.
- **Custom Categories**: Define your own fun categories (e.g., "Best Dressed", "Most Likely to Succeed").

## 🎥 Demo

> *Add a GIF of the voting flow here*
> ![Voting Demo](path/to/your/voting-demo.gif)

> *Add a GIF of the reveal animation here*
> ![Reveal Demo](path/to/your/reveal-demo.gif)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/VerasThiago/friends-awards.git
    cd friends-awards
    ```

2.  **Install Root Dependencies**:
    ```bash
    npm install
    ```

3.  **Install Frontend Dependencies**:
    ```bash
    cd src/frontend
    npm install
    cd ../..
    ```

### Running the Application

To start both the backend server and the frontend build process:

```bash
npm start
```

- The application will be available at `http://localhost:3000`.
- If you are on the same Wi-Fi network, other devices can access it via your local IP address (displayed in the terminal).

## ⚙️ Configuration

The application uses a JSON-based database located at `src/api/settings.json`.

For detailed configuration options, please refer to [CONFIGURATION.md](CONFIGURATION.md).

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Styling**: CSS Modules, Glassmorphism Design
- **Data**: JSON (File-based storage)

## 📄 License

This project is licensed under the ISC License.
