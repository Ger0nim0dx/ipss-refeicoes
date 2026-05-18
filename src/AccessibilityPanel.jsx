import { useEffect, useState } from "react";
import "./accessibility.css";

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("accessibility-font") || "normal"
  );
  const [highContrast, setHighContrast] = useState(
    localStorage.getItem("accessibility-contrast") === "true"
  );
  const [reading, setReading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("font-small", "font-large");

    if (fontSize === "small") {
      document.documentElement.classList.add("font-small");
    }

    if (fontSize === "large") {
      document.documentElement.classList.add("font-large");
    }

    localStorage.setItem("accessibility-font", fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    localStorage.setItem("accessibility-contrast", String(highContrast));
  }, [highContrast]);

  const readPage = () => {
    if (!("speechSynthesis" in window)) {
      alert("O seu browser não suporta leitura por voz.");
      return;
    }

    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }

    const mainContent = document.querySelector("main") || document.body;
    const text = mainContent.innerText
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    if (!text) {
      alert("Não existe conteúdo para ler.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-PT";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => setReading(false);
    utterance.onerror = () => setReading(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setReading(true);
  };

  return (
    <div className="accessibility-panel">
      <button
        className="accessibility-main-button"
        onClick={() => setOpen(!open)}
        aria-label="Abrir ou fechar opções de acessibilidade"
        aria-expanded={open}
      >
        ♿ Acessibilidade
      </button>

      {open && (
        <div
          className="accessibility-menu"
          role="region"
          aria-label="Opções de acessibilidade"
        >
          <button onClick={() => setFontSize("large")}>
            Aumentar letra
          </button>

          <button onClick={() => setFontSize("small")}>
            Diminuir letra
          </button>

          <button onClick={() => setFontSize("normal")}>
            Repor letra
          </button>

          <button onClick={() => setHighContrast(!highContrast)}>
            {highContrast ? "Desativar alto contraste" : "Alto contraste"}
          </button>

          <button onClick={readPage}>
            {reading ? "Parar leitura" : "Ler conteúdo"}
          </button>
        </div>
      )}
    </div>
  );
}