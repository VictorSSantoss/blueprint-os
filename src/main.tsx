import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startHistoryRecording } from './stores/history'
import { ensureFirstTab } from './stores/tabs'
import { useSettingsStore } from './stores/settingsStore'

ensureFirstTab(useSettingsStore.getState().t('defaultOptionName'))
startHistoryRecording()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
