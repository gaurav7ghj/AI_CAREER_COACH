import React, { useState, useCallback, useRef } from "react";
import { useTheme } from "../App";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { generateResume, generateLinkedInSummary } from "../services/api";


function emptyExperience() {
  return { title: "", company: "", location: "", from: "", to: "", bullets: [""] };
}

function emptyEducation() {
  return { degree: "", institution: "", from: "", to: "", gpa: "", location: "" };
}

function emptyProject() {
  return { name: "", description: "", technologies: "", link: "", duration: "" };
}

const EditableText = React.memo(({ value, onChange, style, placeholder, multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  React.useEffect(() => { setDraft(value || ""); }, [value]);
  const commit = () => { onChange(draft); setIsEditing(false); };
  if (isEditing) {
    return multiline ? (
      <textarea
        autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        style={{ ...style, minHeight: 60, width: "100%" }}
      />
    ) : (
      <input
        autoFocus type="text" value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        style={{ ...style, width: "100%" }}
      />
    );
  }
  return (
    <div onClick={() => setIsEditing(true)} style={{ ...style, cursor: "pointer", minHeight: 24 }}>
      {!!value ? value : <span style={{ color: "#9ca3af", fontStyle: "italic" }}>{placeholder || "Click to edit"}</span>}
    </div>
  );
});

const ResumePreview = React.memo(({ data, onInlineChange }) => (
  <div style={{ background: "#fff", padding: 24, fontFamily: "Arial, sans-serif", fontSize: 14, color: "#111", height: "100%", overflow: "auto", borderRadius: 8, boxShadow: "0 4px 8px #0001" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #333", marginBottom: 16, paddingBottom: 12 }}>
      <EditableText value={data.name} onChange={v => onInlineChange("name", v)} style={{ fontSize: 24, fontWeight: "bold" }} placeholder="Your Name" />
      <div style={{ fontSize: 11, color: "#555", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <EditableText value={data.email} onChange={v => onInlineChange("email", v)} placeholder="Email" />
        - 
        <EditableText value={data.phone} onChange={v => onInlineChange("phone", v)} placeholder="Phone" />
        - 
        <EditableText value={data.location} onChange={v => onInlineChange("location", v)} placeholder="Location" />
      </div>
    </div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontWeight: "bold", fontSize: 16 }}>Summary</h3>
      <EditableText multiline value={data.summary} onChange={v => onInlineChange("summary", v)} placeholder="Professional summary..." />
    </div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontWeight: "bold", fontSize: 16 }}>Skills</h3>
      <EditableText value={Array.isArray(data.skills) ? data.skills.join(", ") : data.skills} onChange={v => onInlineChange("skills", v.split(",").map(s => s.trim()))} placeholder="Comma separated skills" />
    </div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontWeight: "bold", fontSize: 16 }}>Experience</h3>
      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{exp.title}</strong> at <span>{exp.company}</span> ({exp.from}â€“{exp.to})
          <div style={{ fontSize: 12, color: "#555" }}>{exp.location}</div>
          <ul>
            {exp.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontWeight: "bold", fontSize: 16 }}>Education</h3>
      {data.education.map((edu, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{edu.degree}</strong> - {edu.institution} ({edu.from}â€“{edu.to}){edu.gpa && <> | <span>GPA: {edu.gpa}</span></>}
        </div>
      ))}
    </div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontWeight: "bold", fontSize: 16 }}>Projects</h3>
      {data.projects.map((proj, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{proj.name}</strong>
          <div>{proj.description}</div>
          {proj.technologies && <div style={{ fontSize: 12 }}>Tech: {proj.technologies}</div>}
          {proj.link && <div style={{ fontSize: 12, color: "#3b82f6" }}>{proj.link}</div>}
        </div>
      ))}
    </div>
  </div>
));

export default function ResumeBuilder() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", location: "", summary: "", skills: "", experiences: "",
  });
  const [resumeFields, setResumeFields] = useState({
    name: "", email: "", phone: "", location: "", summary: "", skills: [],
    experience: [emptyExperience()],
    education: [emptyEducation()],
    projects: [emptyProject()],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkedInSummary, setLinkedInSummary] = useState("");
  const [generatingLinkedIn, setGeneratingLinkedIn] = useState(false);
  const fileInputRef = useRef(null);

  const handleInlineChange = useCallback((field, value) => {
    setResumeFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleInput = useCallback(e => setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);
  
  const handleSectionChange = useCallback((section, idx, field, val) => {
    setResumeFields(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === idx ? { ...item, [field]: val } : item),
    }));
  }, []);
  
  const addSectionItem = useCallback((section, factory) => setResumeFields(prev => ({ ...prev, [section]: [...prev[section], factory()] })), []);
  const removeSectionItem = useCallback((section, idx) => setResumeFields(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) })), []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("jwt");

