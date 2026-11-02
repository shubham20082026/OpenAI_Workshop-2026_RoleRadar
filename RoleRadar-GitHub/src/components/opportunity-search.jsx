// Composition of the official shadcn Maia Card, form and Collapsible examples.
import {Check, ChevronDown, LoaderCircle, Search, SlidersHorizontal} from 'lucide-react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {cleanSkills} from '@/lib/matching';

const STARTER_SKILLS = ['Python', 'JavaScript', 'SQL', 'Git', 'React', 'Excel'];
const TYPE_LABEL = {internship: 'Internships', entry: 'Entry-level', all: 'All remote roles'};
const LOCATION_LABEL = {India: 'India + worldwide', Worldwide: 'Worldwide', Any: 'Any country'};

export function OpportunitySearch({skillsText, onSkillsChange, query, onQueryChange, locationFilter, onLocationChange, type, onTypeChange, busy, onSearch, onSample, saveHistory, local}) {
  const skills = cleanSkills(skillsText);
  function toggleSkill(skill) {
    onSkillsChange((skills.includes(skill) ? skills.filter(value => value !== skill) : cleanSkills([...skills, skill])).join(', '));
  }
  return <Card>
    <CardHeader>
      <CardTitle>Start with your skills</CardTitle>
      <CardDescription>A few skills are enough. You can change them anytime.</CardDescription>
    </CardHeader>
    <CardContent>
      <form className="space-y-4" onSubmit={event => {event.preventDefault(); if (!busy) onSearch();}}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="search-skills">Your skills</Label>
            <Input id="search-skills" value={skillsText} onChange={event => onSkillsChange(event.target.value)} maxLength={700} placeholder="Python, SQL, Git" aria-describedby="skills-help" />
            <p id="skills-help" className="text-xs text-muted-foreground">Separate with commas, or pick a few below.</p>
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor="keywords">Role keywords (optional)</Label>
            <Input id="keywords" value={query} onChange={event => onQueryChange(event.target.value)} maxLength={100} placeholder="e.g. backend, analyst, design" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Quick skill choices">
          {STARTER_SKILLS.map(skill => <Button key={skill} size="sm" variant={skills.includes(skill) ? 'secondary' : 'outline'} type="button" aria-pressed={skills.includes(skill)} onClick={() => toggleSkill(skill)}>{skills.includes(skill) && <Check />}{skill}</Button>)}
        </div>
        <Collapsible className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CollapsibleTrigger asChild><Button type="button" variant="ghost" size="sm"><SlidersHorizontal />Filters<ChevronDown /></Button></CollapsibleTrigger>
            <Badge variant="secondary">{TYPE_LABEL[type]}</Badge>
            <Badge variant="outline">{LOCATION_LABEL[locationFilter]}</Badge>
          </div>
          <CollapsibleContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="country">Where you can apply from</Label><Select value={locationFilter} onValueChange={onLocationChange}><SelectTrigger id="country" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="India">India, including worldwide</SelectItem><SelectItem value="Worldwide">Worldwide only</SelectItem><SelectItem value="Any">Any country · check restrictions</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="role-type">Opportunity type</Label><Select value={type} onValueChange={onTypeChange}><SelectTrigger id="role-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internship">Internships</SelectItem><SelectItem value="entry">Entry-level roles</SelectItem><SelectItem value="all">All remote roles</SelectItem></SelectContent></Select></div>
            <p className="text-xs text-muted-foreground md:col-span-2">These are the source’s location and role labels. Check each listing for eligibility.</p>
          </CollapsibleContent>
        </Collapsible>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Search />}{busy ? 'Finding roles…' : 'Find roles'}</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onSample}>Try a sample search</Button>
        </div>
        <p className="text-xs text-muted-foreground">{local ? 'Work in this tab clears on reload.' : saveHistory ? 'Searches are saved to your private history.' : 'Search history is off.'} Your skill list is not shared with the job feed.</p>
      </form>
    </CardContent>
  </Card>;
}
