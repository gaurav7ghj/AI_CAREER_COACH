import React, { useState, useEffect, useCallback } from "react";
import { fetchRemotiveJobs } from "../services/api";
import { useTheme } from "../App";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 12;

function isValidJob(job) {
  return (
    job &&
    typeof job === "object" &&
    typeof job.title === "string" &&
    job.title.trim().length > 0 &&
    typeof job.redirectUrl === "string" &&
    job.redirectUrl.trim().length > 0
  );
}

// Job Card Component
const JobCard = ({ job, isSaved, onToggleSave, onViewDetails }) => {
  const { isDark } = useTheme();
  
  const formatSalary = (salary) => {
    if (!salary || salary === 'Not specified') return null;
    return salary;
  };

  const formatLocation = (location) => {
    if (!location || location.toLowerCase().includes('worldwide')) return '🌍 Remote';
    return `📍 ${location}`;
  };

  const getJobTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return '#10b981';
      case 'part-time': return '#f59e0b';
      case 'contract': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="card" style={{
      padding: '24px',
      height: 'fit-content',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid var(--border-color)',
      position: 'relative'
    }}
    onClick={() => onViewDetails(job)}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow)';
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: '1.3',
            flex: 1,
            paddingRight: '8px'
          }}>
            {job.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#6366f1'
          }}>
            {job.company}
          </span>
          {job.jobType && (
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: getJobTypeColor(job.jobType),
              background: `${getJobTypeColor(job.jobType)}20`,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {job.jobType}
            </span>
          )}
        </div>
      </div>

      {/* Location & Salary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>
          {formatLocation(job.location)}
        </span>
        {formatSalary(job.salary) && (
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#10b981',
            background: '#10b98120',
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            💰 {formatSalary(job.salary)}
          </span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          margin: '0 0 16px 0',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {job.description.replace(/<[^>]+>/g, "")}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontWeight: '500'
        }}>
          {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recently posted'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(job.redirectUrl, '_blank');
          }}
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '6px 16px' }}
        >
          Apply Now →
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function RemotiveJobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("developer");
  const [error, setError] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    jobType: '',
    location: '',
    company: '',
    sortBy: 'date'
  });

  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Load saved jobs
  useEffect(() => {
    try {
      const stored = localStorage.getItem("savedJobs");
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = Array.isArray(parsed) ? parsed.filter(isValidJob) : [];
        setSavedJobs(filtered);
      }
    } catch {
      localStorage.removeItem("savedJobs");
      setSavedJobs([]);
    }
  }, []);

  // Search jobs
  const handleSearch = useCallback(async (searchTerm = search) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const results = await fetchRemotiveJobs(searchTerm);
      const validJobs = results.filter(isValidJob);
      
      if (validJobs.length === 0) {
        setError("No valid jobs found for your search.");
        setJobs([]);
        setFilteredJobs([]);
        return;
      }

      setJobs(validJobs);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message || "Failed to fetch jobs. Please try again.");
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...jobs];

    // Apply filters
    if (filters.jobType) {
      filtered = filtered.filter(job => 
        job.jobType?.toLowerCase().includes(filters.jobType.toLowerCase())
      );
    }
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.company) {
      filtered = filtered.filter(job =>
        job.company?.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
    setDisplayedJobs(filtered.slice(0, currentPage * PAGE_SIZE));
  }, [jobs, filters, currentPage]);

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const toggleSaveJob = useCallback((job) => {
    const url = job.redirectUrl;
    const isSaved = savedJobs.some(j => j.redirectUrl === url);
    
    let updated;
    if (isSaved) {
      updated = savedJobs.filter(j => j.redirectUrl !== url);
    } else {
      updated = [...savedJobs, job];
    }
    
    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  }, [savedJobs]);

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      jobType: '',
      location: '',
      company: '',
      sortBy: 'date'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Job details modal/expanded view
  const JobDetailsModal = ({ job, onClose }) => {
    if (!job) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }} onClick={onClose}>
        <div 
          className="card" 
          style={{
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '32px',
            background: 'var(--bg-card)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>{job.title}</h2>
              <p style={{ fontSize: '18px', color: '#6366f1', fontWeight: '600', margin: 0 }}>{job.company}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>📍 {job.location}</span>
              {job.jobType && <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>💼 {job.jobType}</span>}
              {job.salary && <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>💰 {job.salary}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Job Description</h3>
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '8px'
            }}>
              {job.description ? job.description.replace(/<[^>]+>/g, "") : "No description available."}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => toggleSaveJob(job)} className="btn btn-secondary">
              {savedJobs.some(j => j.redirectUrl === job.redirectUrl) ? '❤️ Saved' : '🤍 Save Job'}
            </button>
            <button 
              onClick={() => window.open(job.redirectUrl, '_blank')}
              className="btn btn-primary"
            >
              Apply Now →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              💼 Remote Job Search
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Discover remote opportunities from top companies worldwide
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search jobs (e.g., developer, designer, manager)..."
                className="form-input"
                style={{ flex: '1', minWidth: '300px' }}
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </form>

          {/* Filters */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="form-input"
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>

            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="Filter by location..."
              className="form-input"
            />

            <input
              type="text"
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              placeholder="Filter by company..."
              className="form-input"
            />

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="form-input"
            >
              <option value="date">Sort by Date</option>
              <option value="company">Sort by Company</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>

          {/* Filter Stats & Reset */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {filteredJobs.length} jobs found {filteredJobs.length !== jobs.length && `(filtered from ${jobs.length})`}
            </span>
            <button onClick={resetFilters} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ fontSize: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Searching for jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Search Error</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
            <button onClick={() => handleSearch()} className="btn btn-primary">Try Again</button>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && filteredJobs.length === 0 && jobs.length > 0 && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No jobs match your filters</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Try adjusting your search criteria or clearing filters
            </p>
            <button onClick={resetFilters} className="btn btn-primary">Clear All Filters</button>
          </div>
        )}

        {!loading && !error && displayedJobs.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {displayedJobs.map((job, index) => (
                <JobCard
                  key={`${job.redirectUrl}-${index}`}
                  job={job}
                  isSaved={savedJobs.some(j => j.redirectUrl === job.redirectUrl)}
                  onToggleSave={toggleSaveJob}
                  onViewDetails={setSelectedJob}
                />
              ))}
            </div>

            {/* Load More */}
            {displayedJobs.length < filteredJobs.length && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={loadMore} className="btn btn-secondary">
                  Load More Jobs ({filteredJobs.length - displayedJobs.length} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* No jobs at all */}
        {!loading && !error && jobs.length === 0 && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💼</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No jobs found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Try searching for different keywords or check back later for new opportunities.
            </p>
            <button onClick={() => navigate('/saved-jobs')} className="btn btn-secondary">
              View Saved Jobs
            </button>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}
