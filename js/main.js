const billingToggle = document.getElementById("billingToggle");
const priceCards = document.querySelectorAll(".price-card");

function setBilling(isAnnual) {
  priceCards.forEach((card) => {
    const monthly = card.getAttribute("data-monthly");
    const yearly = card.getAttribute("data-yearly");
    const valueEl = card.querySelector(".price-value");
    const periodEl = card.querySelector(".price-period");

    if (!valueEl || !periodEl) {
      return;
    }

    if (isAnnual) {
      valueEl.textContent = `$${yearly}`;
      periodEl.textContent = "per year";
    } else {
      valueEl.textContent = `$${monthly}`;
      periodEl.textContent = "per month";
    }
  });
}

if (billingToggle) {
  billingToggle.addEventListener("change", (event) => {
    setBilling(event.target.checked);
  });
}

const supportsHover = window.matchMedia("(hover: hover)").matches;

if (supportsHover) {
  const zoomWrappers = document.querySelectorAll(".feature-media");
  const zoomScale = 3.5;
  const lensSize = 240;
  const lensRadius = lensSize / 2;
  const edgeOverhang = lensRadius * 0.35;

  zoomWrappers.forEach((wrapper) => {
    const img = wrapper.querySelector(".feature-zoom");
    const lens = wrapper.querySelector(".lens");

    if (!img || !lens) {
      return;
    }

    lens.style.width = `${lensSize}px`;
    lens.style.height = `${lensSize}px`;
    lens.style.backgroundImage = `url('${img.src}')`;
    lens.style.backgroundSize = `${zoomScale * 100}% ${zoomScale * 100}%`;

    const moveLens = (event) => {
      const rect = wrapper.getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      x = Math.max(-edgeOverhang, Math.min(x, rect.width + edgeOverhang));
      y = Math.max(-edgeOverhang, Math.min(y, rect.height + edgeOverhang));

      const xForBg = Math.max(0, Math.min(x, rect.width));
      const yForBg = Math.max(0, Math.min(y, rect.height));

      const xPercent = (xForBg / rect.width) * 100;
      const yPercent = (yForBg / rect.height) * 100;

      lens.style.left = `${x - lensRadius}px`;
      lens.style.top = `${y - lensRadius}px`;
      lens.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    };

    wrapper.addEventListener("mouseenter", () => {
      wrapper.classList.add("is-zoomed");
    });

    wrapper.addEventListener("mouseleave", () => {
      wrapper.classList.remove("is-zoomed");
    });

    wrapper.addEventListener("mousemove", moveLens);
  });
}
