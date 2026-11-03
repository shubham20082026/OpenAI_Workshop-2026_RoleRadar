import type {Metadata} from 'next';
import '../src/index.css';
export const metadata:Metadata={title:'RoleRadar — Find the opening. See the fit.',description:'Explore remote internships with exact skill evidence and a private shortlist.',robots:{index:false,follow:false}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" suppressHydrationWarning><body className="antialiased">{children}</body></html>;}
