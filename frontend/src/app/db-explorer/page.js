'use client';

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5001/apis/v1';

export default function DbExplorerPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  const [blogs, setBlogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/stats/brief`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    setActiveTab(tab);
    if (tab === 'blogs' && blogs.length === 0) {
      setDataLoading(true);
      try {
        const res = await fetch(`${API_BASE}/blogs?limit=12`);
        const data = await res.json();
        setBlogs(data.data || []);
      } catch (err) { console.error(err); }
      finally { setDataLoading(false); }
    } else if (tab === 'jobs' && jobs.length === 0) {
      setDataLoading(true);
      try {
        const res = await fetch(`${API_BASE}/jobs?limit=12`);
        const data = await res.json();
        setJobs(data.data || []);
      } catch (err) { console.error(err); }
      finally { setDataLoading(false); }
    } else if (tab === 'institutes' && institutes.length === 0) {
      setDataLoading(true);
      try {
        const res = await fetch(`${API_BASE}/institutes?limit=12`);
        const data = await res.json();
        setInstitutes(data.data || []);
      } catch (err) { console.error(err); }
      finally { setDataLoading(false); }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚡ Loading Database Brief...</div>
          <div style={{ color: '#94a3b8' }}>Fetching collection statistics and Mongoose reference graphs</div>
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {};

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#e2e8f0', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
            MongoDB Atlas Data & Relational Explorer
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '16px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Education Masters Database Overview
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '650px', margin: '12px auto 0' }}>
            Consolidated MongoDB documents linked with native Mongoose ObjectId references across 12 core collections.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {[
            { id: 'summary', label: '📊 Brief Summary' },
            { id: 'blogs', label: `📝 Blogs (${summary.total_blogs || 0})` },
            { id: 'jobs', label: `💼 Jobs (${summary.total_jobs || 0})` },
            { id: 'institutes', label: `🏛️ Institutes (${summary.total_institutes || 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => loadTabData(tab.id)}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === tab.id ? '#0284c7' : '#1e293b',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SUMMARY STATS */}
        {activeTab === 'summary' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                { label: 'Blog Posts', count: summary.total_blogs, color: '#38bdf8', icon: '📝' },
                { label: 'Job Vacancies', count: summary.total_jobs, color: '#4ade80', icon: '💼' },
                { label: 'MCQ Questions', count: summary.total_questions, color: '#f43f5e', icon: '❓' },
                { label: 'Institutes', count: summary.total_institutes, color: '#a855f7', icon: '🏛️' },
                { label: 'Categories', count: summary.total_categories, color: '#fbbf24', icon: '🏷️' },
                { label: 'Users & Admins', count: summary.total_users, color: '#38bdf8', icon: '👥' },
                { label: 'Media Library', count: summary.total_media, color: '#e879f9', icon: '🖼️' },
                { label: 'Subscribers', count: summary.total_subscribers, color: '#34d399', icon: '📬' },
                { label: 'States', count: summary.total_states, color: '#fb7185', icon: '🗺️' },
                { label: 'Districts', count: summary.total_districts, color: '#818cf8', icon: '📍' },
                { label: 'Countries', count: summary.total_countries, color: '#facc15', icon: '🌐' },
                { label: 'Ad Banners', count: summary.total_adverts, color: '#94a3b8', icon: '📢' },
              ].map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: item.color }}>
                    {item.count ? item.count.toLocaleString() : 0}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, marginTop: '4px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Samples */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: '#f8fafc' }}>
              Populated Institute References Sample
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {(stats.samples?.recent_institutes || []).map((inst) => (
                <div key={inst._id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>{inst.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>📍 <strong>Location:</strong> {inst.city || 'N/A'}, {inst.district?.name || 'N/A'}, {inst.state?.name || 'N/A'}</div>
                    <div>🔗 <strong>Mongoose Refs:</strong> State ({inst.state?._id ? '✅ Linked' : '❌'}), District ({inst.district?._id ? '✅ Linked' : '❌'})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BLOGS LIST */}
        {activeTab === 'blogs' && (
          <div>
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading populated blogs...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {blogs.map((blog) => (
                  <div key={blog._id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', lineHeight: 1.4 }}>
                        {blog.title || 'Untitled Post'}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
                        👤 <strong>Author:</strong> {blog.author?.name || 'Admin'} ({blog.author?.email || 'N/A'})
                      </div>
                      {blog.state && (
                        <span style={{ backgroundColor: '#0284c722', border: '1px solid #0284c7', color: '#38bdf8', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                          📍 {blog.state.name}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                      ID: {blog._id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOBS LIST */}
        {activeTab === 'jobs' && (
          <div>
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading populated jobs...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {jobs.map((job) => (
                  <div key={job._id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>{job.title}</h3>
                      <span style={{ backgroundColor: job.status === 'publish' ? '#166534' : '#854d0e', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {job.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>📋 <strong>Posts:</strong> {job.posts || 'N/A'}</div>
                      {job.state && <div>📍 <strong>State:</strong> {job.state.name}</div>}
                      <div>👤 <strong>Author:</strong> {job.author?.name || 'Staff'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INSTITUTES LIST */}
        {activeTab === 'institutes' && (
          <div>
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading populated institutes...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {institutes.map((inst) => (
                  <div key={inst._id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a855f7', marginBottom: '8px' }}>{inst.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>📍 <strong>City/District:</strong> {inst.city || 'N/A'}, {inst.district?.name || 'N/A'}</div>
                      <div>🗺️ <strong>State:</strong> {inst.state?.name || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
