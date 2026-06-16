import { useEffect, useState } from 'react';

interface LiveClockProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function LiveClock({ className, style }: LiveClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={className} style={style}>
      {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
