import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ThemeProvider } from './providers/ThemeProvider';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export default App;
