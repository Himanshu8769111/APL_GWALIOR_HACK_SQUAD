import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Database, Clock, Download, Trash2, Video } from 'lucide-react';
import { fetchDrsReviews } from '../lib/supabase';

const ReviewHistory = forwardRef(function ReviewHistory(props, ref) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchDrsReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useImperativeHandle(ref, () => ({
    loadReviews,
  }));

  const getRulingColor = (ruling) =>
    ruling === 'OUT' ? 'var(--neon-red)' : 'var(--neon-green)';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section style={{ marginTop: '20px' }}>
      <div
        className="glass-panel"
        style={{ padding: '20px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: expanded ? '16px' : '0',
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <h2
            className="section-title"
            style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}
          >
            <Database size={20} style={{ color: 'var(--neon-cyan)' }} />
            DRS REVIEW <span>HISTORY</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              {reviews.length} RECORDS
            </span>
            <button
              className="neon-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                loadReviews();
              }}
            >
              REFRESH
            </button>
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '1.2rem',
                transition: 'transform 0.3s',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {expanded && (
          <>
            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                Loading review history from Supabase...
              </div>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No DRS reviews saved yet. Run an AI Decision Review and save it
                to see records here.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      transition: 'border-color 0.3s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(0, 243, 255, 0.2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.04)')
                    }
                  >
                    {/* Left: Ruling badge + info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          letterSpacing: '1px',
                          color:
                            review.ruling === 'OUT'
                              ? 'white'
                              : 'var(--text-dark)',
                          background: getRulingColor(review.ruling),
                          boxShadow:
                            review.ruling === 'OUT'
                              ? 'var(--glow-red)'
                              : 'var(--glow-green)',
                        }}
                      >
                        {review.ruling}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            marginBottom: '2px',
                          }}
                        >
                          {review.appeal_type} — {review.batsman} vs{' '}
                          {review.bowler}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Clock size={11} />
                          {formatDate(review.created_at)}
                          {review.video_url && (
                            <>
                              <span style={{ margin: '0 4px' }}>•</span>
                              <Video size={11} style={{ color: 'var(--neon-green)' }} />
                              <span style={{ color: 'var(--neon-green)' }}>
                                VIDEO ATTACHED
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: metadata badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>
                        CREASE: X={review.calibration_x || '—'}
                      </span>
                      <span>|</span>
                      <span>
                        FRAME: {review.decisive_frame ?? '—'}
                      </span>
                      <span>|</span>
                      <span
                        style={{
                          color:
                            review.source_mode === 'upload'
                              ? 'var(--neon-green)'
                              : 'var(--neon-cyan)',
                        }}
                      >
                        {review.source_mode?.toUpperCase()}
                      </span>
                      {review.video_url && (
                        <a
                          href={review.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neon-btn neon-btn-green"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={12} />
                          CLIP
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

export default ReviewHistory;
