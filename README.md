# Rim-bingo

En bild i taget på projektorn, och en egen bricka med rimord till varje barn. Allt är vanliga filer. Ingen server behövs.

Öppna `index.html` i webbläsaren. På Windows kan du dubbelklicka `Starta bingo.bat`.

## Så spelar ni

1. Skriv ut brickor. Varje ruta har en bild och rimordet med stora bokstäver. Brickan är kvadratisk och har bara rutnätet. Alla barn får samma 25 ord, men i olika ordning.
2. Tryck på **Visa bilder**. Bilderna blandas varje gång du startar, och igen när du tar **Ny omgång**.
3. Nästa bild: tryck på bilden, på pilen till höger, på mellanslag, på Enter eller på högerpilen. Pil ner går också framåt. Tillbaka: pilen till vänster, vänsterpilen eller pil upp. Samma ordning ligger kvar medan du bläddrar.
4. Bilder som redan visats samlas längst ner, från vänster, utan ord. Den stora bilden räknas också när någon ropar bingo. Ett klick på den raden byter inte bild.
5. Efter sista bilden står det **Slut**, och alla 25 bilder ligger i raden längst ner.
6. Fem i rad vinner: en rad, en kolumn eller en diagonal.

**T** eller **Visa ordet** visar ordet på den stora bilden, med stora bokstäver. Miniatyrerna har inget ord. Om ordet är framme när du tar en ny omgång, stannar det framme.

**Ny omgång** och **Meny** frågar en gång till innan något händer, så att ett klick inte avbryter leken. **Esc** går direkt till menyn. Det gäller också från utskriftssidan.

Nya brickor är alltid en ny blandning. Det går inte att ta fram samma brickor igen.

## Halloween-bingo

Välj temat **Halloween** i menyn. Det finns tre bilder: pumpa, spöke och katt. Varje bild kan komma med ett tal från 1 till 10, så det finns 30 kombinationer. Varje omgång drar alla 30, en i taget, och ingen kommer två gånger.

1. Två hjul snurrar som på en enarmad bandit. Talet stannar först, sedan bilden, till exempel 4 och en pumpa.
2. Nästa: tryck på hjulen, på pilen till höger, på mellanslag eller på Enter. Trycker du medan hjulen snurrar stannar de direkt. Tillbaka visar förra dragningen utan att snurra.
3. Varje bricka har 25 av de 30 kombinationerna. En ruta visar bilden så många gånger som talet, till exempel fyra pumpor. Det står inget tal i rutan, barnen räknar.
4. **Dragna** eller **D** visar vad som har dragits hittills: varje bild följd av sina tal i ordning. Använd den när någon ropar bingo. **Fortsätt** eller **Esc** stänger, och spelet fortsätter där det var.
5. **Ny omgång** fungerar när som helst och frågar en gång till.
6. Medan hjulen snurrar spelas ett spöklikt ljud. Ljudet tystnar när hjulen stannar. **Ljud på** eller **M** stänger av ljudet, och valet sparas till nästa gång.

Halloween-brickorna skrivs ut en per ark, så att bilderna blir stora nog att räkna. Det finns inget lärarblad för Halloween, eftersom **Dragna** gör samma jobb.

## Sammansatta ord

Välj temat **Sammansatta ord** i menyn. Två ord blir ett nytt ord, till exempel brand och bil blir brandbil. Det finns 25 ord.

1. På skärmen ligger två kort med baksidan upp, med ett plus emellan. Först vänds det vänstra kortet, sedan det högra, som i memory. Då syns till exempel en brand och en bil.
2. Barnen letar efter det sammansatta ordet på brickan. Rutan har bilden och ordet, till exempel en brandbil och BRANDBIL.
3. Nästa: tryck på korten, på pilen till höger, på mellanslag eller på Enter. Trycker du medan korten vänds blir de klara direkt. Tillbaka visar förra paret utan att vända korten.
4. **T** eller **Visa ordet** visar de två orden, till exempel BRAND + BIL, men inte svaret.
5. Paren som redan visats ligger längst ner, med de två små bilderna bredvid varandra.

