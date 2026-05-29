import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ThemeProvider } from './providers/ThemeProvider';
import { Toaster } from 'sonner';
import { GlobalHotkeys } from '@/components/GlobalHotkeys';

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
      <GlobalHotkeys />
    </ThemeProvider>
  );
}

export default App;
