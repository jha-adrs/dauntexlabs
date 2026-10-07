// Homoglyph / confusable-character detection.
//
// DATA: the CONFUSABLES table below is a generated subset of Unicode's confusables.txt
// (Unicode Security Mechanisms, UTS #39), version 18.0.0:
//   https://www.unicode.org/Public/security/latest/confusables.txt
// Kept: single-code-point sources in the Cyrillic, Greek, Armenian, Cherokee, fullwidth
// (U+FF01–FF5E) and Mathematical Alphanumeric Symbols blocks whose prototype is plain
// printable ASCII. Format: "<hex code point>=<ASCII lookalike>", space separated.
//
// © 2026 Unicode®, Inc. Unicode and the Unicode Logo are registered trademarks of
// Unicode, Inc. in the U.S. and other countries. Data used under the Unicode License v3
// (https://www.unicode.org/license.txt); terms of use: https://www.unicode.org/terms_of_use.html
//
// This module is lazy-imported by components/tools/HomoglyphDetector.tsx.

export type Hit = {
  /** Position in code points (what a person counts), not UTF-16 units. */
  index: number
  char: string
  codePoint: number
  /** ASCII it imitates; '' for invisible characters. */
  looksLike: string
  script: string
}

const DATA = [
  "37F=J 384=' 391=A 392=B 395=E 396=Z 397=H 399=l 39A=K 39C=M 39D=N 39F=O 3A1=P 3A4=T",
  "3A5=Y 3A7=X 3B1=a 3B3=y 3B9=i 3BD=v 3BF=o 3C1=p 3C3=o 3C5=u 3D2=Y 3DC=F 3E8=2 3EC=6",
  "3ED=o 3F1=p 3F2=c 3F3=j 3F8=p 3F9=C 3FA=M 405=S 406=l 408=J 410=A 412=B 415=E 417=3",
  "41A=K 41C=M 41D=H 41E=O 420=P 421=C 422=T 423=Y 425=X 42B=bl 42C=b 42E=lO 430=a 431=6",
  "433=r 435=e 43E=o 440=p 441=c 443=y 445=x 448=w 455=s 456=i 458=j 461=w 474=V 475=v",
  "478=Oy 479=oy 491=r' 4AE=Y 4AF=y 4BA=h 4BB=h 4BD=e 4C0=l 4CF=l 4D4=AE 4D5=ae 4E0=3 501=d",
  "50C=G 51A=Q 51B=q 51C=W 51D=w 545=3 54D=U 54F=S 555=O 55A=' 55B=' 55D=' 560=rn 561=w",
  "563=q 566=q 570=h 575=j 578=n 57C=n 57D=u 581=g 582=i 584=f 585=o 586=$ 589=: 13A0=D",
  "13A1=R 13A2=T 13A5=i 13A9=Y 13AA=A 13AB=J 13AC=E 13AE=? 13B3=W 13B7=M 13BB=H 13BD=Y 13C0=G 13C2=h",
  "13C3=Z 13CE=4 13CF=b 13D2=R 13D4=W 13D5=S 13D9=V 13DA=S 13DE=L 13DF=C 13E2=P 13E6=K 13E7=d 13EE=6",
  "13F3=G 13F4=B 1C82=o 1C83=c 1C84=7 1FBD=' 1FBF=' 1FC0=~ 1FFE=' A644=2 A647=i A698=OO A699=oo AB75=i",
  "AB81=r AB83=w AB93=z AB9E=4 ABA4=w ABA9=v ABAA=s ABAF=c ABBE=6 FF01=! FF02='' FF03=# FF04=$ FF06=&",
  "FF07=' FF08=( FF09=) FF0A=* FF0B=+ FF0C=, FF0E=. FF0F=/ FF10=O FF11=l FF12=2 FF13=3 FF14=4 FF15=5",
  "FF16=6 FF17=7 FF18=8 FF19=9 FF1A=: FF1B=; FF1C=< FF1D== FF1E=> FF1F=? FF20=@ FF21=A FF22=B FF23=C",
  "FF24=D FF25=E FF26=F FF27=G FF28=H FF29=l FF2A=J FF2B=K FF2C=L FF2D=M FF2E=N FF2F=O FF30=P FF31=Q",
  "FF32=R FF33=S FF34=T FF35=U FF36=V FF37=W FF38=X FF39=Y FF3A=Z FF3B=[ FF3C=\\ FF3D=] FF3E=^ FF3F=_",
  "FF40=' FF41=a FF42=b FF43=c FF44=d FF45=e FF46=f FF47=g FF48=h FF49=i FF4A=j FF4B=k FF4C=l FF4D=rn",
  "FF4E=n FF4F=o FF50=p FF51=q FF52=r FF53=s FF54=t FF55=u FF56=v FF57=w FF58=x FF59=y FF5A=z FF5B={",
  "FF5C=l FF5D=} FF5E=~ 1D400=A 1D401=B 1D402=C 1D403=D 1D404=E 1D405=F 1D406=G 1D407=H 1D408=l 1D409=J 1D40A=K",
  "1D40B=L 1D40C=M 1D40D=N 1D40E=O 1D40F=P 1D410=Q 1D411=R 1D412=S 1D413=T 1D414=U 1D415=V 1D416=W 1D417=X 1D418=Y",
  "1D419=Z 1D41A=a 1D41B=b 1D41C=c 1D41D=d 1D41E=e 1D41F=f 1D420=g 1D421=h 1D422=i 1D423=j 1D424=k 1D425=l 1D426=rn",
  "1D427=n 1D428=o 1D429=p 1D42A=q 1D42B=r 1D42C=s 1D42D=t 1D42E=u 1D42F=v 1D430=w 1D431=x 1D432=y 1D433=z 1D434=A",
  "1D435=B 1D436=C 1D437=D 1D438=E 1D439=F 1D43A=G 1D43B=H 1D43C=l 1D43D=J 1D43E=K 1D43F=L 1D440=M 1D441=N 1D442=O",
  "1D443=P 1D444=Q 1D445=R 1D446=S 1D447=T 1D448=U 1D449=V 1D44A=W 1D44B=X 1D44C=Y 1D44D=Z 1D44E=a 1D44F=b 1D450=c",
  "1D451=d 1D452=e 1D453=f 1D454=g 1D456=i 1D457=j 1D458=k 1D459=l 1D45A=rn 1D45B=n 1D45C=o 1D45D=p 1D45E=q 1D45F=r",
  "1D460=s 1D461=t 1D462=u 1D463=v 1D464=w 1D465=x 1D466=y 1D467=z 1D468=A 1D469=B 1D46A=C 1D46B=D 1D46C=E 1D46D=F",
  "1D46E=G 1D46F=H 1D470=l 1D471=J 1D472=K 1D473=L 1D474=M 1D475=N 1D476=O 1D477=P 1D478=Q 1D479=R 1D47A=S 1D47B=T",
  "1D47C=U 1D47D=V 1D47E=W 1D47F=X 1D480=Y 1D481=Z 1D482=a 1D483=b 1D484=c 1D485=d 1D486=e 1D487=f 1D488=g 1D489=h",
  "1D48A=i 1D48B=j 1D48C=k 1D48D=l 1D48E=rn 1D48F=n 1D490=o 1D491=p 1D492=q 1D493=r 1D494=s 1D495=t 1D496=u 1D497=v",
  "1D498=w 1D499=x 1D49A=y 1D49B=z 1D49C=A 1D49E=C 1D49F=D 1D4A2=G 1D4A5=J 1D4A6=K 1D4A9=N 1D4AA=O 1D4AB=P 1D4AC=Q",
  "1D4AE=S 1D4AF=T 1D4B0=U 1D4B1=V 1D4B2=W 1D4B3=X 1D4B4=Y 1D4B5=Z 1D4B6=a 1D4B7=b 1D4B8=c 1D4B9=d 1D4BB=f 1D4BD=h",
  "1D4BE=i 1D4BF=j 1D4C0=k 1D4C1=l 1D4C2=rn 1D4C3=n 1D4C5=p 1D4C6=q 1D4C7=r 1D4C8=s 1D4C9=t 1D4CA=u 1D4CB=v 1D4CC=w",
  "1D4CD=x 1D4CE=y 1D4CF=z 1D4D0=A 1D4D1=B 1D4D2=C 1D4D3=D 1D4D4=E 1D4D5=F 1D4D6=G 1D4D7=H 1D4D8=l 1D4D9=J 1D4DA=K",
  "1D4DB=L 1D4DC=M 1D4DD=N 1D4DE=O 1D4DF=P 1D4E0=Q 1D4E1=R 1D4E2=S 1D4E3=T 1D4E4=U 1D4E5=V 1D4E6=W 1D4E7=X 1D4E8=Y",
  "1D4E9=Z 1D4EA=a 1D4EB=b 1D4EC=c 1D4ED=d 1D4EE=e 1D4EF=f 1D4F0=g 1D4F1=h 1D4F2=i 1D4F3=j 1D4F4=k 1D4F5=l 1D4F6=rn",
  "1D4F7=n 1D4F8=o 1D4F9=p 1D4FA=q 1D4FB=r 1D4FC=s 1D4FD=t 1D4FE=u 1D4FF=v 1D500=w 1D501=x 1D502=y 1D503=z 1D504=A",
  "1D505=B 1D507=D 1D508=E 1D509=F 1D50A=G 1D50D=J 1D50E=K 1D50F=L 1D510=M 1D511=N 1D512=O 1D513=P 1D514=Q 1D516=S",
  "1D517=T 1D518=U 1D519=V 1D51A=W 1D51B=X 1D51C=Y 1D51E=a 1D51F=b 1D520=c 1D521=d 1D522=e 1D523=f 1D524=g 1D525=h",
  "1D526=i 1D527=j 1D528=k 1D529=l 1D52A=rn 1D52B=n 1D52C=o 1D52D=p 1D52E=q 1D52F=r 1D530=s 1D531=t 1D532=u 1D533=v",
  "1D534=w 1D535=x 1D536=y 1D537=z 1D538=A 1D539=B 1D53B=D 1D53C=E 1D53D=F 1D53E=G 1D540=l 1D541=J 1D542=K 1D543=L",
  "1D544=M 1D546=O 1D54A=S 1D54B=T 1D54C=U 1D54D=V 1D54E=W 1D54F=X 1D550=Y 1D552=a 1D553=b 1D554=c 1D555=d 1D556=e",
  "1D557=f 1D558=g 1D559=h 1D55A=i 1D55B=j 1D55C=k 1D55D=l 1D55E=rn 1D55F=n 1D560=o 1D561=p 1D562=q 1D563=r 1D564=s",
  "1D565=t 1D566=u 1D567=v 1D568=w 1D569=x 1D56A=y 1D56B=z 1D56C=A 1D56D=B 1D56E=C 1D56F=D 1D570=E 1D571=F 1D572=G",
  "1D573=H 1D574=l 1D575=J 1D576=K 1D577=L 1D578=M 1D579=N 1D57A=O 1D57B=P 1D57C=Q 1D57D=R 1D57E=S 1D57F=T 1D580=U",
  "1D581=V 1D582=W 1D583=X 1D584=Y 1D585=Z 1D586=a 1D587=b 1D588=c 1D589=d 1D58A=e 1D58B=f 1D58C=g 1D58D=h 1D58E=i",
  "1D58F=j 1D590=k 1D591=l 1D592=rn 1D593=n 1D594=o 1D595=p 1D596=q 1D597=r 1D598=s 1D599=t 1D59A=u 1D59B=v 1D59C=w",
  "1D59D=x 1D59E=y 1D59F=z 1D5A0=A 1D5A1=B 1D5A2=C 1D5A3=D 1D5A4=E 1D5A5=F 1D5A6=G 1D5A7=H 1D5A8=l 1D5A9=J 1D5AA=K",
  "1D5AB=L 1D5AC=M 1D5AD=N 1D5AE=O 1D5AF=P 1D5B0=Q 1D5B1=R 1D5B2=S 1D5B3=T 1D5B4=U 1D5B5=V 1D5B6=W 1D5B7=X 1D5B8=Y",
  "1D5B9=Z 1D5BA=a 1D5BB=b 1D5BC=c 1D5BD=d 1D5BE=e 1D5BF=f 1D5C0=g 1D5C1=h 1D5C2=i 1D5C3=j 1D5C4=k 1D5C5=l 1D5C6=rn",
  "1D5C7=n 1D5C8=o 1D5C9=p 1D5CA=q 1D5CB=r 1D5CC=s 1D5CD=t 1D5CE=u 1D5CF=v 1D5D0=w 1D5D1=x 1D5D2=y 1D5D3=z 1D5D4=A",
  "1D5D5=B 1D5D6=C 1D5D7=D 1D5D8=E 1D5D9=F 1D5DA=G 1D5DB=H 1D5DC=l 1D5DD=J 1D5DE=K 1D5DF=L 1D5E0=M 1D5E1=N 1D5E2=O",
  "1D5E3=P 1D5E4=Q 1D5E5=R 1D5E6=S 1D5E7=T 1D5E8=U 1D5E9=V 1D5EA=W 1D5EB=X 1D5EC=Y 1D5ED=Z 1D5EE=a 1D5EF=b 1D5F0=c",
  "1D5F1=d 1D5F2=e 1D5F3=f 1D5F4=g 1D5F5=h 1D5F6=i 1D5F7=j 1D5F8=k 1D5F9=l 1D5FA=rn 1D5FB=n 1D5FC=o 1D5FD=p 1D5FE=q",
  "1D5FF=r 1D600=s 1D601=t 1D602=u 1D603=v 1D604=w 1D605=x 1D606=y 1D607=z 1D608=A 1D609=B 1D60A=C 1D60B=D 1D60C=E",
  "1D60D=F 1D60E=G 1D60F=H 1D610=l 1D611=J 1D612=K 1D613=L 1D614=M 1D615=N 1D616=O 1D617=P 1D618=Q 1D619=R 1D61A=S",
  "1D61B=T 1D61C=U 1D61D=V 1D61E=W 1D61F=X 1D620=Y 1D621=Z 1D622=a 1D623=b 1D624=c 1D625=d 1D626=e 1D627=f 1D628=g",
  "1D629=h 1D62A=i 1D62B=j 1D62C=k 1D62D=l 1D62E=rn 1D62F=n 1D630=o 1D631=p 1D632=q 1D633=r 1D634=s 1D635=t 1D636=u",
  "1D637=v 1D638=w 1D639=x 1D63A=y 1D63B=z 1D63C=A 1D63D=B 1D63E=C 1D63F=D 1D640=E 1D641=F 1D642=G 1D643=H 1D644=l",
  "1D645=J 1D646=K 1D647=L 1D648=M 1D649=N 1D64A=O 1D64B=P 1D64C=Q 1D64D=R 1D64E=S 1D64F=T 1D650=U 1D651=V 1D652=W",
  "1D653=X 1D654=Y 1D655=Z 1D656=a 1D657=b 1D658=c 1D659=d 1D65A=e 1D65B=f 1D65C=g 1D65D=h 1D65E=i 1D65F=j 1D660=k",
  "1D661=l 1D662=rn 1D663=n 1D664=o 1D665=p 1D666=q 1D667=r 1D668=s 1D669=t 1D66A=u 1D66B=v 1D66C=w 1D66D=x 1D66E=y",
  "1D66F=z 1D670=A 1D671=B 1D672=C 1D673=D 1D674=E 1D675=F 1D676=G 1D677=H 1D678=l 1D679=J 1D67A=K 1D67B=L 1D67C=M",
  "1D67D=N 1D67E=O 1D67F=P 1D680=Q 1D681=R 1D682=S 1D683=T 1D684=U 1D685=V 1D686=W 1D687=X 1D688=Y 1D689=Z 1D68A=a",
  "1D68B=b 1D68C=c 1D68D=d 1D68E=e 1D68F=f 1D690=g 1D691=h 1D692=i 1D693=j 1D694=k 1D695=l 1D696=rn 1D697=n 1D698=o",
  "1D699=p 1D69A=q 1D69B=r 1D69C=s 1D69D=t 1D69E=u 1D69F=v 1D6A0=w 1D6A1=x 1D6A2=y 1D6A3=z 1D6A4=i 1D6A5=j 1D6A8=A",
  "1D6A9=B 1D6AC=E 1D6AD=Z 1D6AE=H 1D6B0=l 1D6B1=K 1D6B3=M 1D6B4=N 1D6B6=O 1D6B8=P 1D6BB=T 1D6BC=Y 1D6BE=X 1D6C2=a",
  "1D6C4=y 1D6CA=i 1D6CE=v 1D6D0=o 1D6D2=p 1D6D4=o 1D6D6=u 1D6E0=p 1D6E2=A 1D6E3=B 1D6E6=E 1D6E7=Z 1D6E8=H 1D6EA=l",
  "1D6EB=K 1D6ED=M 1D6EE=N 1D6F0=O 1D6F2=P 1D6F5=T 1D6F6=Y 1D6F8=X 1D6FC=a 1D6FE=y 1D704=i 1D708=v 1D70A=o 1D70C=p",
  "1D70E=o 1D710=u 1D71A=p 1D71C=A 1D71D=B 1D720=E 1D721=Z 1D722=H 1D724=l 1D725=K 1D727=M 1D728=N 1D72A=O 1D72C=P",
  "1D72F=T 1D730=Y 1D732=X 1D736=a 1D738=y 1D73E=i 1D742=v 1D744=o 1D746=p 1D748=o 1D74A=u 1D754=p 1D756=A 1D757=B",
  "1D75A=E 1D75B=Z 1D75C=H 1D75E=l 1D75F=K 1D761=M 1D762=N 1D764=O 1D766=P 1D769=T 1D76A=Y 1D76C=X 1D770=a 1D772=y",
  "1D778=i 1D77C=v 1D77E=o 1D780=p 1D782=o 1D784=u 1D78E=p 1D790=A 1D791=B 1D794=E 1D795=Z 1D796=H 1D798=l 1D799=K",
  "1D79B=M 1D79C=N 1D79E=O 1D7A0=P 1D7A3=T 1D7A4=Y 1D7A6=X 1D7AA=a 1D7AC=y 1D7B2=i 1D7B6=v 1D7B8=o 1D7BA=p 1D7BC=o",
  "1D7BE=u 1D7C8=p 1D7CA=F 1D7CE=O 1D7CF=l 1D7D0=2 1D7D1=3 1D7D2=4 1D7D3=5 1D7D4=6 1D7D5=7 1D7D6=8 1D7D7=9 1D7D8=O",
  "1D7D9=l 1D7DA=2 1D7DB=3 1D7DC=4 1D7DD=5 1D7DE=6 1D7DF=7 1D7E0=8 1D7E1=9 1D7E2=O 1D7E3=l 1D7E4=2 1D7E5=3 1D7E6=4",
  "1D7E7=5 1D7E8=6 1D7E9=7 1D7EA=8 1D7EB=9 1D7EC=O 1D7ED=l 1D7EE=2 1D7EF=3 1D7F0=4 1D7F1=5 1D7F2=6 1D7F3=7 1D7F4=8",
  "1D7F5=9 1D7F6=O 1D7F7=l 1D7F8=2 1D7F9=3 1D7FA=4 1D7FB=5 1D7FC=6 1D7FD=7 1D7FE=8 1D7FF=9",
].join(' ')

