import {Routes, Route, } from 'react-router-dom';
import Dashbord from './pages/Dashbord';
import Forcast from './pages/Forcast';
import Airquality from './pages/Airquaility'




function App() {
 
  return (
    <div className="App">
      <Routes>
        
        <Route path="/" element={<Dashbord />} />
        <Route onclick={Forcast} path='/Forcast' element={<Forcast/>}/>
        
      </Routes>
      
    </div>
  );
}

export default App;
