import {renderLayout} from './components/layout.js';
import {demoJobs,jobCard} from './components/job-card.js';
renderLayout();
const jobs=document.querySelector('#recent-jobs');if(jobs)demoJobs.slice(0,5).forEach(j=>jobs.append(jobCard(j,'.')));
const search=document.querySelector('#hero-search');if(search)search.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(search);const q=new URLSearchParams();for(const [k,v] of data)if(String(v).trim())q.set(k,String(v).trim());location.href=`./pages/jobs.html?${q}`});
