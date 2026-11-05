'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Logo from './Logo';

const SESSION_KEY = 'sounds-indian-opening-intro-played';
const WORDS = ['Discover', 'Trust', 'Grow'];

export default function OpeningIntro() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'words' | 'logo' | 'tagline' | 'exit'>('words');
  const [word, setWord] = useState(0);
  const finishedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // Storage can be unavailable in privacy modes; the homepage still works.
    }
    document.documentElement.classList.remove('opening-intro-active');
    setVisible(false);
  }, [clearTimers]);

  useEffect(() => {
    let played = false;
    try {
      played = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      // Ignore unavailable storage.
    }

    if (played) {
      // The inline script in layout.tsx never adds the active class in this
      // case, so the overlay is already hidden by CSS. Just unmount it.
      timersRef.current.push(window.setTimeout(() => setVisible(false), 0));
      return clearTimers;
    }

    document.documentElement.classList.add('opening-intro-active');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      timersRef.current.push(window.setTimeout(finish, 900));
    } else {
      timersRef.current.push(
        window.setTimeout(() => setWord(1), 750),
        window.setTimeout(() => setWord(2), 1500),
        window.setTimeout(() => setPhase('logo'), 2100),
        window.setTimeout(() => setPhase('tagline'), 3050),
        window.setTimeout(() => setPhase('exit'), 4200),
        window.setTimeout(finish, 5000),
      );
    }

    return () => {
      clearTimers();
      document.documentElement.classList.remove('opening-intro-active');
    };
  }, [finish, clearTimers]);

  if (!visible) return null;

  return (
    <div
      // "is-phase-*" avoids colliding with .opening-intro-words / -logo / -tagline
      className={`opening-intro is-phase-${phase}`}
      role="dialog"
      aria-label="Welcome to Sounds Indian"
      aria-modal="true"
    >
      <button type="button" className="opening-intro-skip" onClick={finish}>
        Skip intro
      </button>

      <div className="opening-intro-center">
        <div
          className={`opening-intro-words${phase === 'words' ? ' is-active' : ''}`}
          aria-hidden={phase !== 'words'}
        >
          <span key={word} className="opening-intro-word">{WORDS[word]}</span>
        </div>

        <div className={`opening-intro-brand${phase !== 'words' ? ' is-active' : ''}`}>
          <Logo
            key={phase === 'words' ? 'intro-logo-hidden' : 'intro-logo-visible'}
            variant="horizontal"
            className="opening-intro-logo"
          />
          <p className={`opening-intro-tagline${phase === 'tagline' || phase === 'exit' ? ' is-active' : ''}`}>
            Aapki pasand, apnon ki pehchaan.
          </p>
        </div>
      </div>
    </div>
  );
}