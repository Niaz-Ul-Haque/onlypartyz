import confetti from 'canvas-confetti'

export function celebrateRSVP() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#98D8C8']
  })
}

export function celebrateClaim() {
  confetti({
    particleCount: 30,
    spread: 40,
    origin: { y: 0.7 },
    colors: ['#FF6B9D', '#C44569', '#FFA07A']
  })
}

export function celebrateJoin() {
  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#98D8C8', '#F38181']
  }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval: NodeJS.Timeout = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

export function celebratePartyCreated() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#98D8C8', '#F38181']
  })
}
