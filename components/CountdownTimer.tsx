import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  targetDate: string
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isOver: boolean
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOver: true,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false,
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.isOver) {
    return (
      <div className={`bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-center ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <PartyPopper className="w-6 h-6 text-white" />
          <h3 className="text-lg font-semibold text-white">Party Time!</h3>
          <PartyPopper className="w-6 h-6 text-white" />
        </div>
        <p className="text-white/90">The celebration is happening now!</p>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white">Time Until Party</h3>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-3xl font-bold text-white">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/80 mt-1">
            {timeLeft.days === 1 ? 'Day' : 'Days'}
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-3xl font-bold text-white">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/80 mt-1">
            {timeLeft.hours === 1 ? 'Hour' : 'Hours'}
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-3xl font-bold text-white">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/80 mt-1">
            {timeLeft.minutes === 1 ? 'Min' : 'Mins'}
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-3xl font-bold text-white">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/80 mt-1">
            {timeLeft.seconds === 1 ? 'Sec' : 'Secs'}
          </div>
        </div>
      </div>
    </div>
  )
}

function PartyPopper({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5.8 11.3L2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
    </svg>
  )
}
