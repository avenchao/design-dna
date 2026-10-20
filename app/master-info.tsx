import {profiles, type TypeId} from '../lib/v2/model';
import {masterStyles} from '../lib/v2/masters';

export default function MasterInfo({type, label = '灵魂大师'}: {type: TypeId; label?: string}) {
  const p = profiles[type], m = masterStyles[type];
  return <div className="master-info" data-testid="master-info">
    <span className="master-label">{label}</span>
    <strong className="master-chinese">{p.master}</strong>
    <span className="master-english" lang="en">{p.english}</span>
    <span className="master-movement">{m.movement}</span>
    <p className="master-bio">{m.bio}</p>
    <a className="master-source" href={m.source} target="_blank" rel="noreferrer">了解这位大师 ↗</a>
  </div>;
}
