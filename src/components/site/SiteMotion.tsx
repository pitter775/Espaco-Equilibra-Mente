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
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    elements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 35}ms`);
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
      observer.disconnect();
    };
  }, []);

  return null;
}
