import ReactDOM from 'react-dom/client'
import { App } from './App'
import '@fontsource-variable/jetbrains-mono'
import '../../index.css'

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
