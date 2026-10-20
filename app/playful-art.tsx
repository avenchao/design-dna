/* eslint-disable @next/next/no-img-element -- A pre-optimized 89 KB WebP shared by the static Pages build. */
import {homeHref} from '../lib/client-runtime';

export function DoodleStar({className=''}:{className?:string}) {
 return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 5c-2 19-7 24-26 27 19 2 24 7 26 27 3-20 8-25 27-27C40 29 35 24 32 5Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}

export default function PlayfulArt() {
 return <div className="intro-art" aria-hidden="true">
  <span className="art-blob blob-yellow"/><span className="art-blob blob-blue"/>
  <span className="art-scribble">A little weird.<br/>Very much you.</span>
  <img className="designer-mascot" src={`${homeHref()}assets/design-mascot.webp`} width="960" height="878" alt="" fetchPriority="high"/>
  <DoodleStar className="art-star star-one"/><DoodleStar className="art-star star-two"/>
  <span className="mascot-caption">创意脑袋，正在待机中。</span>
  <svg className="art-arrow" viewBox="0 0 120 80" fill="none"><path d="M108 9C107 69 41 78 12 48m0 0 23-2m-23 2 7 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
 </div>;
}
