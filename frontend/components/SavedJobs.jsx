import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("savedJobs");
      if (stored) {
        const parsed = JSON.parse(stored);
        const jobsWithDateAdded = Array.isArray(parsed) 
          ? parsed.map((job, index) => ({
              ...job,
              dateAdded: job.dateAdded || new Date().toISOString(),
              id: job.redirectUrl || index
            }))
          : [];
        setSavedJobs(jobsWithDateAdded);
      }
    } catch (error) {
      console.error("Failed to load saved jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort jobs
  useEffect(() => {
    let filtered = [...savedJobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(job => {
        switch (filterBy) {
          case 'applied': return job.status === 'applied';
          case 'interviewing': return job.status === 'interviewing';
          case 'remote': return job.location?.toLowerCase().includes('remote') || job.location?.toLowerCase().includes('worldwide');
          case 'full-time': return job.jobType?.toLowerCase().includes('full');
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dateAdded': return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'company': return (a.company || '').localeCompare(b.company || '');
        case 'title': return (a.title || '').localeCompare(b.title || '');
        case 'location': return (a.location || '').localeCompare(b.location || '');
        default: return 0;
      }
    });

    setFilteredJobs(filtered);
  }, [savedJobs, searchTerm, sortBy, filterBy]);

  const handleRemove = useCallback((url) => {
    if (window.confirm('Remove this job from saved list?')) {
      const updated = savedJobs.filter(job => job.redirectUrl !== url);
      setSavedJobs(updated);
      localStorage.setItem("savedJobs", JSON.stringify(updated));
      setSelectedJobs(prev => prev.filter(id => id !== url));
    }
  }, [savedJobs]);

  const handleBulkDelete = useCallback(() => {
    if (selectedJobs.length === 0) return;
    
    if (window.confirm(`Remove ${selectedJobs.length} selected job(s)?`)) {
      const updated = savedJobs.filter(job => !selectedJobs.includes(job.redirectUrl));
      setSavedJobs(updated);
      localStorage.setItem("savedJobs", JSON.stringify(updated));
      setSelectedJobs([]);
    }
  }, [savedJobs, selectedJobs]);

  const handleExportJobs = useCallback(() => {
    const jobsToExport = selectedJobs.length > 0 
      ? savedJobs.filter(job => selectedJobs.includes(job.redirectUrl))
      : filteredJobs;
      
    const exportData = jobsToExport.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salary: job.salary,
      url: job.redirectUrl,
      dateAdded: job.dateAdded,
      status: job.status || 'saved'
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-jobs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [savedJobs, filteredJobs, selectedJobs]);

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.redirectUrl));
    }
  };

  const updateJobStatus = (jobUrl, status) => {
    const updated = savedJobs.map(job =>
      job.redirectUrl === jobUrl ? { ...job, status } : job
    );
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return '#10b981';
      case 'interviewing': return '#f59e0b';  
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Compact Stats Component
  const CompactStats = () => {
    const totalJobs = savedJobs.length;
    const appliedJobs = savedJobs.filter(job => job.status === 'applied').length;
    const interviewingJobs = savedJobs.filter(job => job.status === 'interviewing').length;
    const appliedPercentage = totalJobs > 0 ? Math.round((appliedJobs / totalJobs) * 100) : 0;

    return (
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Total with mini progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalJobs}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              SAVED
            </div>
          </div>
          <div style={{ 
            width: '60px', 
            height: '4px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${appliedPercentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #6366f1)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Applied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {appliedJobs}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Applied
          </span>
        </div>

        {/* Interviewing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#f59e0b'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {interviewingJobs}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Interviewing
          </span>
        </div>

        {/* Progress percentage */}
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          {appliedPercentage}% applied
        </div>
      </div>
    );
  };

  // Compact Job Card
  const CompactJobCard = ({ job, isSelected, onToggleSelect, onRemove, onUpdateStatus }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
      border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-color)',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      gap: '16px'
    }}>
      {/* Selection */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(job.redirectUrl)}
        style={{ transform: 'scale(1.1)' }}
      />

      {/* Job Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {job.title}
          </h3>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#6366f1'
          }}>
            {job.company}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>📍 {job.location || 'Remote'}</span>
          <span>📅 {new Date(job.dateAdded).toLocaleDateString()}</span>
          {job.jobType && (
            <span style={{
              background: '#10b98120',
              color: '#10b981',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {job.jobType}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <select
        value={job.status || 'saved'}
        onChange={(e) => onUpdateStatus(job.redirectUrl, e.target.value)}
        style={{
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: getStatusColor(job.status),
          fontSize: '12px',
          fontWeight: '600',
          minWidth: '100px'
        }}
      >
        <option value="saved">💾 Saved</option>
        <option value="applied">✅ Applied</option>
        <option value="interviewing">🤝 Interview</option>
        <option value="rejected">❌ Rejected</option>
      </select>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => window.open(job.redirectUrl, '_blank')}
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          View
        </button>
        <button
          onClick={() => onRemove(job.redirectUrl)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="animate-spin" style={{ fontSize: '32px', marginBottom: '16px' }}>⟳</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Compact Header */}
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          {/* Title and Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '800',
                marginBottom: '4px',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⭐ Saved Jobs
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
                Track and manage your job applications
              </p>
            </div>
            <button onClick={() => navigate('/remotive-jobs')} className="btn btn-secondary">
              🔍 Browse Jobs
            </button>
          </div>

          {/* Compact Stats */}
          <CompactStats />

          {/* Compact Controls */}
          <div style={{ paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search */}
              <input
                type="text"
                placeholder="🔍 Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}
              />

              {/* Quick Filters */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="form-input"
                style={{ minWidth: '100px' }}
              >
                <option value="all">All</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interview</option>
                <option value="remote">Remote</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input"
                style={{ minWidth: '120px' }}
              >
                <option value="dateAdded">Recent</option>
                <option value="company">Company</option>
                <option value="title">Title</option>
              </select>

              {/* Bulk Actions */}
              {selectedJobs.length > 0 && (
                <>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {selectedJobs.length} selected
                  </span>
                  <button onClick={handleBulkDelete} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    🗑️ Delete
                  </button>
                  <button onClick={handleExportJobs} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    📤 Export
                  </button>
                </>
              )}

              {/* Select All */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                  onChange={toggleSelectAll}
                />
                All ({filteredJobs.length})
              </label>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {savedJobs.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No saved jobs yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Start saving jobs to track your applications
            </p>
            <button onClick={() => navigate('/remotive-jobs')} className="btn btn-primary">
              🔍 Browse Jobs
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No matching jobs</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Try adjusting your search or filters
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterBy('all'); }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredJobs.map((job) => (
              <CompactJobCard
                key={job.redirectUrl}
                job={job}
                isSelected={selectedJobs.includes(job.redirectUrl)}
                onToggleSelect={toggleJobSelection}
                onRemove={handleRemove}
                onUpdateStatus={updateJobStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
