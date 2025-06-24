import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="page-container">
      <h2>Welcome to Saut Al-Qur'an</h2>
      <p>Perfect your Qur'an recitation with guidance from certified scholars.</p>
      
      <div className="navigation">
        <Link to="/record" className="nav-btn">
          🎤 Start Recording
        </Link>
        <Link to="/feedback" className="nav-btn">
          💬 View Feedback
        </Link>
        <Link to="/scholar" className="nav-btn">
          👨‍🏫 Scholar Dashboard
        </Link>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'left' }}>
        <h3>Features:</h3>
        <ul>
          <li>🎙️ Record your Qur'an recitation</li>
          <li>🔁 Practice with repeat loops</li>
          <li>🔖 Add timestamped markers</li>
          <li>💬 Receive feedback from certified scholars</li>
          <li>📈 Track your progress</li>
          <li>📱 Works offline (PWA)</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
