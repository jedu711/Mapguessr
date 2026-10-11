import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './components/home'
import Game from './components/game'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element = {<Home />}/>
        <Route path='/game' element = {<Game />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
