import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import Experience from '../app/v2-experience';
import TokenAdmin from '../app/token-admin';
import {sharedResultId,currentRoute,isAdminRoute} from '../lib/client-runtime';
import '../app/design.css';
import '../app/v2.css';
import '../app/master-results.css';
import '../app/playful.css';
import '../app/token-admin.css';

function StandaloneApp() {
  const [route,setRoute]=useState(()=>currentRoute()+window.location.search);
  useEffect(()=>{
    const update=()=>setRoute(currentRoute()+window.location.search);
    window.addEventListener('hashchange',update);
    window.addEventListener('popstate',update);
    return()=>{window.removeEventListener('hashchange',update);window.removeEventListener('popstate',update);};
  },[]);
  return isAdminRoute()?<TokenAdmin/>:<Experience key={route} shared={Boolean(sharedResultId())}/>;
}

createRoot(document.getElementById('root')!).render(<StandaloneApp/>);
