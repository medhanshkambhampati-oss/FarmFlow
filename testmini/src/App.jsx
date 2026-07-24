import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginRedirect from './pages/LoginRedirect.jsx';
import RegisterRedirect from './pages/RegisterRedirect.jsx';
import DashboardLayout from './pages/DashboardLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FarmDetailPage from './pages/FarmDetailPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import './App.css'
import Home from './pages/Home.jsx';
import { useState } from 'react';

export default function App() {

  const [sl,setSl] = useState(false);
  const [sr,setSr] = useState(false);

  const fsl = () => {
    setSr(false);
    setSl(true);
  }

  const fsr = () => {
    setSl(false);
    setSr(true);
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home setSl={setSl} sl={false} sr={false} fsl={fsl} fsr={fsr} setSr={setSr} />} />
        <Route path="/login" element={<LoginRedirect setSl={setSl} setSr={setSr} sl={true} sr={false} fsl={fsl} fsr={fsr} />} />
        <Route path="/register" element={<RegisterRedirect setSl={setSl} setSr={setSr} sl={false} sr={true} fsl={fsl} fsr={fsr} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="farm/:id" element={<FarmDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}
