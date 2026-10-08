import { useStore } from "@/lib/store";

export default function NotFoundScreen(){
  const {setPage}=useStore();
  return <div className="not-found-page">
    <header className="nf-browser"><div><i/><i/><i/></div><strong>SHOPVIBE — <span>404</span></strong><small>{typeof window!=="undefined"?window.location.pathname:"/404"}</small></header>
    <main className="nf-main">
      <div className="nf-art" aria-hidden="true"><div className="nf-number nf-four left">4</div><div className="nf-number nf-four right">4</div><div className="nf-zero"><div className="nf-face"><i/><i/><span/></div></div><svg className="nf-wind wind-one" viewBox="0 0 600 140"><path d="M20 88 C120 -20 170 145 278 52 S445 18 580 78"/></svg><svg className="nf-wind wind-two" viewBox="0 0 600 140"><path d="M5 58 C128 124 230 -22 346 74 S486 135 596 44"/></svg><span className="nf-ground"/></div>
      <div className="nf-copy"><small>ERROR 404</small><h1>Page not found</h1><p>Nothing at this address but the wind.</p><div><button onClick={()=>setPage("home")}>Take me home <span>→</span></button><button onClick={()=>history.back()}>Go back</button></div></div>
    </main>
  </div>;
}
