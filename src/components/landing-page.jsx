// Magic UI's MIT four-tile Bento Grid demo, with RoleRadar text/data/previews and violet theme.
import {useEffect,useState} from 'react';
import {ArrowRight, ArrowUpRight, Bookmark, Check, FilePenLine, Fingerprint, ListChecks, Radar, Search, ScanText} from 'lucide-react';
import {BentoCard,BentoGrid} from '@/components/magicui/bento-grid';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card,CardContent} from '@/components/ui/card';
import {api} from '@/lib/client';
import {DEMO_JOBS} from '@/lib/demo-jobs';
import {matchJob} from '@/lib/matching';

export function LandingPage({onBrowse,onSample,onSignIn}) {
  const [preview,setPreview] = useState(null);
  useEffect(() => {let active=true;api('/career/search?skills=Python%2CSQL%2CGit&location=India&type=internship&pages=1').then(data=>{if(active&&data.jobs?.length)setPreview(data);}).catch(()=>{});return()=>{active=false;};},[]);
  const jobs=preview?.jobs?.slice(0,2)||DEMO_JOBS.slice(0,2);
  const first=jobs[0];
  const evidence=matchJob(first,['Python','SQL','Git']).matched.slice(0,2);
  const cards=[
    {Icon:Fingerprint,name:'Start with what you know.',description:'A few skills are enough to begin. No CV upload required.',href:'#workspace',cta:'Explore with your skills',onNavigate:onBrowse,className:'col-span-3 lg:col-span-1 dark:bg-violet-950/30',background:<div className="absolute inset-x-6 top-6 space-y-4" aria-hidden="true"><p className="text-xs font-medium text-violet-200">EXAMPLE SKILL PROFILE</p><Card size="sm"><CardContent className="space-y-4"><p className="font-heading text-lg font-medium">Your starting point.</p><div className="flex flex-wrap gap-2">{['Python','SQL','Git'].map(skill=><Badge key={skill} variant="secondary"><Check className="size-3"/>{skill}</Badge>)}</div></CardContent></Card></div>},
    {Icon:Search,name:'Openings, straight from the source.',description:'Explore remote internships and early-career roles, with original application links.',href:'#workspace',cta:'Find opportunities',onNavigate:onBrowse,className:'col-span-3 lg:col-span-2 dark:bg-violet-600',style:{'--primary':'var(--color-white)','--muted-foreground':'var(--color-violet-100)'},background:<div className="absolute inset-x-6 top-6 space-y-3" aria-hidden="true"><p className="text-xs font-medium text-white">{preview?'SOURCE PREVIEW · HIMALAYAS':'ILLUSTRATIVE EXAMPLES · NOT OPEN ROLES'}</p>{jobs.map(job=><div key={job.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/10 p-4"><div className="min-w-0 space-y-1"><p className="truncate font-heading text-sm font-semibold text-white">{job.title}</p><p className="text-xs text-violet-100">{job.company}</p></div><ArrowUpRight className="size-5 shrink-0 text-white"/></div>)}</div>},
    {Icon:ScanText,name:'See the quote. Make your own call.',description:'Know which skills are actually mentioned. Explore one more skill without changing your profile.',href:'#workspace',cta:'Inspect the evidence',onNavigate:onBrowse,className:'col-span-3 lg:col-span-2 dark:bg-zinc-900',background:<div className="absolute inset-x-6 top-6 space-y-3" aria-hidden="true"><p className="text-xs font-medium text-violet-300">{preview?'EXACT LISTING EVIDENCE':'FICTIONAL EXAMPLE EVIDENCE'}</p>{evidence.map(item=><div key={item.skill} className="flex items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-950/30 p-3"><Badge variant="secondary">{item.skill}</Badge><blockquote className="line-clamp-2 text-sm text-zinc-100">“{item.quote}”</blockquote></div>)}</div>},
    {Icon:Bookmark,name:'Keep your next steps together.',description:'Save roles, add private notes, and track your own application progress.',href:'#signup',cta:'Create your workspace',onNavigate:()=>onSignIn('signup'),className:'col-span-3 lg:col-span-1 dark:bg-violet-950/30',background:<div className="absolute inset-x-6 top-6 space-y-3" aria-hidden="true">{[[Bookmark,'Saved opportunities'],[FilePenLine,'Your private notes']].map(([Icon,label])=><div key={label} className="flex items-center gap-3 rounded-xl border border-violet-300/20 bg-violet-950/40 p-3"><Icon className="size-4 text-violet-300"/><span className="text-sm text-violet-100">{label}</span></div>)}</div>},
  ];
  return <div className="dark min-h-svh bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <header className="flex h-20 items-center justify-between gap-4 border-b border-border"><a href="#top" className="flex items-center gap-2 font-heading text-xl font-semibold"><span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Radar className="size-5"/></span>RoleRadar</a><nav className="flex items-center gap-2"><Button variant="ghost" size="sm" asChild><a href="#how-it-works">How it works</a></Button><Button variant="outline" size="sm" onClick={()=>onSignIn('login')}>Sign in<ArrowRight/></Button></nav></header>
      <main id="top" className="space-y-10 py-12 md:py-16">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div className="max-w-2xl space-y-5"><Badge variant="secondary">For your next chapter</Badge><h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Find openings.<br/><span className="text-violet-400">See the evidence.</span></h1><p className="max-w-xl text-base leading-relaxed text-muted-foreground">Explore remote internships and early-career roles. Understand the skill mentions, follow real source links, and build a shortlist that makes sense to you.</p></div><div className="space-y-3"><Button size="lg" onClick={onBrowse}>Explore opportunities<ArrowRight/></Button><div><Button variant="ghost" size="sm" onClick={onSample}>Try the sample workspace<ArrowUpRight/></Button></div><p className="text-xs text-muted-foreground">Browse as a guest. Sample roles are clearly labeled.</p></div></div>
        <section id="how-it-works" aria-label="How RoleRadar works"><h2 className="sr-only">How RoleRadar works</h2><BentoGrid>{cards.map(card=><BentoCard key={card.name} {...card}/>)}</BentoGrid></section>
        <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row"><p>Remote listings supplied by <a href="https://himalayas.app" target="_blank" rel="noreferrer" className="text-violet-300 underline">Himalayas<ArrowUpRight className="ml-1 inline size-3"/></a>. One source, not every campus placement.</p><p>Skill mentions are evidence—not a hiring guarantee.</p></div>
      </main>
    </div>
  </div>;
}
