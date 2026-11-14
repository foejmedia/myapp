'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import './styles/learn-quran.css';
import './styles/tracker.css';
import TrackerPanel from './components/TrackerPanel';
import { useQaidaTracker } from './lib/useQaidaTracker';
import { lessonPct, summary } from './lib/progress';

interface Lesson {
    id: number;
    title: string;
    description: string;
    items: any[];
}

export default function LearnQuranPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/learn-quran')
            .then(res => res.json())
            .then(data => {
                setLessons(data.curriculum.lessons);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load lessons', err);
                setLoading(false);
            });
    }, []);

    const totalItems = lessons.reduce((acc, l) => acc + l.items.length, 0);
    const tracker = useQaidaTracker();
    const tracking = tracker.status === 'ready' && !!tracker.today;
    const infos = useMemo(() => lessons.map(l => ({ id: l.id, title: l.title, total: l.items.length })), [lessons]);
    const nextId = tracking ? summary(tracker.progress, infos, tracker.today).next?.id : undefined;

    return (
        <div className="learn-quran-page">
            {/* ── Hero ── */}
            <div className="lq-hero">
                <div className="lq-container">
                    <div className="lq-hero-label">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>menu_book</span>
                        Noorani Qaida Course
                    </div>
                    <h1>Learn to Read the Quran</h1>
                    <p>
                        Master the Arabic alphabet and Quran reading rules with interactive audio lessons.
                        Start from the basics and progress to advanced Tajweed.
                    </p>

                    {!loading && (
                        <div className="lq-stats">
                            <div className="lq-stat">
                                <span className="lq-stat-value">{lessons.length}</span>
                                <span className="lq-stat-label">Lessons</span>
                            </div>
                            <div className="lq-stat-divider" />
                            <div className="lq-stat">
                                <span className="lq-stat-value">{totalItems}</span>
                                <span className="lq-stat-label">Practice Items</span>
                            </div>
                            <div className="lq-stat-divider" />
                            <div className="lq-stat">
                                <span className="lq-stat-value">Free</span>
                                <span className="lq-stat-label">Always</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Lesson Grid ── */}
            <div className="lq-container">
                {!loading && lessons.length > 0 && <TrackerPanel tracker={tracker} lessons={infos} />}
                {loading ? (
                    <div className="lq-loading">
                        <div className="lq-spinner" />
                        Loading Curriculum…
                    </div>
                ) : (
                    <div className="lq-lesson-grid">
                        {lessons.map((lesson, i) => {
                            const info = infos[i];
                            const pct = tracking ? lessonPct(tracker.progress, info) : 0;
                            const done = tracking && !!tracker.progress.done[String(lesson.id)];
                            const isNext = tracking && nextId === lesson.id;
                            const state = done ? 'done' : isNext ? 'next' : pct > 0 ? 'progress' : '';
                            return (
                                <Link
                                    href={`/learn-quran/lesson/${lesson.id}`}
                                    key={lesson.id}
                                    className={`lq-card ${state ? `lqt-card-${state}` : ''}`}
                                >
                                    <div className="lq-card-number">{lesson.id}</div>
                                    <div className="lq-card-content">
                                        <div className="lqt-card-top">
                                            <span className="lq-card-badge">Lesson {lesson.id}</span>
                                            {done && <span className="lqt-pill lqt-pill-done">✓ Completed</span>}
                                            {!done && isNext && <span className="lqt-pill lqt-pill-next">{pct > 0 ? 'Continue' : 'Up next'}</span>}
                                            {!done && !isNext && pct > 0 && <span className="lqt-pill">In progress</span>}
                                        </div>
                                        <h3>{lesson.title}</h3>
                                        <p>{lesson.description}</p>
                                        {tracking && (
                                            <div className="lqt-card-progress" aria-label={`${Math.round(pct * 100)}% practised`}>
                                                <div className="lqt-bar"><span style={{ width: `${pct * 100}%` }} /></div>
                                                <span>{Math.round(pct * 100)}%</span>
                                            </div>
                                        )}
                                        <div className="lq-card-meta">
                                            <span style={{ fontSize: '0.8rem', color: 'var(--lq-text-muted)' }}>
                                                {lesson.items.length > 0
                                                    ? tracking
                                                        ? `${Math.round(pct * lesson.items.length)} / ${lesson.items.length} Items`
                                                        : `${lesson.items.length} Items`
                                                    : 'Practice'}
                                            </span>
                                            <span className="lq-btn-start">{done ? 'Review' : pct > 0 ? 'Continue' : 'Start Lesson'}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
