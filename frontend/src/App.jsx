import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className='min-h-screen bg-gray-90 text-white relative overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gray-600' />
        </div>
      </div>
      <div className='relative z-50 pt-20'>
      <Navbar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/login' element={<LoginPage />} />
      </Routes>
      </div>
    </div>
  )
}