# -*- coding: utf-8 -*-
"""
Decoupe une PLANCHE DE PERSONNAGE (4 vues) en 4 PNG transparents + enregistre le skin.

Planche attendue : fond BLANC, canevas 1536x1536, grille 2x2, cases 768x768 :
    [ FRONT ][ BACK  ]
    [DEFEAT.][SELECT ]

Usage :
    python decouper-perso.py <planche.png> <slug> [--name "Nom affiche"]
        [--grid 2x2] [--order front,back,defeated,select] [--tol 24] [--auto]
        [--dest skins|familiers|avatars] [--key chien]

Modes :
  - PAR DEFAUT : grille FIXE 2x2 (cases = largeur/2 x hauteur/2).
  - --auto : DETECTION AUTO en secours. Repere les 4 blocs non-blancs par
    projection X/Y (utile si l'IA n'a pas respecte la grille).

Destinations :
  - defaut : public/skins/<slug>/<vue>.png + maj public/skins/index.json
  - --dest familiers --key chien : public/sprites/familiers/chien-<vue>.png
  - --dest avatars  --key h1    : public/sprites/avatars/avatar-h1-<vue>.png

Un apercu <slug>_apercu.png est ecrit a la racine pour verifier la decoupe.
"""
import sys, os, json, re, math
try:
    from PIL import Image, ImageDraw
    import numpy as np
except ImportError:
    print("Pillow/numpy manquant : py -m pip install pillow numpy"); sys.exit(1)

HERE  = os.path.dirname(os.path.abspath(__file__))
SKINS = os.path.join(HERE,"public","skins")
MANI  = os.path.join(SKINS,"index.json")

def whiten_to_alpha(im, tol):
    im=im.convert("RGBA"); arr=np.array(im)
    r,g,b,a=arr[:,:,0],arr[:,:,1],arr[:,:,2],arr[:,:,3]
    white=(r>=255-tol)&(g>=255-tol)&(b>=255-tol)
    arr[:,:,3]=np.where(white,0,a)
    return Image.fromarray(arr,"RGBA")

def autocrop(im):
    bbox=im.getbbox(); return im.crop(bbox) if bbox else im

def content_mask(im, tol):
    arr=np.asarray(im.convert("RGB"))
    return np.any(arr < 255-tol, axis=2)

def segments(proj, mn):
    segs=[]; i=0; n=len(proj)
    while i<n:
        if proj[i]:
            j=i
            while j<n and proj[j]: j+=1
            segs.append([i,j]); i=j
        else: i+=1
    merged=[]
    for s in segs:
        if merged and s[0]-merged[-1][1] < mn: merged[-1][1]=s[1]
        else: merged.append(s)
    return merged

def auto_cells(im, tol, n=4):
    mask=content_mask(im,tol); H,W=mask.shape
    rows=segments(mask.any(axis=1), max(12,H//40))
    cells=[]
    for (y0,y1) in rows:
        band=mask[y0:y1,:]
        cols=segments(band.any(axis=0), max(12,W//40))
        for (x0,x1) in cols: cells.append((x0,y0,x1,y1))
    return cells[:n]

def main():
    args=sys.argv[1:]
    if len(args)<2: print(__doc__); return
    planche,slug=args[0],args[1]
    name=slug; grid="2x2"; order=["front","back","defeated","select"]
    tol=24; auto=False; dest="skins"; key=None
    i=2
    while i<len(args):
        a=args[i]
        if a=="--name": name=args[i+1]; i+=2; continue
        if a=="--grid": grid=args[i+1]; i+=2; continue
        if a=="--order": order=args[i+1].split(","); i+=2; continue
        if a=="--tol": tol=int(args[i+1]); i+=2; continue
        if a=="--auto": auto=True; i+=1; continue
        if a=="--dest": dest=args[i+1]; i+=2; continue
        if a=="--key": key=args[i+1]; i+=2; continue
        i+=1

    im=Image.open(planche).convert("RGBA"); W,H=im.size
    # boites de decoupe
    if auto:
        print("Mode DETECTION AUTO")
        boxes=auto_cells(im,tol,len(order))
        if len(boxes)<len(order):
            print(f"  Attention : {len(boxes)} blocs detectes pour {len(order)} vues.")
    else:
        cols,rows=(int(x) for x in grid.lower().split("x"))
        cw,ch=W//cols,H//rows
        print(f"Grille FIXE {cols}x{rows}, case {cw}x{ch} (planche {W}x{H})")
        boxes=[]
        for idx in range(len(order)):
            r,c=divmod(idx,cols); boxes.append((c*cw,r*ch,(c+1)*cw,(r+1)*ch))

    # apercu de controle
    prev=im.convert("RGB").copy(); dr=ImageDraw.Draw(prev)
    for (x0,y0,x1,y1) in boxes: dr.rectangle([x0,y0,x1-1,y1-1], outline=(255,0,0), width=5)
    prev.save(os.path.join(HERE, slug+"_apercu.png"))
    print("  apercu ->", slug+"_apercu.png")

    # dossier de sortie
    if dest=="skins":
        outdir=os.path.join(SKINS,slug); os.makedirs(outdir,exist_ok=True)
        def path_for(v): return os.path.join(outdir,v+".png")
    elif dest=="familiers":
        k=key or slug; outdir=os.path.join(HERE,"public","sprites","familiers"); os.makedirs(outdir,exist_ok=True)
        def path_for(v): return os.path.join(outdir,f"{k}-{v}.png")
    elif dest=="avatars":
        k=key or slug; outdir=os.path.join(HERE,"public","sprites","avatars"); os.makedirs(outdir,exist_ok=True)
        def path_for(v): return os.path.join(outdir,f"avatar-{k}-{v}.png")
    else:
        print("dest inconnue"); return

    views=[]
    for idx,view in enumerate(order):
        if idx>=len(boxes): break
        cell=whiten_to_alpha(im.crop(boxes[idx]),tol); cell=autocrop(cell)
        cell.save(path_for(view)); views.append(view)
        print("  ok ->",os.path.basename(path_for(view)))

    if dest=="skins":
        data={"skins":[]}
        if os.path.exists(MANI):
            try: data=json.load(open(MANI,encoding="utf-8"))
            except: data={"skins":[]}
        skins=[s for s in data.get("skins",[]) if s.get("slug")!=slug]
        skins.append({"slug":slug,"name":name,"views":views}); data["skins"]=skins
        json.dump(data,open(MANI,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
        print(f"index.json mis a jour : {len(skins)} skin(s). '{slug}' -> {views}")
    else:
        print(f"Depose dans public/sprites/{dest}/. Pense a declarer les vues dans customSprites.js")

if __name__=="__main__":
    main()
