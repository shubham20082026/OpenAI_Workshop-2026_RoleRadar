"use client";
import App from '../src/App.jsx';
import {TooltipProvider} from '../src/components/ui/tooltip';
import {useEffect,useState} from 'react';
export default function Home(){const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);return mounted?<TooltipProvider><App/></TooltipProvider>:<main className="flex min-h-screen items-center justify-center" role="status">Opening RoleRadar…</main>;}
