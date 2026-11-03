// Job-data adaptation of shadcn/ui's MIT Mail and MailList example (pinned source in DESIGN-SOURCES.md).
import {useState} from 'react';
import {ArrowUpRight, Bookmark, Check, ChevronDown, LoaderCircle, Search, SlidersHorizontal, Sparkles, RefreshCw, UserRound} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useIsMobile} from '@/hooks/use-mobile';
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Skeleton} from '@/components/ui/skeleton';
import {SKILLS, cleanSkills} from '@/lib/matching';
import {locationText, salaryText} from '@/components/role-card';

const TYPE_LABEL = {internship:'Internships',entry:'Entry-level',all:'All remote roles'};
const LOCATION_LABEL = {India:'India + worldwide',Worldwide:'Worldwide',Any:'Any country'};
const STARTER_SKILLS = ['Python','JavaScript','SQL','Git','React','Excel','Java','Figma'];

export function OpportunityBrowser({catalog,jobs,selectedId,onSelect,detail,skillsText,onSkillsChange,query,onQueryChange,locationFilter,onLocationChange,type,onTypeChange,busy,onSearch,onSample,whatIf,onPreviewChange,whatIfCount,saved,displayLimit,onShowMore,onLoadMore,mode,saveHistory,error,notice,snapshot}) {
  const isMobile = useIsMobile();
  const [filterOpen,setFilterOpen] = useState(false);
  const [draftSkillsText,setDraftSkillsText] = useState(skillsText);
  const [draftLocation,setDraftLocation] = useState(locationFilter);
  const [draftType,setDraftType] = useState(type);
  const draftSkills = cleanSkills(draftSkillsText);
  const [subset,setSubset] = useState('all');
  const skills = cleanSkills(skillsText);
  const filtered = subset === 'mentions' ? jobs.filter(job => job.match?.matchedCount > 0) : jobs;
  function openFilters(){setDraftSkillsText(skillsText);setDraftLocation(locationFilter);setDraftType(type);setFilterOpen(true);}
  function applyFilters(){onSkillsChange(draftSkillsText);onLocationChange(draftLocation);onTypeChange(draftType);setFilterOpen(false);onSearch({skills:draftSkills,location:draftLocation,type:draftType});}
  const source = catalog?.source;
  const appliedType = catalog?.filters?.type || type;
  const appliedLocation = catalog?.filters?.location || locationFilter;
  const skillsSummary = skills.length > 3 ? skills.slice(0,3).join(' · ')+' + '+(skills.length-3)+' more' : skills.join(' · ');
  const resultsBody = <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-2 p-4">
        {busy && !catalog && [1,2,3].map(value => <Skeleton key={value} className="h-32 w-full rounded-lg"/>)}
        {filtered.slice(0,displayLimit).map(job => <button key={job.id} type="button" aria-label={'View '+job.title+' at '+job.company} aria-pressed={selectedId === job.id} className={cn('flex w-full flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left text-sm transition-all hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',selectedId === job.id && 'bg-secondary')} onClick={() => onSelect(job)}>
          <div className="flex w-full flex-col gap-1"><div className="flex items-center gap-2"><span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{job.company}</span>{saved.some(value => value.job_id === job.id) && <Bookmark className="ml-auto size-3 shrink-0 text-primary" aria-label="Saved"/>}</div><h3 className="font-heading text-base font-semibold leading-snug">{job.title}</h3></div>
          <p className="text-xs text-muted-foreground">{locationText(job)} · {job.employmentType}</p>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{job.descriptionPlain.slice(0,300)}{job.descriptionPlain.length>300?'…':''}</p>
          <div className="flex flex-wrap items-center gap-2">{job.match?.matchedCount > 0 && <Badge variant="secondary">{job.match.matchedCount} skills mentioned</Badge>}{job.match?.matched.slice(0,3).map(item => <Badge key={item.skill} variant="outline">{item.skill}{item.skill === whatIf ? ' · preview' : ''}</Badge>)}{job.source === 'Demo' && <Badge variant="outline">Fictional example</Badge>}</div>
          {job.salary && <p className="text-xs font-medium">{salaryText(job.salary)}</p>}
        </button>)}
        {!busy && !filtered.length && <div className="space-y-3 py-8 text-center"><Search className="mx-auto size-7 text-muted-foreground"/><h3 className="font-heading font-semibold">{catalog ? 'No roles in this view' : 'Find a place to start'}</h3><p className="text-sm text-muted-foreground">{subset === 'mentions' ? 'Try All, or change your selected skills.' : 'Try fewer keywords, change your filters, or explore the sample workspace.'}</p><Button variant="outline" size="sm" onClick={onSample}>Try sample results</Button></div>}
        {displayLimit < filtered.length && <Button variant="outline" size="sm" onClick={onShowMore}>Show more retrieved roles</Button>}
        {source && source.status !== 'demo' && (catalog.filters?.pages || 1) < 5 && <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={busy}><RefreshCw/>Load more from Himalayas</Button>}
      </div>
    </ScrollArea>;
  const list = <div className="flex h-full min-h-0 flex-col" role="region" aria-label="Opportunity results">
    <Tabs value={subset} onValueChange={setSubset} className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="flex min-h-14 flex-wrap items-center gap-2 px-4 py-2"><h2 className="font-heading text-sm font-semibold">{catalog ? filtered.length+' opportunities' : 'Opportunities'}</h2><TabsList className="ml-auto"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="mentions">Skills mentioned</TabsTrigger></TabsList></div>
    <Separator/>
    <TabsContent value="all" className="m-0 flex min-h-0 flex-1 flex-col">{resultsBody}</TabsContent>
    <TabsContent value="mentions" className="m-0 flex min-h-0 flex-1 flex-col">{resultsBody}</TabsContent>
    </Tabs>

    <div className="border-t p-3 text-xs text-muted-foreground">{source?.status === 'demo' ? 'Fictional examples · no live applications' : <>Remote roles from <a href="https://himalayas.app" target="_blank" rel="noreferrer" className="underline">Himalayas<ArrowUpRight className="ml-1 inline size-3"/></a>. Check eligibility at the source.</>}</div>
  </div>;

  return <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
    <div className="space-y-3 border-b bg-card p-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-heading text-2xl font-semibold tracking-tight">Find your next opening.</h1><p className="mt-1 text-sm text-muted-foreground">Real roles. The evidence behind each fit.</p></div><Button variant="ghost" size="sm" onClick={onSample} disabled={busy}>Try sample results<ArrowUpRight/></Button></div>
      <form className="flex flex-wrap gap-2" onSubmit={event => {event.preventDefault();if(!busy)onSearch();}}>
        <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Search roles" placeholder="Search a role, company, or keyword" value={query} onChange={event => onQueryChange(event.target.value)} maxLength={100} className="pl-9"/></div>
        <Button variant="outline" type="button" onClick={openFilters}><SlidersHorizontal/>Skills & filters{skills.length > 0 && <Badge variant="secondary">{skills.length}</Badge>}</Button>
        <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <Search/>}Find roles</Button>
      </form>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><button type="button" className="flex min-w-0 max-w-full items-center gap-1 text-left hover:underline" onClick={openFilters}><UserRound className="size-3 shrink-0"/><span className="truncate">{skills.length ? skillsSummary : 'Add your skills'}</span><ChevronDown className="size-3 shrink-0"/></button><span>{TYPE_LABEL[appliedType]} · {LOCATION_LABEL[appliedLocation]}</span><span className="md:ml-auto">{source?.status === 'demo' ? 'Fictional sample' : source ? (snapshot ? 'Saved snapshot' : source.status === 'cached' ? 'Cached feed' : source.status === 'live' ? 'Live feed' : source.status) : 'Source-backed search'}{mode !== 'account' ? ' · guest work clears on reload' : saveHistory ? ' · private history on' : ' · history off'}</span></div>
      {(error || source?.errors?.length > 0) && <p role="alert" className="text-sm">{error || source.errors.join(' ')}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2 md:px-6"><Sparkles className="size-4 text-primary"/><Label htmlFor="skill-preview" className="text-xs">What could one more skill change?</Label><Select value={whatIf} onValueChange={onPreviewChange}><SelectTrigger id="skill-preview" size="sm" className="w-full sm:w-56" aria-label="Skill to preview"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Choose a skill to preview</SelectItem>{SKILLS.filter(skill => !skills.includes(skill)).map(skill => <SelectItem key={skill} value={skill}>Preview {skill}</SelectItem>)}</SelectContent></Select><span className="text-xs text-muted-foreground">{whatIf === 'none' ? 'Preview only. Your profile stays unchanged.' : whatIfCount+' retrieved roles mention '+whatIf+' · hypothetical'}</span></div>
    <div className="min-h-0 flex-1">{isMobile ? list : <ResizablePanelGroup orientation="horizontal"><ResizablePanel defaultSize="38%" minSize="30%" maxSize="55%">{list}</ResizablePanel><ResizableHandle withHandle/><ResizablePanel defaultSize="62%" minSize="40%">{detail}</ResizablePanel></ResizablePanelGroup>}</div>
    <Sheet open={filterOpen} onOpenChange={setFilterOpen}><SheetContent className="w-full sm:max-w-md"><SheetHeader><SheetTitle>Your search, your skills.</SheetTitle><SheetDescription>Use what you know today. These changes apply to this search; save your profile in Settings when you want to keep them.</SheetDescription></SheetHeader><ScrollArea className="min-h-0 flex-1"><div className="space-y-6 px-6 py-2"><div className="space-y-3"><Label htmlFor="search-skills">Your skills</Label><Input id="search-skills" value={draftSkillsText} onChange={event => setDraftSkillsText(event.target.value)} maxLength={700} placeholder="Python, SQL, Git"/><p className="text-xs text-muted-foreground">Separate skills with commas, or pick a few.</p><div className="flex flex-wrap gap-2">{STARTER_SKILLS.map(skill => <Button type="button" key={skill} size="sm" aria-pressed={draftSkills.includes(skill)} variant={draftSkills.includes(skill) ? 'secondary' : 'outline'} onClick={() => setDraftSkillsText((draftSkills.includes(skill) ? draftSkills.filter(value => value !== skill) : cleanSkills([...draftSkills,skill])).join(', '))}>{draftSkills.includes(skill) && <Check/>}{skill}</Button>)}</div></div><div className="space-y-3"><Label htmlFor="role-type">Opportunity type</Label><Select value={draftType} onValueChange={setDraftType}><SelectTrigger id="role-type" className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="internship">Internships</SelectItem><SelectItem value="entry">Entry-level roles</SelectItem><SelectItem value="all">All remote roles</SelectItem></SelectContent></Select></div><div className="space-y-3"><Label htmlFor="country">Listed applicant locations</Label><Select value={draftLocation} onValueChange={setDraftLocation}><SelectTrigger id="country" className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="India">India, including worldwide</SelectItem><SelectItem value="Worldwide">Worldwide only</SelectItem><SelectItem value="Any">Any country · check restrictions</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Location and type are source labels. Check graduation year, experience and other conditions in each listing.</p></div><Collapsible className="space-y-3"><CollapsibleTrigger asChild><Button variant="ghost" size="sm">About these results<ChevronDown/></Button></CollapsibleTrigger><CollapsibleContent className="space-y-3 text-xs text-muted-foreground"><p>Your skills and keywords stay on our server. Only country/type/page filters go to the source.</p>{source && source.status !== 'demo' && <p>Retrieved {source.fetchedAt ? new Date(source.fetchedAt).toLocaleString() : 'Not supplied'}. Examined {source.examined} of {source.totalReported} source-reported listings. Only retrieved pages are ranked. Saved account searches retain the first 20 results.</p>}<p>{catalog?.limitations?.join(' ')}</p></CollapsibleContent></Collapsible></div></ScrollArea><SheetFooter><Button onClick={applyFilters} disabled={busy}>Show opportunities<Search/></Button><p className="text-xs text-muted-foreground">Skill mentions are not a proficiency test or hiring probability.</p></SheetFooter></SheetContent></Sheet>
  </div>;
}
