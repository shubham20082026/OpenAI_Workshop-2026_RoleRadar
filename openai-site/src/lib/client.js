export async function api(path, options={}) {
  const response=await fetch('/api'+path,{...options,credentials:'same-origin',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('The account server is unavailable. Use guest mode or check setup.');
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'The request could not be completed.');
  return data;
}
export function download(name,object){const blob=new Blob([typeof object==='string'?object:JSON.stringify(object,null,2)],{type:typeof object==='string'?'text/plain;charset=utf-8':'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
