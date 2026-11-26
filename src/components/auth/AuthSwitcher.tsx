"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import logo from "@/assets/logo.png";

type AuthView = {
  content: ReactNode;
  heading: string;
  title: string;
  heroTitle: string;
  heroText: string;
  switchLabel: string;
};

export function AuthSwitcher({
  login,
  register,
  appName,
  googleButton,
}: {
  login: AuthView;
  register: AuthView;
  appName: string;
  googleButton: ReactNode;
}) {
  const view = usePathname() === "/register" ? "register" : "login";
  const previousView = useRef(view);
  const loginHeading = useRef<HTMLHeadingElement>(null);
  const registerHeading = useRef<HTMLHeadingElement>(null);
  const title = view === "login" ? login.title : register.title;

  useEffect(() => {
    document.title = `${title} | ${appName}`;
    if (previousView.current !== view) {
      (view === "login" ? loginHeading : registerHeading).current?.focus();
      previousView.current = view;
    }
  }, [view, title, appName]);

  function switchView() {
    window.history.pushState(null, "", view === "login" ? "/register" : "/login");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10 sm:px-6">
      <div className="w-full max-w-[920px]">
        <div className="mb-6 flex items-center justify-center gap-3 md:hidden">
          <Image src={logo} alt="" width={48} height={48} className="rounded-xl" />
          <span className="font-semibold text-brand-navy">{appName}</span>
        </div>
        <div className="auth-switcher relative isolate grid rounded-3xl bg-surface shadow-[0_24px_80px_-24px_rgb(1_38_53_/_0.22)] md:grid-cols-2" data-view={view}>
          {(["login", "register"] as const).map((name) => {
            const active = view === name;
            const content = name === "login" ? login : register;
            return (
              <section
                key={name}
                inert={!active}
                aria-labelledby={`auth-${name}-heading`}
                data-active={active}
                className={`auth-form min-w-0 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 md:row-start-1 ${name === "login" ? "md:col-start-1" : "md:col-start-2"} ${active ? "flex" : "hidden md:flex"}`}
              >
                <h1
                  id={`auth-${name}-heading`}
                  ref={name === "login" ? loginHeading : registerHeading}
                  tabIndex={-1}
                  className="mb-6 text-center text-2xl font-bold tracking-tight text-brand-navy outline-none sm:text-3xl"
                >
                  {content.heading}
                </h1>
                {googleButton}
                {content.content}
                <a
                  href={name === "login" ? "/register" : "/login"}
                  onClick={(event) => {
                    // Preserve the native link for modified clicks and without JavaScript.
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    switchView();
                  }}
                  className="mt-8 self-center rounded-sm text-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
                >
                  {content.switchLabel}
                </a>
              </section>
            );
          })}
          <div className="auth-brand-panel absolute inset-y-2 left-2 z-10 hidden w-[calc(50%_-_0.5rem)] rounded-2xl text-white md:grid">
            <div className="absolute top-8 right-8 left-8 flex items-center justify-center gap-3">
              <Image src={logo} alt="" width={48} height={48} className="rounded-xl" />
              <span className="font-semibold">{appName}</span>
            </div>
            {(["login", "register"] as const).map((name) => {
              const content = name === "login" ? login : register;
              return (
                <div key={name} inert={view !== name} data-active={view === name} className="auth-hero col-start-1 row-start-1 flex flex-col items-center justify-center gap-6 px-8 py-28 text-center lg:px-12">
                  <h2 className="text-3xl font-bold tracking-tight text-balance">{content.heroTitle}</h2>
                  <p className="text-sm leading-relaxed text-pretty text-white/90">{content.heroText}</p>
                  <button type="button" onClick={switchView} className="min-w-50 rounded-full border border-white/80 px-8 py-3 text-sm font-semibold hover:bg-white hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    {content.switchLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
