//import { useState } from 'react'
import Home from './pages/Home'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import RoomGeneratorPage from './pages/dash/AddData'
import { GlobalApiProvider } from './contexts/GlobalApiContext';

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
      <GlobalApiProvider>
        <div className='App'>
          <RouterProvider router={router} />
        </div>
      </GlobalApiProvider>
    </>
  )
}

export default App
