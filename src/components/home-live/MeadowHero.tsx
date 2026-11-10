'use client';
/**
 * "Learn anywhere" — a calm illustrated meadow: students reading the Qur'an on rehals,
 * trees framing the sky, a mosque on the far hills. Original SVG, drawn in code.
 * Everything random is seeded, so the server and the browser draw the same scene.
 */
import Link from 'next/link';
import { useId, useMemo } from 'react';
import s from './meadow.module.css';

/* deterministic random (mulberry32) */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF = [s.leaf1, s.leaf2, s.leaf3, s.leaf4];

/** A leafy branch reaching in from the top-left corner (mirrored for the right). */
function Tree({ seed }: { seed: number }) {
  const leaves = useMemo(() => {
    const r = rng(seed);
    const centres: [number, number, number][] = [
      [30, 30, 46], [100, 58, 50], [175, 30, 40], [205, 105, 42], [238, 168, 34],
      [70, 128, 44], [150, 150, 40], [10, 110, 38], [255, 60, 30], [120, 205, 30],
    ];
    return centres.flatMap(([cx, cy, rad]) =>
      Array.from({ length: 16 }, () => {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * rad;
        return {
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d * 0.8,
          rx: 7 + r() * 9,
          ry: 4 + r() * 5,
          rot: r() * 180,
          c: LEAF[Math.floor(r() * LEAF.length)],
        };
      }),
    );
  }, [seed]);
  return (
    <g className={s.sway}>
      <path className={s.branch} d="M-20 20 C 50 45, 120 85, 200 150 S 250 200, 262 230" strokeWidth="11" />
      <path className={s.branch} d="M85 72 C 120 52, 165 40, 225 34" strokeWidth="6" />
      <path className={s.branch} d="M150 118 C 190 110, 225 90, 262 66" strokeWidth="5" />
      <path className={s.branch} d="M60 50 C 55 90, 62 120, 78 150" strokeWidth="4" />
      {leaves.map((l, i) => (
        <ellipse key={i} className={l.c} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.x} ${l.y})`} />
      ))}
    </g>
  );
}

/** Rehal (folding stand) with an open mushaf, drawn around (0,0). */
function Rehal({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <path className={s.wood} d="M-22 40 L18 2 M18 40 L-22 2" strokeWidth="5" />
      <path className={s.cover} d="M-30 2 L-2 -10 L0 12 L-27 24 Z" />
      <path className={s.cover} d="M0 -10 L30 -2 L27 20 L0 12 Z" />
      <path className={s.page} d="M-27 0 L-2 -11 L-1 9 L-24 20 Z" />
      <path className={s.page} d="M1 -11 L27 -4 L25 16 L1 9 Z" />
      <path className={s.pageLine} d="M-22 3 L-7 -3 M-21 8 L-7 2 M-20 13 L-8 8 M6 -5 L21 -1 M6 0 L21 4 M6 5 L20 9" />
    </g>
  );
}

type Kind = 'kufi' | 'hijab' | 'plain';

/** A student seen from behind, seated in the grass; drawn around (600,600). */
function Student({ kind, shirt }: { kind: Kind; shirt: string }) {
  return (
    <g>
      {kind === 'hijab' ? (
        <>
          <path className={shirt} d="M546 600 C 542 560, 546 522, 558 498 C 566 482, 582 474, 600 474 C 618 474, 634 482, 642 498 C 654 522, 658 560, 654 600 Z" />
          {/* hijab: a rounded head, drawn in at the neck, draping over the shoulders */}
          <path className={s.hijab} d="M600 396 C 623 396, 635 413, 634 436 C 633 452, 627 458, 629 466 C 642 474, 653 488, 657 522 C 636 531, 564 531, 543 522 C 547 488, 558 474, 571 466 C 573 458, 567 452, 566 436 C 565 413, 577 396, 600 396 Z" />
          <path className={s.hijabShade} d="M618 402 C 632 414, 636 434, 632 452 C 630 460, 634 468, 646 480 C 652 492, 655 506, 657 522 C 650 525, 643 527, 636 528 C 634 500, 628 480, 622 466 C 618 450, 624 426, 618 402 Z" />
          <path className={s.fold} d="M586 470 Q600 478 614 470" />
        </>
      ) : (
        <>
          <path className={shirt} d="M548 600 C 544 560, 546 520, 556 494 C 564 474, 580 466, 600 466 C 620 466, 636 474, 644 494 C 654 520, 656 560, 652 600 Z" />
          <path className={s.shade} d="M630 480 C 642 500, 648 540, 646 600 L652 600 C 656 560, 654 520, 644 494 Z" />
          <path className={s.fold} d="M586 469 Q600 477 614 469 M598 500 Q596 540 600 590" />
          <rect className={s.skin} x="590" y="444" width="20" height="26" rx="7" />
          <ellipse className={s.skin} cx="574" cy="433" rx="4.5" ry="7.5" />
          <ellipse className={s.skin} cx="626" cy="433" rx="4.5" ry="7.5" />
          <ellipse className={s.hair} cx="600" cy="428" rx="26" ry="29" />
          {kind === 'kufi' ? (
            <path className={s.kufi} d="M575 418 C 578 395, 622 395, 625 418 Z" />
          ) : (
            <path className={s.hairShine} d="M584 410 C 592 402, 606 401, 614 406" />
          )}
        </>
      )}
    </g>
  );
}

function Daisy({ x, y, r, big }: { x: number; y: number; r: number; big?: boolean }) {
  return (
    // the animated group is inside the positioned one: a CSS transform would replace the attribute
    <g transform={`translate(${x} ${y}) scale(${r})`}>
      <g className={big ? s.bob : undefined}>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <ellipse key={a} className={s.petal} cx="0" cy="-5" rx="2.6" ry="5" transform={`rotate(${a})`} />
        ))}
        <circle className={s.flowerEye} r="2.6" />
      </g>
    </g>
  );
}

export default function MeadowHero() {
  const uid = useId().replace(/:/g, '');
  const g = (n: string) => `${uid}-${n}`;

  const { blades, flowers, farFlowers, stars } = useMemo(() => {
    const r = rng(7);
    const blades = Array.from({ length: 230 }, () => {
      const x = r() * 1230 - 15;
      const y = 588 + r() * 58;
      const h = 16 + r() * 34;
      const lean = (r() - 0.5) * 16;
      return { d: `M${x.toFixed(1)} ${y.toFixed(1)} q${(lean / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}`, c: Math.floor(r() * 3) };
    });
    const flowers = Array.from({ length: 34 }, () => ({ x: r() * 1200, y: 590 + r() * 46, r: 0.9 + r() * 0.9 }));
    const farFlowers = Array.from({ length: 70 }, () => ({ x: r() * 1200, y: 505 + r() * 75, r: 0.6 + r() * 1.1 }));
    const stars = Array.from({ length: 40 }, () => ({ x: r() * 1200, y: r() * 330, r: 0.6 + r() * 1.2 }));
    return { blades, flowers, farFlowers, stars };
  }, []);

  return (
    <section className={s.meadow} aria-labelledby={g('title')}>
      <svg className={s.art} viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.skyTop} />
            <stop offset="1" className={s.skyBottom} />
          </linearGradient>
          <radialGradient id={g('glow')} cx="0.5" cy="0.62" r="0.5">
            <stop offset="0" className={s.glowIn} />
            <stop offset="1" className={s.glowOut} />
          </radialGradient>
          <linearGradient id={g('field')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.fieldTop} />
            <stop offset="1" className={s.fieldBottom} />
          </linearGradient>
        </defs>

        {/* sky, soft glow, rings */}
        <rect width="1200" height="640" fill={`url(#${g('sky')})`} />
        <rect width="1200" height="640" fill={`url(#${g('glow')})`} />
        <g className={s.stars}>
          {stars.map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={st.r} />
          ))}
        </g>
        <g className={s.rings}>
          {[360, 500, 640, 780].map(rad => (
            <circle key={rad} cx="600" cy="760" r={rad} />
          ))}
        </g>

        {/* birds */}
        <g className={s.birds}>
          <path d="M985 268 q8 -7 16 0 q8 -7 16 0" />
          <path d="M1030 296 q6 -5 12 0 q6 -5 12 0" />
          <path d="M150 300 q6 -5 12 0 q6 -5 12 0" />
        </g>

        {/* far hills + mosque */}
        <path className={s.hillFar} d="M0 452 C 150 410, 290 430, 430 416 S 700 404, 830 418 S 1060 404, 1200 428 L1200 640 L0 640 Z" />
        <g className={s.mosque}>
          <rect x="852" y="404" width="72" height="18" rx="2" />
          <path d="M862 406 a26 26 0 0 1 52 0 z" />
          <rect x="886" y="372" width="4" height="10" rx="2" />
          <path d="M888 366 l2.5 5 h-5 z" />
          <rect x="934" y="366" width="7" height="52" rx="2" />
          <path d="M934 368 l3.5 -12 l3.5 12 z" />
          <rect x="836" y="378" width="6" height="40" rx="2" />
          <path d="M836 380 l3 -10 l3 10 z" />
        </g>
        <path className={s.hillMid} d="M0 478 C 210 446, 390 462, 570 452 S 920 446, 1200 462 L1200 640 L0 640 Z" />
        <path d="M0 506 C 300 484, 900 486, 1200 502 L1200 640 L0 640 Z" fill={`url(#${g('field')})`} />

        {/* distant flowers */}
        <g className={s.farFlowers}>
          {farFlowers.map((f, i) => (
            <circle key={i} cx={f.x} cy={f.y} r={f.r} />
          ))}
        </g>

        {/* book stacks */}
        <g className={s.books}>
          {[
            [70, 548, 96, s.bookA], [76, 532, 86, s.bookB], [66, 516, 92, s.bookC], [74, 500, 82, s.bookA], [70, 486, 88, s.bookD],
            [1046, 556, 100, s.bookC], [1052, 540, 90, s.bookD], [1044, 524, 96, s.bookB], [1054, 508, 84, s.bookA],
          ].map(([x, y, w, c], i) => (
            <g key={i}>
              <rect className={c as string} x={x as number} y={y as number} width={w as number} height="15" rx="2.5" />
              <rect className={s.bookPages} x={(x as number) + 4} y={(y as number) + 3} width={(w as number) - 10} height="3" rx="1.5" />
            </g>
          ))}
        </g>

        {/* students */}
        <g transform="translate(300 590) scale(0.74) translate(-600 -600)">
          <Student kind="hijab" shirt={s.dressCream} />
          <g transform="translate(518 568)">
            <Rehal flip />
          </g>
        </g>
        <g transform="translate(925 586) scale(0.68) translate(-600 -600)">
          <Student kind="plain" shirt={s.shirtBlue} />
          <g transform="translate(518 566)">
            <Rehal flip />
          </g>
        </g>
        <g>
          <Student kind="kufi" shirt={s.shirtWhite} />
          <g transform="translate(686 566)">
            <Rehal />
          </g>
        </g>

        {/* foreground grass and daisies */}
        <path className={s.grassBase} d="M0 600 C 200 588, 400 596, 600 590 S 1000 586, 1200 596 L1200 640 L0 640 Z" />
        <g className={s.grass}>
          {blades.map((b, i) => (
            <path key={i} d={b.d} className={[s.blade1, s.blade2, s.blade3][b.c]} />
          ))}
        </g>
        {flowers.map((f, i) => (
          <Daisy key={i} x={f.x} y={f.y} r={f.r} big={i % 4 === 0} />
        ))}

        {/* trees framing the top corners */}
        <g className={s.trees}>
          <Tree seed={11} />
          <g transform="translate(1200 0) scale(-1 1)">
            <Tree seed={23} />
          </g>
        </g>
      </svg>

      <div className={s.content}>
        <p className={s.kicker}>
          <span lang="ar" dir="rtl" className={s.kickerAr}>
            اقْرَأْ
          </span>
          <span>A calm place to learn</span>
        </p>
        <h2 id={g('title')} className={s.title}>
          Learn the Qur’an
          <span>a little every day</span>
        </h2>
        <p className={s.lead}>
          Read with translation, listen to beautiful recitations, learn Arabic words and memorize at your own pace — free, right in your browser.
        </p>
        <div className={s.ctas}>
          <Link href="/read-quran/1" className={s.primary}>
            Start reading <span aria-hidden>+</span>
          </Link>
          <Link href="/learn-1-min" className={s.secondary}>
            Learn in 1 minute <span aria-hidden>+</span>
          </Link>
        </div>
        <p className={s.facts}>114 surahs · 6,236 ayahs · word by word</p>
      </div>
    </section>
  );
}
