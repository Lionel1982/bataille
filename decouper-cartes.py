# -*- coding: utf-8 -*-
"""
Decoupe une PLANCHE de dessins de cartes (grille reguliere) en PNG individuels.

Convention : la planche contient N dessins ranges de GAUCHE a DROITE puis de HAUT
en BAS, dans l'ordre EXACT des cles passees en argument. Fond transparent, cases
384x384 par defaut, 4 colonnes.

Usage :
    python decouper-cartes.py <planche.png> <cle1> <cle2> ... [--cols N] [--rows M]
                              [--cell 384] [--auto]

Modes :
  - PAR DEFAUT : grille FIXE. Si --cols non fourni, deduit de --cell (largeur/cell)
    ou a defaut 4 colonnes. Les lignes sont deduites du nombre de cles.
  - --auto : DETECTION AUTOMATIQUE en secours. Repere les blocs de contenu
    (pixels non transparents) par projection sur X et Y, et decoupe sur ces blocs
    au lieu d'une grille rigide. Utile si l'IA n'a pas respecte la grille.

Sortie : public/sprites/cartes/<cle>.png + maj src/assets/cardArt.js
"""
import sys, os, math, re
try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Pillow/numpy manquant : py -m pip install pillow numpy"); sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "public", "sprites", "cartes")
ART  = os.path.join(HERE, "src", "assets", "cardArt.js")

def autobox(im):
    if im.mode != "RGBA": im = im.convert("RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

def alpha_mask(im):
    """Masque booleen des pixels 'de contenu' (alpha>16, ou non-blanc si opaque)."""
    arr = np.asarray(im.convert("RGBA"))
    a = arr[:,:,3]
    if a.max() > 0:               # il y a de la transparence -> contenu = alpha
        return a > 16
    rgb = arr[:,:,:3]             # pas d'alpha -> contenu = non-blanc
    return np.any(rgb < 240, axis=2)

def segments(proj, mn):
    """Retourne les segments [start,end) ou proj>0, en ignorant les trous < mn."""
    segs=[]; i=0; n=len(proj)
    while i<n:
        if proj[i]:
            j=i
            while j<n and proj[j]: j+=1
            segs.append([i,j]); i=j
        else: i+=1
    # fusionne les segments separes par un petit gap
    merged=[]
    for s in segs:
        if merged and s[0]-merged[-1][1] < mn: merged[-1][1]=s[1]
        else: merged.append(s)
    return merged

def auto_cells(im, n):
    """Detecte jusqu'a n cellules par projection (lignes puis colonnes)."""
    mask = alpha_mask(im)
    H,W = mask.shape
    rows = segments(mask.any(axis=1), max(8,H//50))
    cells=[]
    for (y0,y1) in rows:
        band = mask[y0:y1,:]
        cols = segments(band.any(axis=0), max(8,W//50))
        for (x0,x1) in cols:
            cells.append((x0,y0,x1,y1))
    return cells[:n]

def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__); return
    planche = args[0]
    cols = rows = None; cell=384; auto=False
    keys=[]; i=1
    while i < len(args):
        a=args[i]
        if a=="--cols": cols=int(args[i+1]); i+=2; continue
        if a=="--rows": rows=int(args[i+1]); i+=2; continue
        if a=="--cell": cell=int(args[i+1]); i+=2; continue
        if a=="--auto": auto=True; i+=1; continue
        keys.append(a); i+=1

    n=len(keys)
    if n==0: print("Aucune cle fournie."); return

    im = Image.open(planche).convert("RGBA")
    W,H = im.size
    os.makedirs(OUT, exist_ok=True)
    done=[]

    if auto:
        print("Mode DETECTION AUTO")
        cells = auto_cells(im, n)
        if len(cells) < n:
            print(f"  Attention : {len(cells)} blocs detectes pour {n} cles. "
                  f"Les cles en trop seront ignorees.")
        for key,(x0,y0,x1,y1) in zip(keys, cells):
            cellimg = autobox(im.crop((x0,y0,x1,y1)))
            cellimg.save(os.path.join(OUT,key+".png")); done.append(key)
            print("  ok ->",key+".png",f"({x1-x0}x{y1-y0})")
    else:
        if not cols: cols = max(1, W//cell) if W>=cell else 4
        if not rows: rows = math.ceil(n/cols)
        cw,ch = W//cols, H//rows
        print(f"Grille FIXE {cols}x{rows}, case {cw}x{ch} (planche {W}x{H})")
        for idx,key in enumerate(keys):
            r,c = divmod(idx, cols)
            cellimg = autobox(im.crop((c*cw, r*ch, (c+1)*cw, (r+1)*ch)))
            cellimg.save(os.path.join(OUT,key+".png")); done.append(key)
            print("  ok ->",key+".png")

    # maj cardArt.js
    existing={}
    if os.path.exists(ART):
        for k in re.findall(r"(\w+)\s*:\s*true", open(ART,encoding="utf-8").read()):
            existing[k]=True
    for k in done: existing[k]=True
    body=",\n  ".join(k+":true" for k in sorted(existing))
    open(ART,"w",encoding="utf-8").write(
        "// Registre des DESSINS de cartes (public/sprites/cartes/<cle>.png)\n"
        "// Rempli automatiquement par decouper-cartes.py.\n"
        "export const CARD_ART = {\n  "+body+"\n}\n"
        "export function cardArtUrl(key){ return '/sprites/cartes/'+key+'.png' }\n"
        "export function hasCardArt(key){ return !!CARD_ART[key] }\n")
    print(f"cardArt.js mis a jour ({len(existing)} dessins).")

if __name__=="__main__":
    main()
