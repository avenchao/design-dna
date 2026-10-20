import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import Experience from '../app/v2-experience';
import {sharedResultId} from '../lib/client-runtime';
import '../app/design.css';
import '../app/v2.css';
import '../app/master-results.css';
import '../app/playful.css';

function StandaloneApp() {
  const [id,setId]=useState(sharedResultId());
  useEffect(()=>{
    const update=()=>setId(sharedResultId());
    window.addEventListener('hashchange',update);
    window.addEventListener('popstate',update);
    return()=>{window.removeEventListener('hashchange',update);window.removeEventListener('popstate',update);};
  },[]);
  return <Experience key={id||'home'} shared={Boolean(id)}/>;
}

createRoot(document.getElementById('root')!).render(<StandaloneApp/>);
