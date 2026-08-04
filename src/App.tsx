import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PlayPage } from './pages/PlayPage';
import { HowPage } from './pages/HowPage';
import { MePage } from './pages/MePage';
import { PromptsPage } from './pages/PromptsPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PlayPage />} />
          <Route path="/how" element={<HowPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
