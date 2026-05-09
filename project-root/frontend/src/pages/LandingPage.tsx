import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, GitBranch, Shield, Zap } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <FileText size={22} />,
      title: "Единый поток",
      desc: "Все документы в одном месте",
    },
    {
      icon: <GitBranch size={22} />,
      title: "Согласования",
      desc: "Прозрачные маршруты",
    },
    {
      icon: <Shield size={22} />,
      title: "Контроль версий",
      desc: "Ничего не теряется",
    },
    {
      icon: <Zap size={22} />,
      title: "Скорость",
      desc: "От чертежа до подписи",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: "var(--app-bg)" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{
          backgroundColor: isDark ? "rgba(92,117,224,0.12)" : "rgba(59,79,168,0.08)",
        }}
      />

      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          backgroundColor: isDark ? "#5C75E0" : "#3B4FA8",
          boxShadow: isDark
            ? "0 0 10px rgba(92,117,224,0.6), 0 0 30px rgba(92,117,224,0.3)"
            : "0 0 10px rgba(59,79,168,0.6), 0 0 30px rgba(59,79,168,0.3)",
        }}
      />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={isDark ? "/brand/icon-dark.png" : "/brand/icon-light.png"}
            alt="ДокПоток IRIS"
            className="w-9 h-9"
            style={{ objectFit: "contain" }}
          />
          <span
            className="text-lg font-bold font-montserrat tracking-wide"
            style={{ color: "var(--app-text)" }}
          >
            ДокПоток{" "}
            <span
              className="text-sm font-bold px-1.5 py-0.5 rounded-md ml-1"
              style={{
                backgroundColor: isDark ? "#5C75E0" : "#3B4FA8",
                color: "#FFFFFF",
              }}
            >
              IRIS
            </span>
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {mounted && (
          <>
            {/* Logo big */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="mb-8"
            >
              <img
                src="/brand/logo.png"
                alt="ДокПоток IRIS"
                className="w-[200px] h-auto"
                style={{
                  filter: isDark ? "drop-shadow(0 0 20px rgba(92,117,224,0.3))" : "drop-shadow(0 0 20px rgba(59,79,168,0.2))",
                }}
              />
            </motion.div>

            {/* Slogan */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold font-montserrat text-center mb-3"
              style={{ color: "var(--app-text)" }}
            >
              От чертежа до согласования
              <br />
              <span style={{ color: isDark ? "#5C75E0" : "#3B4FA8" }}>за один поток</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center text-sm md:text-base mb-10 max-w-lg"
              style={{ color: "var(--app-text-muted)" }}
            >
              Система управления инженерной документацией для проектных и строительных компаний
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 w-full max-w-2xl"
            >
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: "1px solid var(--app-border)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      color: isDark ? "#5C75E0" : "#3B4FA8",
                      backgroundColor: isDark ? "rgba(92,117,224,0.1)" : "rgba(59,79,168,0.08)",
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-xs font-semibold text-center"
                    style={{ color: "var(--app-text)" }}
                  >
                    {f.title}
                  </span>
                  <span
                    className="text-[11px] text-center"
                    style={{ color: "var(--app-text-muted)" }}
                  >
                    {f.desc}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Enter button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: isDark ? "#5C75E0" : "#3B4FA8",
                boxShadow: isDark
                  ? "0 0 20px rgba(92,117,224,0.4), 0 4px 12px rgba(0,0,0,0.3)"
                  : "0 0 20px rgba(59,79,168,0.3), 0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              Войти в систему
              <ArrowRight size={20} />
            </motion.button>
          </>
        )}
      </div>

      {/* Footer */}
      <footer
        className="flex-shrink-0 py-4 text-center text-xs"
        style={{ color: "var(--app-text-muted)" }}
      >
        ДокПоток IRIS © 2026
      </footer>
    </div>
  );
}