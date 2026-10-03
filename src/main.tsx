import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppShell from './cap/AppShell'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell>
      <App />
    </AppShell>
  </React.StrictMode>
)
