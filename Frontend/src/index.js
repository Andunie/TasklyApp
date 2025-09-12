import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamProvider } from './context/TeamContext';
import { ThemeProvider } from './context/ThemeContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SignalRProvider>
        <TeamProvider>
          <ThemeProvider>
            <App />
            <ToastContainer 
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              limit={5}
            />
          </ThemeProvider>
        </TeamProvider>
      </SignalRProvider>
    </AuthProvider>
  </QueryClientProvider>
);