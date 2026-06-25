const SHIPS = [
  { src: "/TIE.png",    anim: "ship-ltr",         top: "13%", dur: 24, delay:  0, w: 108 },
  { src: "/X-WING.png", anim: "ship-rtl-noflip",  top: "44%", dur: 32, delay:  9, w: 88  },
  { src: "/TIE.png",    anim: "ship-ltr",          top: "71%", dur: 27, delay: 17, w: 98  },
  { src: "/X-WING.png", anim: "ship-rtl-noflip",  top: "25%", dur: 39, delay: 24, w: 80  },
  { src: "/TIE.png",    anim: "ship-rtl",          top: "83%", dur: 21, delay:  5, w: 92  },
  { src: "/X-WING.png", anim: "ship-ltr-flip",    top: "58%", dur: 35, delay: 13, w: 76  },
] as const

export function SpaceshipLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {SHIPS.map((ship, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={ship.src}
          alt=""
          width={ship.w}
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
