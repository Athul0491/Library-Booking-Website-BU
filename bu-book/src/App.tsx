//import { useState } from 'react'
import Home from './pages/Home'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

function App() {
  //console.log(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Home />}>
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
