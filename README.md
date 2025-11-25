![Friends Awards Banner](assets/banner.png)

# Friends Awards

A real-time, interactive voting application for hosting your own awards ceremony with friends! 🏆

## ✨ Features

- **Real-time Voting**: Users can vote instantly from their own devices.
- **Live Admin Panel**: Control the flow of the awards, reveal winners, and manage categories.
- **TV Mode**: Admin view is optimized for big screens, hiding voting options and focusing on the show.
- **Dramatic Reveals**: Suspenseful roulette animations for revealing the winner.
- **Tie-Breaker Mode**: Automatically handles ties with a dedicated tie-breaker round.
- **Results Statistics**: Highlights the "Biggest Winner" and "Most Voted" participants at the end.
- **Responsive Design**: Works great on mobile and desktop.
- **Custom Categories**: Define your own fun categories with descriptions (e.g., "Best Dressed", "Most Likely to Succeed").
- **Non-Participating Admin**: The host manages the game without influencing the results.

## 🎥 Demo

<div align="center">

### 1. Cast Your Vote 🗳️
Choose your nominee for the current category.

<img src="assets/voting.gif" alt="voting" width="600" />

<br/><br/>

### 2. Watch the Reveal 🎰
Experience the suspense as the winner is chosen!

<img src="assets/reveal.gif" alt="reveal" width="600" />

<br/><br/>

### 3. Celebrate the Winners 🏆
See the final results and statistics.

<img src="assets/thanks.png" alt="thanks" width="600" />

</div>

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
