# -*- coding: utf-8 -*-
"""
Decoupe une PLANCHE de dessins d'ACTION (grille reguliere) en PNG individuels,
OU enregistre des fichiers deja decoupes deposes a la main.

La cle = la cle du SORT (griffe, sumo, tsunami, ...). Fond transparent, cases
384x384 par defaut, 4 colonnes. Meme logique que decouper-cartes.py.

Usage (planche a decouper) :
    python decouper-actions.py <planche.png> <cle1> <cle2> ... [--cols N] [--cell 384] [--auto]

Usage (declarer des fichiers deja presents dans public/sprites/actions/) :
    python decouper-actions.py --register griffe sumo tsunami

Sortie : public/sprites/actions/<cle>.png + maj src/assets/actionArt.js
"""
import sys, os, math, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "public", "sprites", "actions")
REG  = os.path.join(HERE, "src", "assets", "actionArt.js")

def update_registry(done):
    existing={}
    if os.path.exists(REG):
        for k in re.findall(r"(\w+)\s*:\s*true", open(REG,encoding="utf-8").read()):
            existing[k]=True
    for k in done: existing[k]=True
    body=",\n  ".join(k+":true" for k in sorted(existing))
    open(REG,"w",encoding="utf-8").write(
        "// Registre des DESSINS D'ACTION deposes dans public/sprites/actions/<cle>.png\n"
        "// La cle = la cle du SORT. Rempli par decouper-actions.py.\n"
        "export const ACTION_ART = {\n  "+body+"\n}\n"
        "export function actionFileUrl(key){ return '/sprites/actions/'+key+'.png' }\n"
        "export function hasActionFile(key){ return !!ACTION_ART[key] }\n")
    print(f"actionArt.js mis a jour ({len(existing)} dessins d'action).")

def main():
    args=sys.argv[1:]
    if not args: print(__doc__); return

    # mode --register : les fichiers sont deja dans public/sprites/actions/
    if args[0]=="--register":
        keys=args[1:]
        present=[k for k in keys if os.path.exists(os.path.join(OUT,k+".png"))]
        missing=[k for k in keys if k not in present]
        if missing: print("ATTENTION, fichiers absents:", missing)
        update_registry(present); return

    try:
        from PIL import Image
    except ImportError:
        print("Pillow manquant : py -m pip install pillow"); return
    try:
        import numpy as np
    except ImportError:
        np=None

    planche=args[0]; cols=None; cell=384; auto=False; keys=[]; i=1
    while i<len(args):
        a=args[i]
        if a=="--cols": cols=int(args[i+1]); i+=2; continue
        if a=="--cell": cell=int(args[i+1]); i+=2; continue
        if a=="--auto": auto=True; i+=1; continue
        keys.append(a); i+=1
    n=len(keys)
    if n==0: print("Aucune cle fournie."); return

    im=Image.open(planche).convert("RGBA"); W,H=im.size
    os.makedirs(OUT,exist_ok=True)
    def autobox(x):
        bb=x.getbbox(); return x.crop(bb) if bb else x
    done=[]

    if auto and np is not None:
        arr=np.asarray(im); a=arr[:,:,3]
        mask = (a>16) if a.max()>0 else np.any(arr[:,:,:3]<240,axis=2)
        def segs(proj,mn):
            out=[];i=0;N=len(proj)
            while i<N:
                if proj[i]:
                    j=i
                    while j<N and proj[j]: j+=1
                    out.append([i,j]); i=j
                else: i+=1
            m=[]
            for s in out:
                if m and s[0]-m[-1][1]<mn: m[-1][1]=s[1]
                else: m.append(s)
            return m
        rows=segs(mask.any(axis=1),max(8,H//50)); cells=[]
        for (y0,y1) in rows:
            for (x0,x1) in segs(mask[y0:y1,:].any(axis=0),max(8,W//50)):
                cells.append((x0,y0,x1,y1))
        print("Mode AUTO :",len(cells),"blocs")
        for key,(x0,y0,x1,y1) in zip(keys,cells):
            autobox(im.crop((x0,y0,x1,y1))).save(os.path.join(OUT,key+".png")); done.append(key)
            print("  ok ->",key+".png")
    else:
        if not cols: cols=max(1,W//cell) if W>=cell else 4
        rows=math.ceil(n/cols); cw,ch=W//cols,H//rows
        print(f"Grille FIXE {cols}x{rows}, case {cw}x{ch}")
        for idx,key in enumerate(keys):
            r,c=divmod(idx,cols)
            autobox(im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch))).save(os.path.join(OUT,key+".png")); done.append(key)
            print("  ok ->",key+".png")
    update_registry(done)

if __name__=="__main__":
    main()
