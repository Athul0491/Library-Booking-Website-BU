//import { useState } from 'react'
import Home from './pages/Home'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import RoomGeneratorPage from './pages/dash/AddData'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
      <Route path="/" element={<Home />}></Route>,
      <Route path="/dash/add" element={<RoomGeneratorPage />}></Route>,
      </Route>
    )
  )
  return (
    <>
      <div className='App'>
        <RouterProvider router={router} />
      </div>

    </>
  )
}

export default App