const response = await fetch("/api/ai/generate-resume", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  },
  body: JSON.stringify(form)
});

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate rÃ©sumÃ©: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setResumeFields(prev => ({
        ...prev,
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(",").map(s => s.trim()) : []),
        experience: Array.isArray(data.experience) && data.experience.length ? data.experience : [emptyExperience()],
        education: Array.isArray(data.education) && data.education.length ? data.education : [emptyEducation()],
        projects: Array.isArray(data.projects) && data.projects.length ? data.projects : [emptyProject()],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate LinkedIn Summary
  const handleGenerateLinkedInSummary = async () => {
  setGeneratingLinkedIn(true);
  setError("");
  try {
    const { name, summary, skills } = resumeFields;
    const data = await generateLinkedInSummary({
      name,
      summary,
      skills: Array.isArray(skills) ? skills.join(", ") : (skills || "")
    });
    setLinkedInSummary(data.summary);
    setActiveTab("linkedin");
  } catch (err) {
    setError(err.message || "Failed to generate LinkedIn summary");
  } finally {
    setGeneratingLinkedIn(false);
  }
};



  // Enhanced PDF Export (keeping your existing implementation)
  const handleExportPDF = () => {
    if (!resumeFields) return;
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(resumeFields.name || 'Your Name', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const contactInfo = [resumeFields.email, resumeFields.phone, resumeFields.location].filter(Boolean).join(' | ');
    doc.text(contactInfo, 20, yPosition);
    yPosition += 20;
    
    // Summary
    if (resumeFields.summary) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summaryLines = doc.splitTextToSize(resumeFields.summary, 170);
      summaryLines.forEach(line => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }
    
    // Skills
    if (resumeFields.skills && resumeFields.skills.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('SKILLS', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const skillsText = Array.isArray(resumeFields.skills) ? resumeFields.skills.join(', ') : resumeFields.skills;
      const skillsLines = doc.splitTextToSize(skillsText, 170);
      skillsLines.forEach(line => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }
    
    // Experience
    if (resumeFields.experience && resumeFields.experience.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('EXPERIENCE', 20, yPosition);
      yPosition += 8;
      
      resumeFields.experience.forEach(exp => {
        if (exp.title || exp.company) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`${exp.title} - ${exp.company}`, 20, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(`${exp.from} - ${exp.to} | ${exp.location}`, 20, yPosition);
          yPosition += 8;
          
          exp.bullets.filter(Boolean).forEach(bullet => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            
            const bulletLines = doc.splitTextToSize(`-  ${bullet}`, 160);
            bulletLines.forEach(line => {
              doc.text(line, 25, yPosition);
              yPosition += 5;
            });
          });
          yPosition += 5;
        }
      });
    }
    
    // Education
    if (resumeFields.education && resumeFields.education.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('EDUCATION', 20, yPosition);
      yPosition += 8;
      
      resumeFields.education.forEach(edu => {
        if (edu.degree || edu.institution) {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`${edu.degree} - ${edu.institution}`, 20, yPosition);
          yPosition += 6;
          
          doc.setFont(undefined, 'normal');
          const eduInfo = [edu.from && edu.to ? `${edu.from} - ${edu.to}` : '', edu.gpa ? `GPA: ${edu.gpa}` : '', edu.location].filter(Boolean).join(' | ');
          if (eduInfo) {
            doc.text(eduInfo, 20, yPosition);
            yPosition += 8;
          }
        }
      });
    }
    
    // Projects
    if (resumeFields.projects && resumeFields.projects.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECTS', 20, yPosition);
      yPosition += 8;
      
      resumeFields.projects.forEach(proj => {
        if (proj.name) {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(proj.name, 20, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          
          if (proj.description) {
            const descLines = doc.splitTextToSize(proj.description, 170);
            descLines.forEach(line => {
              if (yPosition > pageHeight - 15) {
                doc.addPage();
                yPosition = 20;
              }
              doc.text(line, 20, yPosition);
              yPosition += 5;
            });
          }
          
          if (proj.technologies) {
            doc.text(`Tech: ${proj.technologies}`, 20, yPosition);
            yPosition += 5;
          }
          
          if (proj.link) {
            doc.text(`Link: ${proj.link}`, 20, yPosition);
            yPosition += 5;
          }
          
          yPosition += 5;
        }
      });
    }
    
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`${resumeFields.name || 'resume'}-${timestamp}.pdf`);
  };

  // Export Resume Data as JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(resumeFields, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resumeFields.name || 'resume'}-data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Resume Data from JSON
  const handleImportJSON = (event) => {
    const file = event.target.files;
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setResumeFields(prev => ({
            ...prev,
            ...importedData,
            experience: Array.isArray(importedData.experience) && importedData.experience.length ? importedData.experience : [emptyExperience()],
            education: Array.isArray(importedData.education) && importedData.education.length ? importedData.education : [emptyEducation()],
            projects: Array.isArray(importedData.projects) && importedData.projects.length ? importedData.projects : [emptyProject()],
          }));
          setError('');
          alert('Resume data imported successfully!');
        } catch (err) {
          setError('Invalid JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    } else {
      setError('Please select a valid JSON file.');
    }
    // Reset file input
    event.target.value = '';
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info',  },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'projects', label: 'Projects'},
    { id: 'linkedin', label: 'LinkedIn'  },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#181b22" : "#f9fafb",
      display: "flex",
      flexDirection: "column",
    }}>
      <header style={{
        background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
        padding: "20px", color: "#fff",
        boxShadow: "0 4px 12px #0002"
      }}>
        <div style={{ maxWidth: 1200, margin: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}> Resume Builder</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate with AI"}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleGenerateLinkedInSummary} 
              disabled={generatingLinkedIn || !resumeFields.name}
              title="Generate LinkedIn About section"
            >
              {generatingLinkedIn ? "Generating..." : " LinkedIn"}
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={!resumeFields}>
               Export PDF
            </button>
            <button className="btn btn-secondary" onClick={handleExportJSON} disabled={!resumeFields}>
              Export JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.pdf"
              onChange={(e) => {
                const file = e.target.files;
                if (file && file.type === 'application/json') {
                  handleImportJSON(e);
                }
              }}
              style={{ display: 'none' }}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              ðŸ“‚ Import
            </button>
          </div>
        </div>
      </header>
      
      <main style={{ display: "flex", flex: 1, gap: 20, maxWidth: 1220, margin: "auto", padding: 16 }}>
        <section style={{ flex: 1, overflowY: "auto" }}>
          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002"
          }}>
            <nav style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {tabs.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8, border: "none", minWidth: "100px",
                    background: activeTab === tab.id ? "#6366f1" : "#e0e7ff",
                    color: activeTab === tab.id ? "white" : "#4f46e5",
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}>{tab.icon} {tab.label}</button>
              ))}
            </nav>
            {error && <div style={{ background: "#fee2e2", color: "#be123c", padding: 8, borderRadius: 5, margin: "8px 0" }}>{error}</div>}
            
            <form onSubmit={handleGenerate}>
              {activeTab === "basic" && (
                <>
                  <label>Name*:<input name="name" value={form.name} onChange={handleInput} required style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                  <label>Email*:<input name="email" value={form.email} onChange={handleInput} required style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                  <label>Phone:<input name="phone" value={form.phone} onChange={handleInput} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                  <label>Location:<input name="location" value={form.location} onChange={handleInput} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                  <label>Summary:<textarea name="summary" value={form.summary} onChange={handleInput} rows={4} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd", resize: "vertical" }} /></label>
                  <label>Skills (comma separated):<input name="skills" value={form.skills} onChange={handleInput} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} placeholder="E.g. Java, React, Python" /></label>
                </>
              )}

              {activeTab === "linkedin" && (
                <div>
                  <h3 style={{ marginBottom: 16, color: "#374151" }}>LinkedIn About Section</h3>
                  {!linkedInSummary ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <p style={{ marginBottom: 20, color: "#6b7280" }}>
                        Generate a professional LinkedIn "About" section based on your resume data.
                      </p>
                      <button 
                        type="button"
                        onClick={handleGenerateLinkedInSummary}
                        disabled={generatingLinkedIn || !resumeFields.name}
                        style={{
                          padding: "12px 24px",
                          background: "#0077b5",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: generatingLinkedIn || !resumeFields.name ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "16px"
                        }}
                      >
                        {generatingLinkedIn ? "Generating..." : "Generate LinkedIn Summary"}
                      </button>
                      {!resumeFields.name && (
                        <p style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>
                          Please fill in basic info first
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ 
                        background: "#f8fafc", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "8px", 
                        padding: "16px", 
                        marginBottom: "16px",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6"
                      }}>
                        {linkedInSummary}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(linkedInSummary)}
                          style={{
                            padding: "8px 16px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                           Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkedInSummary("")}
                          style={{
                            padding: "8px 16px",
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                           Generate New
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Keep all your existing experience, education, projects tabs exactly as they are */}
              {activeTab === "experience" && (
                <>
                  {resumeFields.experience.map((exp, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #eee", marginBottom: 16, paddingBottom: 16 }}>
                      <h4 style={{ marginBottom: 12, color: "#374151" }}>Experience #{i + 1}</h4>
                      <label>Job Title: <input value={exp.title} onChange={e => handleSectionChange("experience", i, "title", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <label>Company: <input value={exp.company} onChange={e => handleSectionChange("experience", i, "company", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <label>Location: <input value={exp.location} onChange={e => handleSectionChange("experience", i, "location", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <div style={{ display: "flex", gap: "2%", marginBottom: 8 }}>
                        <label style={{ flex: 1 }}>From: <input value={exp.from} onChange={e => handleSectionChange("experience", i, "from", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                        <label style={{ flex: 1 }}>To: <input value={exp.to} onChange={e => handleSectionChange("experience", i, "to", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      </div>
                      <label>Achievements:</label>
                      {exp.bullets.map((b, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          <input value={b} onChange={e => handleSectionChange("experience", i, "bullets", exp.bullets.map((bb, jj) => jj === j ? e.target.value : bb))} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} placeholder="Describe your achievement..." />
                          <button type="button" onClick={() => handleSectionChange("experience", i, "bullets", exp.bullets.filter((_, jj) => jj !== j))} style={{ padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>âˆ’</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleSectionChange("experience", i, "bullets", [...exp.bullets, ""])} style={{ marginTop: 8, marginRight: 8, padding: "8px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>+ Add Achievement</button>
                      {resumeFields.experience.length > 1 && (
                        <button type="button" onClick={() => removeSectionItem("experience", i)} style={{ marginTop: 8, padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Remove Experience</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addSectionItem("experience", emptyExperience)} style={{ padding: "12px 16px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>+ Add Experience</button>
                </>
              )}
              
              {activeTab === "education" && (
                <>
                  {resumeFields.education.map((edu, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #eee", marginBottom: 16, paddingBottom: 16 }}>
                      <h4 style={{ marginBottom: 12, color: "#374151" }}>Education #{i + 1}</h4>
                      <label>Degree: <input value={edu.degree} onChange={e => handleSectionChange("education", i, "degree", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <label>Institution: <input value={edu.institution} onChange={e => handleSectionChange("education", i, "institution", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <label>Location: <input value={edu.location} onChange={e => handleSectionChange("education", i, "location", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <div style={{ display: "flex", gap: "2%", marginBottom: 8 }}>
                        <label style={{ flex: 1 }}>From: <input value={edu.from} onChange={e => handleSectionChange("education", i, "from", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                        <label style={{ flex: 1 }}>To: <input value={edu.to} onChange={e => handleSectionChange("education", i, "to", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      </div>
                      <label>GPA: <input value={edu.gpa} onChange={e => handleSectionChange("education", i, "gpa", e.target.value)} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} placeholder="Optional" /></label>
                      {resumeFields.education.length > 1 && (
                        <button type="button" onClick={() => removeSectionItem("education", i)} style={{ padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Remove Education</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addSectionItem("education", emptyEducation)} style={{ padding: "12px 16px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>+ Add Education</button>
                </>
              )}
              
              {activeTab === "projects" && (
                <>
                  {resumeFields.projects.map((proj, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #eee", marginBottom: 16, paddingBottom: 16 }}>
                      <h4 style={{ marginBottom: 12, color: "#374151" }}>Project #{i + 1}</h4>
                      <label>Project Name: <input value={proj.name} onChange={e => handleSectionChange("projects", i, "name", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} /></label>
                      <label>Description: <textarea value={proj.description} onChange={e => handleSectionChange("projects", i, "description", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd", resize: "vertical" }} rows={3} /></label>
                      <label>Technologies: <input value={proj.technologies} onChange={e => handleSectionChange("projects", i, "technologies", e.target.value)} style={{ width: "100%", marginBottom: 8, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} placeholder="e.g. React, Node.js, MongoDB" /></label>
                      <label>Link: <input value={proj.link} onChange={e => handleSectionChange("projects", i, "link", e.target.value)} style={{ width: "100%", marginBottom: 12, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} placeholder="Project URL or GitHub link" /></label>
                      {resumeFields.projects.length > 1 && (
                        <button type="button" onClick={() => removeSectionItem("projects", i)} style={{ padding: "8px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Remove Project</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addSectionItem("projects", emptyProject)} style={{ padding: "12px 16px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>+ Add Project</button>
                </>
              )}
            </form>
          </div>
        </section>
        
        {/* Live Preview */}
        <section style={{ flex: 1, overflowY: "auto" }}>
          <ResumePreview data={resumeFields} onInlineChange={handleInlineChange} />
        </section>
      </main>
    </div>
  );
}