const CONFUSABLES = new Map<number, string>()
for (const tok of DATA.split(' ')) {
  const eq = tok.indexOf('=')
  CONFUSABLES.set(parseInt(tok.slice(0, eq), 16), tok.slice(eq + 1))
}

/**
 * Zero-width / invisible characters: ZWSP, ZWNJ, ZWJ, word joiner, BOM, soft hyphen,
 * Mongolian vowel separator, plus bidi embedding/override/isolate controls
 * (used in "Trojan Source" attacks) and LRM/RLM marks.
 */
export const ZERO_WIDTH = new Set<number>([
  0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad, 0x180e,
  0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
])

const SCRIPTS: [number, number, string][] = [
  [0x0370, 0x03ff, 'Greek'],
  [0x0400, 0x052f, 'Cyrillic'],
  [0x0530, 0x058f, 'Armenian'],
  [0x13a0, 0x13ff, 'Cherokee'],
  [0x1c80, 0x1c8f, 'Cyrillic'],
  [0x1f00, 0x1fff, 'Greek'],
  [0x2de0, 0x2dff, 'Cyrillic'],
  [0xa640, 0xa69f, 'Cyrillic'],
  [0xab70, 0xabbf, 'Cherokee'],
  [0xff01, 0xff5e, 'Fullwidth'],
  [0x1d400, 0x1d7ff, 'Mathematical'],
]

