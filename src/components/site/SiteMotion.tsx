"use client";

import { useEffect } from "react";

const revealSelector = [
  ".public-rooms .contentg",
  ".room-card-public",
  ".how-title",
  ".step-card",
  ".audience-heading .contentg",
  ".professionals-image",
  ".professionals-card",
  ".faq-item",
  ".public-about .contentg",
  ".testimonial-card",
  ".specialist-row",
  ".contact-section .contentg",
  ".contact-actions .about-btn",
].join(",");

export function SiteMotion() {
  useEffect(() => {
    const header = document.getElementById("header");
    const updateHeader = () => {
      header?.classList.toggle("header-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    elements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      window.removeEventListener("scroll", updateHeader);
      observer.disconnect();
    };
  }, []);

  return null;
}
