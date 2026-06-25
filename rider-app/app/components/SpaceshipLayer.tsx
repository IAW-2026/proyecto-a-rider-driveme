import Image from "next/image"

const SHIPS = [
  { src: "/TIE.webp",    anim: "ship-ltr",         top: "13%", dur: 24, delay:  0, w: 108, h: 59 },
  { src: "/X-WING.webp", anim: "ship-rtl-noflip",  top: "44%", dur: 32, delay:  9, w: 88,  h: 48 },
  { src: "/TIE.webp",    anim: "ship-ltr",          top: "71%", dur: 27, delay: 17, w: 98,  h: 53 },
  { src: "/X-WING.webp", anim: "ship-rtl-noflip",  top: "25%", dur: 39, delay: 24, w: 80,  h: 44 },
  { src: "/TIE.webp",    anim: "ship-rtl",          top: "83%", dur: 21, delay:  5, w: 92,  h: 50 },
  { src: "/X-WING.webp", anim: "ship-ltr-flip",    top: "58%", dur: 35, delay: 13, w: 76,  h: 41 },
] as const

export function SpaceshipLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {SHIPS.map((ship, i) => (
        <Image
          key={i}
          src={ship.src}
          alt=""
          width={ship.w}
          height={ship.h}
          className={ship.anim}
          style={{
            top: ship.top,
            width: ship.w,
            opacity: 0.55,
            animationDuration: `${ship.dur}s`,
            animationDelay: `-${ship.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
