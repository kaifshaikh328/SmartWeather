import {Routes, Route} from 'react-router-dom';
import Dashbord from './pages/Dashbord';




function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashbord />} />
        
      </Routes>
    </div>
  );
}

export default App;
