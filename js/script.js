/* ============================================================
   Kit Completo 2026 — script.js
   JavaScript puro (sin librerías)
   - Acordeón accesible del FAQ
   - Animación de aparición al hacer scroll
   - Año automático en el pie de página
   - Botón de compra
   - Cronómetro de oferta (cuenta regresiva de 24 horas, rolling)
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initAccordion();
    initScrollReveal();
    initYear();
    initCheckout();
    initBonusDownload();
    initCountdown();
  });

  /* ---------- Acordeón del FAQ ---------- */
  function initAccordion() {
    var triggers = document.querySelectorAll(".acc-trigger");

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = trigger.closest(".acc-item");
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        var isOpen = trigger.getAttribute("aria-expanded") === "true";

        // Cierra todos los demás (comportamiento de un solo abierto)
        triggers.forEach(function (other) {
          if (other !== trigger) {
            other.setAttribute("aria-expanded", "false");
            var otherItem = other.closest(".acc-item");
            var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
            otherItem.classList.remove("open");
            if (otherPanel) otherPanel.style.maxHeight = null;
          }
        });

        // Alterna el actual
        if (isOpen) {
          trigger.setAttribute("aria-expanded", "false");
          item.classList.remove("open");
          panel.style.maxHeight = null;
        } else {
          trigger.setAttribute("aria-expanded", "true");
          item.classList.add("open");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll(
      ".section-title, .lead, .card, .quote, .pain-list li, .prompt-preview, .price-card, .incluye-list, .seal, .hero-copy, .hero-visual"
    );

    // Respeta la preferencia de movimiento reducido
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    targets.forEach(function (el) { el.classList.add("reveal"); });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Año automático ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Botón de compra ---------- */
  /* Reemplaza CHECKOUT_URL por el enlace de tu pasarela de pago
     (Hotmart, Kiwify, Paddle, Stripe, etc.). Mientras esté vacío,
     el botón desplaza suavemente hacia la sección de oferta. */
  function initCheckout() {
    var CHECKOUT_URL = "https://pay.hotmart.com/S106886621B";
    var btn = document.getElementById("btn-comprar");
    if (!btn) return;

    btn.addEventListener("click", function (e) {
      if (CHECKOUT_URL) {
        window.location.href = CHECKOUT_URL;
      } else {
        e.preventDefault();
        var oferta = document.getElementById("comprar");
        if (oferta) oferta.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  /* ---------- Bonus: email + descarga ---------- */
  function initBonusDownload() {
    var form = document.getElementById("bonus-form");
    var emailInput = document.getElementById("bonus-email");
    var honeypotInput = document.getElementById("bonus-company");
    var msg = document.getElementById("bonus-msg");

    if (!form || !emailInput || !msg) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!emailInput.checkValidity()) {
        msg.textContent = "Ingresa un correo válido para descargar el bonus.";
        msg.classList.add("is-error");
        emailInput.focus();
        return;
      }

      msg.textContent = "Preparando tu descarga...";
      msg.classList.remove("is-error");

      try {
        localStorage.setItem("bonus_email", emailInput.value.trim());
      } catch (err) {
        // Si el almacenamiento está bloqueado, la descarga sigue igual.
      }

      try {
        var response = await fetch("/api/bonus-unlock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            company: honeypotInput ? honeypotInput.value : ""
          })
        });

        var payload = await response.json();

        if (!response.ok || !payload.downloadUrl) {
          throw new Error(payload.error || "No se pudo liberar la descarga.");
        }

        msg.innerHTML = "Descarga liberada. Si no abre automáticamente, <a href=\"" + payload.downloadUrl + "\" rel=\"noopener\">haz clic aquí</a>.";
        form.reset();
        window.location.assign(payload.downloadUrl);
      } catch (err) {
        msg.textContent = err.message || "Error al procesar tu solicitud. Intenta de nuevo en unos minutos.";
        msg.classList.add("is-error");
      }
    });
  }
  /* ---------- Cronómetro de oferta (24 h rolling) ---------- */
  function initCountdown() {
    var KEY = "kit2026_offer_expiry";
    var DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

    function getExpiry() {
      try {
        var stored = localStorage.getItem(KEY);
        var now = Date.now();
        if (stored && parseInt(stored, 10) > now) {
          return parseInt(stored, 10);
        }
        var expiry = now + DURATION_MS;
        localStorage.setItem(KEY, expiry.toString());
        return expiry;
      } catch (e) {
        return Date.now() + DURATION_MS;
      }
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    function tick() {
      var remaining = getExpiry() - Date.now();
      if (remaining < 0) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        remaining = 0;
      }

      var h = Math.floor(remaining / 3600000);
      var m = Math.floor((remaining % 3600000) / 60000);
      var s = Math.floor((remaining % 60000) / 1000);

      // Barra de countdown
      var elH = document.getElementById("cd-hours");
      var elM = document.getElementById("cd-minutes");
      var elS = document.getElementById("cd-seconds");
      if (elH) elH.textContent = pad(h);
      if (elM) elM.textContent = pad(m);
      if (elS) elS.textContent = pad(s);

      // Mini hero countdown
      var hH = document.getElementById("hcd-h");
      var hM = document.getElementById("hcd-m");
      var hS = document.getElementById("hcd-s");
      if (hH) hH.textContent = pad(h);
      if (hM) hM.textContent = pad(m);
      if (hS) hS.textContent = pad(s);

      // Price card countdown
      var pH = document.getElementById("pcd-h");
      var pM = document.getElementById("pcd-m");
      var pS = document.getElementById("pcd-s");
      if (pH) pH.textContent = pad(h);
      if (pM) pM.textContent = pad(m);
      if (pS) pS.textContent = pad(s);
    }

    tick();
    setInterval(tick, 1000);
  }

})();