function scriptOf(cp: number): string {
  for (const [a, b, name] of SCRIPTS) if (cp >= a && cp <= b) return name
  return 'Other'
}

export function findConfusables(text: string): Hit[] {
  const hits: Hit[] = []
  let index = 0
  for (const char of text) {
    const cp = char.codePointAt(0)!
    if (ZERO_WIDTH.has(cp)) {
      hits.push({ index, char, codePoint: cp, looksLike: '', script: 'Invisible' })
    } else {
      const like = CONFUSABLES.get(cp)
      if (like !== undefined) hits.push({ index, char, codePoint: cp, looksLike: like, script: scriptOf(cp) })
    }
    index++
  }
  return hits
}

/** ASCII "skeleton": lookalikes replaced by the ASCII they imitate, invisibles removed. */
export function skeleton(text: string): string {
  let out = ''
  for (const char of text) {
    const cp = char.codePointAt(0)!
    if (ZERO_WIDTH.has(cp)) continue
    out += CONFUSABLES.get(cp) ?? char
  }
  return out
}

/** The text with only the invisible characters removed. */
export function removeInvisible(text: string): string {
  let out = ''
  for (const char of text) if (!ZERO_WIDTH.has(char.codePointAt(0)!)) out += char
  return out
}

export function formatCodePoint(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
}