När ett kort vänds hörs ett kortljud. Hoppar du över vändningen tystnar ljudet. **Ljud på** eller **M** stänger av ljudet, och valet sparas till nästa gång. Det gäller också Halloween. Brickorna skrivs ut två per ark, som rimorden. Lärarbladet visar varje rad som bild och ord, plus, bild och ord, lika med bilden och ordet på brickan. Då är det lätt att se att bilderna stämmer.

## Utskrift och lärarblad

På **Skriv ut brickor** väljer du hur många brickor, från 1 till 60. Från början är det 30. **Skapa brickor** ger varje barn en egen blandning. Om du ändrar antalet efteråt läggs nya brickor till, eller så tas de sista bort, och de andra ligger kvar. **Skriv ut brickor** skriver alltid ut så många som står i rutan. Vill du blanda om alla trycker du **Skapa brickor** igen. Knappen frågar en gång till innan brickorna byts ut.

**Skriv ut brickor** skriver ut bara brickorna, två per ark. Klipp pappret på mitten, så blir varje halva en bricka. Ett ojämnt antal lämnar den sista halvan tom.

**Visa lärarblad** visar listan på skärmen, ovanför brickorna. Varje rad har bilden du visar, ordet, och sedan bilden och ordet som står på brickan. Orden är med stora bokstäver, i bokstavsordning. **Skriv ut lärarblad** skriver ut bara den listan, även om den är dold på skärmen.

## Nytt tema

1. Kopiera mappen `themes/rim` till till exempel `themes/jul`.
2. I temats `theme.js`: byt `id`, `title` och `base`. Behåll exakt 25 par. `call` är ordet som visas stort. `card` är ordet på brickan. Båda listorna måste vara unika, och varje par behöver ett eget `id`.
3. Byt ut bilderna. `image` är bilden som visas stort. `cardImage` är bilden i rutan på brickan. Båda är filnamn inuti temamappen. Orden visas alltid med stora bokstäver, så de kan skrivas med små i filen.
4. Lägg till en rad i `index.html`, tillsammans med de andra teman och före `js/app.js`:

```html
<script src="themes/jul/theme.js"></script>
```

5. Om sidan ligger på https, lägg temats `theme.js` i listan `THEMES` i `sw.js` och byt namnet på `CACHE` så att webbläsaren hämtar filerna på nytt. Bilderna läses från temat, så de behöver inte skrivas in.

`heading`, `lead`, `hint` och `printLead` är texterna i menyn och på utskriftssidan.

Ett tema med hjul, som `themes/halloween`, har `kind: "slot"` och inga `pairs`. Det har i stället `numbers: { min: 1, max: 10 }` och minst tre `symbols`, där varje bild har `id`, `name` och `image`. Tal gånger bilder måste bli minst 25 kombinationer. `sound: "halloween"` ger ljud när hjulen snurrar. Ljuden skapas i `js/sound.js`, och temat kan utelämna `sound` för att vara tyst.

Ett tema med sammansatta ord, som `themes/sammansatta`, har `kind: "compound"` och exakt 25 `pairs`. Varje par har `id`, `first` och `second` (de två orden som visas), `firstImage` och `secondImage` (deras bilder), samt `card` och `cardImage` för ordet och bilden på brickan. Samma delord får användas i flera par, till exempel sol och bil. Varje `id` och varje `card` måste vara unikt. `sound: "flip"` ger ett kortljud när korten vänds. Utan `sound` är temat tyst.

## Cloudflare Pages

Ingen byggning och inget konto i spelet. Publicera hela mappen som en statisk sajt. Den kostnadsfria nivån räcker.

Service workern sparar spelet så att det fortfarande öppnas om nätet dör. Den startar på https och på localhost. Den startar inte när du öppnar filen direkt från datorn.

I Edge på Windows kan sidan installeras som en app när den ligger på https. Den öppnas då utan webbläsarens menyer.

## Typsnitt

Nunito används offline och licensieras under SIL Open Font License. Texten ligger i `fonts/OFL.txt`.
