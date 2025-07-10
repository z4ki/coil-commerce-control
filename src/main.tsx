import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("React app starting");
console.log("Fetching initial data...");

createRoot(document.getElementById("root")!).render(<App />);
