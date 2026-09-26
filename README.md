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

## Utskrift och lärarblad

På **Skriv ut brickor** väljer du hur många brickor, från 1 till 60. Från början är det 24. **Skapa brickor** ger varje barn en egen blandning. Finns det redan brickor frågar knappen en gång till innan de byts ut.

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

5. Om sidan ligger på https, lägg de nya filerna i listan i `sw.js` och byt namnet på `CACHE` så att webbläsaren hämtar dem på nytt.

## Cloudflare Pages

Ingen byggning och inget konto i spelet. Publicera hela mappen som en statisk sajt. Den kostnadsfria nivån räcker.

Service workern sparar spelet så att det fortfarande öppnas om nätet dör. Den startar på https och på localhost. Den startar inte när du öppnar filen direkt från datorn.

I Edge på Windows kan sidan installeras som en app när den ligger på https. Den öppnas då utan webbläsarens menyer.

## Typsnitt

Nunito används offline och licensieras under SIL Open Font License. Texten ligger i `fonts/OFL.txt`.
