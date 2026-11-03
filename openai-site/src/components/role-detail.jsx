// Adapted from shadcn/ui's MIT MailDisplay: toolbar, identity header, separators, scrollable body.
import {Bookmark, Building2, Check, Copy, ExternalLink, MapPin, ArrowLeft, RefreshCw} from 'lucide-react';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {matchJob, rolePrompt} from '@/lib/matching';
import {safeApplyURL, salaryText, locationText} from '@/components/role-card';

const date = value => value ? new Date(value).toLocaleString() : 'Not supplied';

export function RoleDetail({job, skills, effectiveSkills, hypotheticalSkill, tab, onTabChange, opening, busy, saved, onSave, onCheck, onClose, review, error}) {
  if (!job) return <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"><Building2 className="size-8 text-muted-foreground"/><h2 className="font-heading text-lg font-semibold">Take a closer look</h2><p className="max-w-xs text-sm text-muted-foreground">Choose an opportunity to read the listing, see skill evidence, and save it for later.</p></div>;
  const matched = matchJob(job, effectiveSkills);
  const apply = safeApplyURL(job.applyUrl);
  const closed = ['closed', 'not-found'].includes(opening?.state);
  return <section className="flex h-full min-h-0 flex-col bg-card" aria-label="Selected opportunity">
    <div className="flex min-h-14 flex-wrap items-center gap-2 border-b p-3">
      {onClose && <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Back to results"><ArrowLeft/></Button>}
      <Button variant="ghost" size="sm" onClick={onCheck} disabled={busy || job.source === 'Demo'}><RefreshCw/>Check status</Button>
      <Button variant="outline" size="sm" className="ml-auto" onClick={onSave} disabled={busy || saved}>{saved ? <Check/> : <Bookmark/>}{saved ? 'Saved' : 'Save role'}</Button>
      {apply && !closed ? <Button size="sm" asChild><a href={apply} target="_blank" rel="noreferrer">Apply at source<ExternalLink/></a></Button> : <Button size="sm" disabled>{closed ? (opening?.state==='not-found'?'Listing not found':'Source reports closed') : job.source==='Demo'?'Fictional role':'No application link'}</Button>}
    </div>
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 rounded-lg"><AvatarFallback className="rounded-lg font-heading">{job.company.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0 space-y-1"><p className="text-sm font-medium">{job.company}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 shrink-0"/>{locationText(job)}</p></div>
          <Badge variant="outline" className="ml-auto">{job.source === 'Demo' ? 'Fictional' : job.employmentType}</Badge>
        </div>
        <div className="space-y-3"><h2 className="font-heading text-2xl font-semibold tracking-tight">{job.title}</h2><p className="text-sm text-muted-foreground">{salaryText(job.salary)}</p><div className="flex flex-wrap gap-2">{matched.matched.map(item => <Badge key={item.skill} variant="secondary">{item.skill}{item.skill === hypotheticalSkill ? ' · preview' : ''}</Badge>)}{!matched.matchedCount && <Badge variant="outline">No selected skills mentioned</Badge>}</div></div>
        {opening && <Alert><AlertDescription>Source status: {opening.state} · {date(opening.checkedAt)}{opening.cached ? ' (cached)' : ''}. {opening.note}</AlertDescription></Alert>}
        {error && <p role="alert" className="text-sm">{error}</p>}
        {review.notice && <p role="status" className="text-sm text-muted-foreground">{review.notice}</p>}
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList><TabsTrigger value="listing">Overview</TabsTrigger><TabsTrigger value="evidence">Skill evidence</TabsTrigger><TabsTrigger value="ai">AI review</TabsTrigger></TabsList>
          <TabsContent value="listing" className="space-y-5 pt-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{job.descriptionPlain}</p>
            <Separator/>
            <div className="space-y-2 text-xs text-muted-foreground"><p>Listed locations: {job.location}</p><p>Source updated {date(job.sourceUpdatedAt)}. Listed expiry: {date(job.expiresAt)}.</p><p>{job.eligibilityNote || 'Check graduation year, experience, location and work authorization at the source. Skill mentions alone do not establish eligibility.'}</p><p>{job.source === 'Demo' ? 'Fictional example. No application is available.' : <a href="https://himalayas.app" target="_blank" rel="noreferrer" className="underline">Listing supplied by Himalayas</a>}</p></div>
          </TabsContent>
          <TabsContent value="evidence" className="space-y-5 pt-4">
            <div className="space-y-1"><h3 className="font-medium">What the listing actually says</h3><p className="text-sm text-muted-foreground">Exact mentions of your selected skills. This is evidence, not a hiring score.</p></div>
            {matched.matched.map(item => <div key={item.skill} className="space-y-2"><Badge variant="secondary">{item.skill}{item.skill === hypotheticalSkill ? ' · hypothetical' : ''}</Badge><blockquote className="border-l-2 pl-3 text-sm leading-relaxed">{item.quote}</blockquote></div>)}
            {!matched.matchedCount && <p className="text-sm text-muted-foreground">No exact selected-skill mention found. You can still read the role and decide whether to apply.</p>}
            <Separator/><h3 className="text-sm font-medium">Other skills mentioned</h3><div className="flex flex-wrap gap-2">{matchJob(job,skills).otherMentions.map(item => <Badge key={item.skill} variant="outline">{item.skill}</Badge>)}</div><p className="text-xs text-muted-foreground">These may be optional, contextual, or required. An absent skill is not proof you cannot apply.</p>
          </TabsContent>
          <TabsContent value="ai" className="space-y-4 pt-4">
            <div className="space-y-1"><h3 className="font-medium">Read between the lines—with evidence</h3><p className="text-sm text-muted-foreground">Optional ChatGPT review. You choose what to share; no automatic AI request is sent.</p></div>
            <Label htmlFor="role-prompt">1. Review and copy the prompt</Label><Textarea id="role-prompt" readOnly rows={5} value={rolePrompt(job,skills)}/>
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={review.onCopy}><Copy/>Copy prompt</Button><Button variant="outline" size="sm" asChild><a href="https://chatgpt.com/" target="_blank" rel="noreferrer">Open ChatGPT<ExternalLink/></a></Button></div>
            <Label htmlFor="role-response">2. Paste the JSON response</Label><Textarea id="role-response" rows={5} maxLength={24000} value={review.raw} onChange={event => review.onChange(event.target.value)}/>
            {review.error && <p role="status" className="text-sm text-muted-foreground">{review.error}</p>}
            <div className="flex flex-wrap gap-2"><Button size="sm" onClick={review.onImport}>Validate and attach</Button><Button size="sm" variant="outline" onClick={review.onSave} disabled={busy || !review.analysis || !review.canSave}>Save AI review</Button></div>
            <p className="text-xs text-muted-foreground">Review uses the first 5,800 characters of listing evidence. Exact quotes are checked; reasoning and model origin are not verified.</p>
            {review.analysis && <><Separator/><h3 className="text-sm font-medium">Imported review · quotes checked</h3><p className="text-sm">{review.analysis.summary}</p>{review.analysis.observations.map((item,index) => <div key={index} className="space-y-2"><blockquote className="border-l-2 pl-3 text-sm">{item.quote}</blockquote><p className="text-sm text-muted-foreground">{item.explanation}</p></div>)}<h3 className="text-sm font-medium">Uncertainties</h3><ul className="ml-4 list-disc text-sm text-muted-foreground">{review.analysis.uncertainties.map((value,index) => <li key={index}>{value}</li>)}</ul></>}
            {review.conversation.length > 0 && <><Separator/><h3 className="text-sm font-medium">Saved AI exchange</h3>{review.conversation.filter(message => message.source === 'chatgpt').map((message,index) => <div key={index} className="space-y-2"><Badge variant="outline">{message.role === 'system' ? 'Prompt' : 'Imported response'}</Badge><pre className="whitespace-pre-wrap break-words font-sans text-xs">{message.content}</pre></div>)}</>}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  </section>;
}
