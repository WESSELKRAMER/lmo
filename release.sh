#!/usr/bin/env bash
# Zet een nieuwe versie live voor Webflow: tag + push, daarna de links tonen.
# Gebruik: ./release.sh 0.2.0
set -euo pipefail

versie="${1:-}"
if [[ ! "$versie" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Gebruik: ./release.sh <versie>   bijv. ./release.sh 0.2.0" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Er staan nog niet-gecommitte wijzigingen. Commit eerst." >&2
  exit 1
fi

git push origin HEAD
git tag "v$versie"
git push origin "v$versie"

basis="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v$versie"

# jsDelivr onthoudt een 404 als een bestand werd opgevraagd vóór de tag er
# was. Daarom per bestand controleren en de cache legen tot het er is.
bestanden="css/lmo.min.css css/lmo.css js/lmo.min.js js/lmo.js js/zoeken.min.js js/zoeken.js data/zoekindex.json"
sleep 5
for f in $bestanden; do
  for poging in 1 2 3 4 5 6 7 8; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$basis/$f")
    [ "$code" = "200" ] && break
    curl -s -o /dev/null "https://purge.jsdelivr.net/gh/WESSELKRAMER/lmo@v$versie/$f"
    sleep 5
  done
  if [ "$code" = "200" ]; then echo "ok   $f"; else echo "FOUT $f ($code) — probeer later: curl https://purge.jsdelivr.net/gh/WESSELKRAMER/lmo@v$versie/$f"; fi
done

cat <<EOF

v$versie staat klaar. Zet in Webflow (Site settings › Custom code):

Head:
<link rel="stylesheet" href="$basis/css/lmo.min.css">

Footer:
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"></script>
<script src="$basis/js/lmo.min.js"></script>
<script src="$basis/js/zoeken.min.js"></script>

Daarna Webflow opnieuw publiceren.
EOF
