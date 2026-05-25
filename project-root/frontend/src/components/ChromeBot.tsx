import React from 'react';

interface ChromeBotProps {
  size?: number;
  className?: string;
  variant?: 'dark' | 'light';
}

export const ChromeBot: React.FC<ChromeBotProps> = ({ size = 48, className = '', variant = 'dark' }) => {
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ transform: 'scale(1.1)' }}>
      <div
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          animation: `botFloat-${variant} 4s ease-in-out infinite`,
          filter: isDark ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' : 'drop-shadow(0 3px 8px rgba(148,163,184,0.2))',
        }}
      >
        <div style={{ animation: `botAppear-${variant} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`, width: '100%', height: '100%', overflow: 'hidden' }}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'hidden' }}
          >
            <defs>
              <style>{`
                @keyframes botFloat-${variant} {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  25% { transform: translateY(-10px) rotate(-1deg); }
                  50% { transform: translateY(-16px) rotate(0deg); }
                  75% { transform: translateY(-6px) rotate(1deg); }
                }
                @keyframes botBlinkLeft-${variant} {
                  0%, 48%, 52%, 100% { transform: scaleY(1); }
                  50% { transform: scaleY(0.1); }
                }
                @keyframes botBlinkRight-${variant} {
                  0%, 58%, 62%, 100% { transform: scaleY(1); }
                  60% { transform: scaleY(0.1); }
                }
                @keyframes botGlow-${variant} {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
                @keyframes botSparkle-${variant} {
                  0%, 100% { opacity: 0; transform: scale(0); }
                  50% { opacity: 1; transform: scale(1); }
                }
                @keyframes botShadowPulse-${variant} {
                  0%, 100% { transform: scaleX(1); opacity: ${isDark ? 0.5 : 0.35}; }
                  25% { transform: scaleX(0.85); opacity: ${isDark ? 0.35 : 0.25}; }
                  50% { transform: scaleX(0.75); opacity: ${isDark ? 0.25 : 0.2}; }
                  75% { transform: scaleX(0.9); opacity: ${isDark ? 0.4 : 0.3}; }
                }
                @keyframes notchGlow-${variant} {
                  0%, 100% { stroke-opacity: 0.6; }
                  50% { stroke-opacity: 0.9; }
                }
                @keyframes blushPulse-${variant} {
                  0%, 100% { opacity: 0.1; }
                  50% { opacity: 0.2; }
                }
                @keyframes botAppear-${variant} {
                  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                  60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
                  100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .bot-eye-left-${variant} { animation: botBlinkLeft-${variant} 4s ease-in-out infinite; transform-origin: 215px 235px; }
                .bot-eye-right-${variant} { animation: botBlinkRight-${variant} 4s ease-in-out infinite; transform-origin: 285px 235px; }
                .bot-glow-${variant} { animation: botGlow-${variant} 3s ease-in-out infinite; }
                .bot-sparkle-${variant} { animation: botSparkle-${variant} 2.5s ease-in-out infinite; transform-origin: center; }
                .bot-sparkle-2-${variant} { animation-delay: 0.8s; }
                .bot-sparkle-3-${variant} { animation-delay: 1.5s; }
                .bot-sparkle-4-${variant} { animation-delay: 2.2s; }
                .bot-shadow-${variant} { animation: botShadowPulse-${variant} 4s ease-in-out infinite; transform-origin: 250px 380px; }
                .notch-rim-${variant} { animation: notchGlow-${variant} 3s ease-in-out infinite; }
                .blush-${variant} { animation: blushPulse-${variant} 3s ease-in-out infinite; }
              `}</style>

              <radialGradient id={`chromeBody-${variant}`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="15%" stopColor="#e8e8e8"/>
                <stop offset="35%" stopColor="#b0b0b0"/>
                <stop offset="55%" stopColor="#606060"/>
                <stop offset="75%" stopColor="#2a2a2a"/>
                <stop offset="90%" stopColor="#0f0f0f"/>
                <stop offset="100%" stopColor="#050505"/>
              </radialGradient>

              <radialGradient id={`notchInner-${variant}`} cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1a1a1a"/>
                <stop offset="40%" stopColor="#0a0a0a"/>
                <stop offset="100%" stopColor="#000000"/>
              </radialGradient>

              <linearGradient id={`highlight-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"/>
                <stop offset="30%" stopColor="#ffffff" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
              </linearGradient>

              <linearGradient id={`rimLight-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#88bbff" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#88bbff" stopOpacity="0.6"/>
              </linearGradient>

              <radialGradient id={`eyeGrad-${variant}`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="60%" stopColor="#aaccff"/>
                <stop offset="100%" stopColor="#5577aa"/>
              </radialGradient>

              <radialGradient id={`shadowGrad-${variant}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isDark ? '#000' : '#94a3b8'} stopOpacity={isDark ? 0.5 : 0.3}/>
                <stop offset="50%" stopColor={isDark ? '#000' : '#94a3b8'} stopOpacity={isDark ? 0.15 : 0.1}/>
                <stop offset="100%" stopColor={isDark ? '#000' : '#94a3b8'} stopOpacity="0"/>
              </radialGradient>

              <radialGradient id={`lightGlow-${variant}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isDark ? '#0c4a6e' : '#e0f2fe'} stopOpacity={isDark ? 0.2 : 0.3}/>
                <stop offset="60%" stopColor={isDark ? '#075985' : '#bae6fd'} stopOpacity={isDark ? 0.08 : 0.1}/>
                <stop offset="100%" stopColor={isDark ? '#0369a1' : '#7dd3fc'} stopOpacity="0"/>
              </radialGradient>

              <filter id={`shadowBlur-${variant}`}>
                <feGaussianBlur stdDeviation={isDark ? 8 : 6}/>
              </filter>
            </defs>

            {/* Shadow */}
            <ellipse className={`bot-shadow-${variant}`} cx="250" cy="380" rx="70" ry="12" fill={`url(#shadowGrad-${variant})`} filter={`url(#shadowBlur-${variant})`} opacity={isDark ? 0.5 : 0.35}/>

            {/* Floor reflection */}
            <ellipse cx="250" cy="395" rx="55" ry="3" fill={`url(#chromeBody-${variant})`} opacity={isDark ? 0.12 : 0.08}/>

            {/* Glow behind */}
            <circle cx="250" cy="250" r="140" fill={`url(#lightGlow-${variant})`} opacity="0.6"/>

            {/* Orbiting Stars — цвета вкладок navItems */}
            <g>
              <g transform="translate(230, 120)" style={{ filter: 'drop-shadow(0 0 5px rgba(59,130,246,0.7))' }}>
                <path d="M 0 -12 Q 0 0 12 0 Q 0 0 0 12 Q 0 0 -12 0 Q 0 0 0 -12 Z" fill="#3B82F6">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
                </path>
              </g>
              <animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="8s" repeatCount="indefinite"/>
            </g>
            <g>
              <g transform="translate(270, 105)" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.6))' }}>
                <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#8B5CF6">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/>
                </path>
              </g>
              <animateTransform attributeName="transform" type="rotate" from="360 250 250" to="0 250 250" dur="12s" repeatCount="indefinite"/>
            </g>
            <g>
              <g transform="translate(240, 130)" style={{ filter: 'drop-shadow(0 0 5px rgba(79,122,76,0.7))' }}>
                <path d="M 0 -10 Q 0 0 10 0 Q 0 0 0 10 Q 0 0 -10 0 Q 0 0 0 -10 Z" fill="#4F7A4C">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="5s" repeatCount="indefinite"/>
                </path>
              </g>
              <animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="10s" repeatCount="indefinite"/>
            </g>
            <g>
              <g transform="translate(260, 110)" style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' }}>
                <path d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z" fill="#D4AF37">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="3.5s" repeatCount="indefinite"/>
                </path>
              </g>
              <animateTransform attributeName="transform" type="rotate" from="360 250 250" to="0 250 250" dur="14s" repeatCount="indefinite"/>
            </g>
            <g>
              <g transform="translate(250, 115)" style={{ filter: 'drop-shadow(0 0 4px rgba(107,114,128,0.6))' }}>
                <path d="M 0 -9 Q 0 0 9 0 Q 0 0 0 9 Q 0 0 -9 0 Q 0 0 0 -9 Z" fill="#6B7280">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="4.5s" repeatCount="indefinite"/>
                </path>
              </g>
              <animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="9s" repeatCount="indefinite"/>
            </g>

            {/* Body */}
            <circle cx="250" cy="250" r="110" fill={`url(#chromeBody-${variant})`}/>

            {/* Notch */}
            <path d="M 185 200 Q 185 140 250 140 Q 315 140 315 200 Q 315 175 250 175 Q 185 175 185 200 Z" fill={`url(#notchInner-${variant})`}/>
            <path className={`notch-rim-${variant}`} d="M 185 200 Q 185 140 250 140 Q 315 140 315 200" fill="none" stroke={`url(#rimLight-${variant})`} strokeWidth="3" strokeLinecap="round"/>
            <path className={`notch-rim-${variant}`} d="M 188 198 Q 188 175 250 175 Q 312 175 312 198" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round"/>

            {/* Reflections */}
            <ellipse className={`bot-glow-${variant}`} cx="210" cy="190" rx="25" ry="18" fill={`url(#highlight-${variant})`} opacity="0.9"/>
            <rect className={`bot-glow-${variant}`} x="230" y="245" width="40" height="4" rx="2" fill="#ffffff" opacity="0.85"/>
            <path d="M 170 320 Q 250 345 330 320" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round"/>
            <path d="M 148 220 Q 140 250 148 280" fill="none" stroke="#88bbff" strokeWidth="2.5" strokeOpacity="0.4" strokeLinecap="round"/>
            <path d="M 352 220 Q 360 250 352 280" fill="none" stroke="#88bbff" strokeWidth="2.5" strokeOpacity="0.4" strokeLinecap="round"/>

            {/* Left Eye */}
            <g className={`bot-eye-left-${variant}`}>
              <ellipse cx="215" cy="235" rx="16" ry="18" fill="#223355"/>
              <ellipse cx="215" cy="235" rx="14" ry="16" fill={`url(#eyeGrad-${variant})`}/>
              <ellipse cx="210" cy="229" rx="5.5" ry="6.5" fill="#ffffff" opacity="0.95"/>
              <circle cx="219" cy="241" r="3" fill="#ffffff" opacity="0.8"/>
            </g>

            {/* Right Eye */}
            <g className={`bot-eye-right-${variant}`}>
              <ellipse cx="285" cy="235" rx="16" ry="18" fill="#223355"/>
              <ellipse cx="285" cy="235" rx="14" ry="16" fill={`url(#eyeGrad-${variant})`}/>
              <ellipse cx="280" cy="229" rx="5.5" ry="6.5" fill="#ffffff" opacity="0.95"/>
              <circle cx="289" cy="241" r="3" fill="#ffffff" opacity="0.8"/>
            </g>

            {/* Smile with SMIL */}
            <path d="M 235 270 Q 250 280 265 270" fill="none" stroke="#334477" strokeWidth="3" strokeLinecap="round">
              <animate
                attributeName="d"
                values="M 235 270 Q 250 280 265 270; M 230 268 Q 250 295 270 268; M 235 270 Q 250 280 265 270"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>

            {/* Blush */}
            <ellipse className={`blush-${variant}`} cx="195" cy="255" rx="10" ry="6" fill="#ff88aa" opacity="0.15"/>
            <ellipse className={`blush-${variant}`} cx="305" cy="255" rx="10" ry="6" fill="#ff88aa" opacity="0.15"/>

          </svg>
        </div>
      </div>
    </div>
  );
};
