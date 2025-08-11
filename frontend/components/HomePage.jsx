import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../App";

const Homepage = React.memo(() => {
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const { isDark } = useTheme();

  // Simple fade in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, { threshold: 0.1 });

    const elements = [statsRef.current, featuresRef.current, testimonialsRef.current];
    elements.forEach(el => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: isDark ? "var(--bg-primary)" : "var(--bg-primary)" 
    }}>
      {/* Hero Section */}
      <section style={{
        background: "var(--gradient-hero)", 
        color: "white",
        padding: "60px 15px 80px",
        textAlign: "center"
      }}>
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: "800", marginBottom: "20px", lineHeight: 1.1 }}>
            Transform Career Development With<br />
            AI-Powered Coaching
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", opacity: 0.95, marginBottom: "32px", maxWidth: "700px", margin: "0 auto 32px" }}>
            Meet Coach, a research-backed AI career coach designed to scale guidance, 
            close skill gaps, and improve outcomes. Built for the modern workforce.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/get-advice" className="btn btn-primary" style={{ padding: "14px 24px", fontSize: "16px" }}>
              Try Coach for Free ✨
            </Link>
            <Link to="/resume-builder" className="btn btn-secondary" style={{ padding: "14px 24px", fontSize: "16px" }}>
              Build Your Résumé 📄
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="animate-fade-in" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 5vw, 36px)", 
            fontWeight: "800", 
            marginBottom: "16px",
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em"
          }}>
            Real Impact, Real Results
          </h2>
          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            marginBottom: "48px",
            maxWidth: "600px",
            margin: "0 auto 48px",
            lineHeight: "1.5"
          }}>
            Launched in 2025, our platform now serves thousands of users across multiple countries.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px"
          }}>
            {[
              { number: "90%", text: "of learners report improved career readiness" },
              { number: "85%", text: "feel more confident about job applications" },
              { number: "25K+", text: "active users worldwide" },
              { number: "120+", text: "countries served" }
            ].map((stat, i) => (
              <div key={i} className="card" style={{ padding: "24px 16px" }}>
                <div style={{
                  fontSize: "36px", 
                  fontWeight: "900",
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "8px"
                }}>{stat.number}</div>
                <p style={{
                  fontSize: "14px", 
                  color: "var(--text-secondary)", 
                  fontWeight: "500", 
                  lineHeight: "1.4", 
                  margin: 0
                }}>{stat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="animate-fade-in" style={{
        background: "var(--bg-secondary)",
        padding: "60px 20px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 5vw, 36px)", 
            fontWeight: "800", 
            marginBottom: "16px",
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em"
          }}>
            What can Coach do?
          </h2>
          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            marginBottom: "48px",
            maxWidth: "600px",
            margin: "0 auto 48px",
            lineHeight: "1.5"
          }}>
            Expert-backed career development activities that guide you through every stage of your journey.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}>
            {[{
              icon: "🎯",
              title: "Explore Career Paths",
              desc: "Discover careers that match your strengths and interests. Learn about industry trends and future job opportunities with AI-powered insights.",
              link: "/get-advice",
              linkText: "Get Career Advice →"
            },
            {
              icon: "📄",
              title: "Build Professional Résumés",
              desc: "Create standout résumés and cover letters. Our AI helps you craft compelling content that gets you noticed by employers.",
              link: "/resume-builder",
              linkText: "Build Résumé →"
            },
            {
              icon: "💼",
              title: "Find Job Opportunities",
              desc: "Access curated job recommendations based on your skills and interests. Save and track applications with our job management tools.",
              link: "/remotive-jobs",
              linkText: "Browse Jobs →"
            }].map((feature, i) => (
              <div key={i} className="card" style={{ padding: "32px", textAlign: "left" }}>
                <div style={{ fontSize: "40px", marginBottom: "20px" }}>{feature.icon}</div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>
                  {feature.desc}
                </p>
                <Link to={feature.link} className="btn btn-primary">{feature.linkText}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="animate-fade-in" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 5vw, 36px)", 
            fontWeight: "800", 
            marginBottom: "16px",
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em"
          }}> 
             <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "800", marginBottom: "16px"}}>
            What Our Users Say
          </h2>
            
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", marginTop: "40px" }}>
            {[{
              text: "This platform has completely transformed how I approach career development. The AI insights are incredibly accurate and actionable.",
              author: "Clark Boothby",
              role: "Director, Career Center"
            }, {
              text: "The résumé builder is phenomenal. It helped me land three interviews in my first week of job searching. Highly recommended!",
              author: "Sarah Johnson",
              role: "Software Engineer"
            }].map((testimonial, i) => (
              <div key={i} className="card" style={{ padding: "24px", textAlign: "left" }}>
                <p style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "20px", fontStyle: "italic", fontWeight: "500" }}>
                  "{testimonial.text}"
                </p>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {testimonial.author}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>
                  {testimonial.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: "var(--gradient-hero)",
        color: "white",
        padding: "60px 20px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "800", marginBottom: "16px" }}>
            Ready to Transform Your Career?
          </h2>
          <p style={{ fontSize: "18px", marginBottom: "32px", opacity: 0.95, lineHeight: 1.4 }}>
            Join thousands who have accelerated their career growth with AI-powered guidance.
          </p>
          <Link to="/get-advice" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
            Get Started Today 🚀
          </Link>
        </div>
      </section>
    </div>
  );
});

export default Homepage;
