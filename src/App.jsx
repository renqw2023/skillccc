import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SkillPage from './pages/SkillPage';
import AuthorPage from './pages/AuthorPage';

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/skill/:owner/:slug" element={<SkillPage />} />
                        <Route path="/author/:username" element={<AuthorPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;
