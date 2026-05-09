import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

function onDarkMode() {
  return (
    <div style={{ backgroundColor: 'black', color: 'white' }}>
      Switch to Light Mode
    </div>
  )
}

function onLightMode() {
  return (
    <div style={{ backgroundColor: 'white', color: 'black' }}>
      Switch to Dark Mode
    </div>
  ) 
}
// without dependency array, useEffect will run after every render
// useEffect(() => {
//   console.log('rendered')
// });

// with empty dependency array, useEffect will run only once after the initial render
// useEffect(() => {
//   console.log('initial render');
// }, []);

// with dependency array, useEffect will run after the initial render and whenever the specified dependencies change
useEffect(() => {
  console.log('count changed:', count);
}, [count]);

useEffect(() => {
  fetch('https://api.github.com/users/rajat1793')
    .then((res) => res.json())
    .then((data) => {
      setProfile(data);
      setLoadingProfile(false);
    });
}, []);

  return (
    <>
      <h1>Welcome to Counter app</h1>
      <p className="count-display">{count}</p>
      <div className="button-row">
        <button
          type="button"
          className="counter counter-increase"
          onClick={() => setCount((count) => count + 1)}
        >
          Increase +1
        </button>
        <button
          type="button"
          className="counter counter-decrease"
          onClick={() => setCount((count) => count - 1)}
        >
          Decrease -1
        </button>
        <button
          type="button"
          className="counter"
          onClick={() => setIsDarkMode((prevMode) => !prevMode)}
        >
          {isDarkMode ? onLightMode() : onDarkMode()}
        </button>
      </div>

      {loadingProfile ? (
        <div className="profile-card skeleton-card">
          <div className="skeleton skeleton-avatar" />
          <div className="profile-info">
            <div className="skeleton skeleton-line" style={{ width: '140px' }} />
            <div className="skeleton skeleton-line" style={{ width: '90px' }} />
            <div className="skeleton skeleton-line" style={{ width: '200px' }} />
            <div className="skeleton skeleton-line" style={{ width: '160px' }} />
          </div>
        </div>
      ) : profile && (
        <div className="profile-card">
          <img src={profile.avatar_url} alt={profile.login} className="profile-avatar" />
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <p className="profile-username">@{profile.login}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <span><strong>{profile.public_repos}</strong> Repos</span>
              <span><strong>{profile.followers}</strong> Followers</span>
              <span><strong>{profile.following}</strong> Following</span>
            </div>
            <a href={profile.html_url} target="_blank" rel="noreferrer" className="profile-link">
              View on GitHub
            </a>
          </div>
        </div>
      )}
    </>
  )
}


export default App
