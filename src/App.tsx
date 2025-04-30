import { useState } from 'react'
 
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
      
      </div>
      <h1>Service workers</h1>
      <div className="card">
         11:50
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
