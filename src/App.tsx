import React, { useState, useEffect } from 'react';
import { Upload, Link, Mail, ArrowRight, Star, CheckCircle, ChevronDown, Menu, X, Zap, Award, Clock, Shield } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedinUrl: '',
    resume: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [linkedinUrlError, setLinkedinUrlError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const validateLinkedinUrl = (url: string): boolean => {
    // Updated regex to handle various LinkedIn job URL formats
    const linkedinJobRegex = /^https?:\/\/(?:www\.)?linkedin\.com\/(?:jobs|job)(?:\/(?:view|collections|search))?(?:\/[^/]+)?/;
    return linkedinJobRegex.test(url);
  };

  const handleLinkedinUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, linkedinUrl: url }));
    
    if (url && !validateLinkedinUrl(url)) {
      setLinkedinUrlError('Please enter a valid LinkedIn job URL (e.g., https://www.linkedin.com/jobs/...)');
    } else {
      setLinkedinUrlError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (linkedinUrlError) {
      return; // Prevent form submission if LinkedIn URL is invalid
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload resume first to get the URL
      let resumeUrl = null;
      if (formData.resume) {
        const fileExt = formData.resume.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(`public/${fileName}`, formData.resume, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload resume');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(`public/${fileName}`);
          
        resumeUrl = publicUrl;
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            linkedin_url: formData.linkedinUrl,
            resume_url: resumeUrl,
            updated_at: new Date().toISOString()
          })
          .eq('email', formData.email);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error('Failed to update user information');
        }
      } else {
        // Create new user
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            name: formData.name,
            email: formData.email,
            linkedin_url: formData.linkedinUrl,
            resume_url: resumeUrl
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error('Failed to create user record');
        }
      }

      // Send to webhook
      const webhookFormData = new FormData();
      webhookFormData.append('name', formData.name);
      webhookFormData.append('email', formData.email);
      webhookFormData.append('linkedinUrl', formData.linkedinUrl);
      if (formData.resume) {
        webhookFormData.append('resume', formData.resume);
      }

      const response = await fetch('https://hook.us2.make.com/jjhmnebnzka3c44zkan5094v9wfjcmh7', {
        method: 'POST',
        body: webhookFormData,
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form. Please try again.');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', linkedinUrl: '', resume: null });
      const fileInput = document.getElementById('resume') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('try-now');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Parallax Background */}
      <div className="parallax-background"></div>
      
      <div className="content-wrapper">
        {/* Header/Navigation */}
        <nav className="fixed w-full z-50 glass border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center group cursor-pointer">
                <div className="logo-container flex items-center">
                  <div className="logo-icon relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-md"></div>
                    <div className="logo-inner relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                      <Star className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 tracking-tight">ResumeEdge</span>
                    <div className="text-xs text-white/60 -mt-1 tracking-wide">AI-Powered Optimization</div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex space-x-8">
                <a href="#how-it-works" className="text-white/90 hover:text-white transition-colors duration-300 tracking-wide font-light">How It Works</a>
                <a href="#features" className="text-white/90 hover:text-white transition-colors duration-300 tracking-wide font-light">Features</a>
                <button 
                  onClick={scrollToForm}
                  className="px-6 py-2 rounded-lg glass-card text-white hover:bg-white/10 transition-all duration-300 tracking-wide font-light"
                >
                  Try Now
                </button>
              </div>
              <div className="md:hidden">
                <button onClick={toggleMobileMenu} className="text-white p-2">
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden glass-card border-t border-white/10 py-4 px-4 animate-fade-in">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#how-it-works" 
                  className="text-white/90 hover:text-white transition-colors duration-300 py-2 tracking-wide font-light"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a 
                  href="#features" 
                  className="text-white/90 hover:text-white transition-colors duration-300 py-2 tracking-wide font-light"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <button 
                  onClick={() => {
                    scrollToForm();
                    setMobileMenuOpen(false);
                  }}
                  className="px-6 py-2 rounded-lg glass-card text-white hover:bg-white/10 transition-all duration-300 text-left tracking-wide font-light"
                >
                  Try Now
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <div className="hero-pattern min-h-screen flex items-center justify-center">
          <div 
            className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="text-center relative z-10">
              <div className="inline-block mb-6 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <span className="text-white/90 text-sm font-medium tracking-widest uppercase">AI-Powered Resume Optimization</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tighter">
                Your Resume, <span className="text-gradient font-normal">Elevated</span><br className="hidden sm:block" />
                Through AI Innovation
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                Transform your career prospects with our AI-powered resume optimization. 
                Get a perfectly tailored resume for every job application in minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={scrollToForm}
                  className="px-8 py-4 rounded-lg glass-card text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center group tracking-wider font-light"
                >
                  Start Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <a 
                  href="#how-it-works"
                  className="px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 flex items-center justify-center tracking-wider font-light"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
              <ChevronDown className="h-8 w-8 text-white/50 animate-bounce" />
            </div>
          </div>
        </div>

        <div className="content-section relative">
          {/* How It Works Section */}
          <div className="py-32 relative" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  <span className="text-white/80 text-sm font-medium tracking-widest uppercase">Simple 3-Step Process</span>
                </div>
                <h2 className="section-heading font-light tracking-tight">
                  How It Works
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection lines between steps (visible on md screens and up) */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-white/0 via-white/20 to-white/0 hidden md:block"></div>
                
                {[
                  {
                    icon: <Upload className="h-12 w-12 text-slate-300" />,
                    title: "Upload Your Resume",
                    description: "Upload your current resume in PDF format. Our AI analyzes its content and structure for optimization.",
                    step: "01"
                  },
                  {
                    icon: <Link className="h-12 w-12 text-slate-300" />,
                    title: "Add Job URL",
                    description: "Paste the LinkedIn job posting URL. Our advanced AI matches your profile with job requirements.",
                    step: "02"
                  },
                  {
                    icon: <Mail className="h-12 w-12 text-slate-300" />,
                    title: "Receive Your Package",
                    description: "Get your tailored resume and cover letter, optimized for ATS systems and hiring managers.",
                    step: "03"
                  }
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="glass-card p-8 rounded-xl floating relative z-10"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <span className="text-white/90 text-sm font-medium">{item.step}</span>
                    </div>
                    <div className="mb-6">{item.icon}</div>
                    <h3 className="text-2xl font-light mb-4 text-white tracking-tight">{item.title}</h3>
                    <p className="text-white/70 leading-relaxed font-light tracking-wide">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-32 relative" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  <span className="text-white/80 text-sm font-medium tracking-widest uppercase">Powerful Capabilities</span>
                </div>
                <h2 className="section-heading font-light tracking-tight">
                  Why Choose ResumeEdge
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Zap className="h-6 w-6 text-slate-300" />,
                    title: "AI-Powered Optimization",
                    description: "Our advanced AI analyzes job descriptions to highlight your most relevant skills and experience."
                  },
                  {
                    icon: <Shield className="h-6 w-6 text-slate-300" />,
                    title: "ATS-Friendly Formatting",
                    description: "Ensure your resume passes through Applicant Tracking Systems with optimized formatting."
                  },
                  {
                    icon: <Award className="h-6 w-6 text-slate-300" />,
                    title: "Keyword Analysis",
                    description: "Identify and incorporate industry-specific keywords that hiring managers are looking for."
                  },
                  {
                    icon: <CheckCircle className="h-6 w-6 text-slate-300" />,
                    title: "Industry-Specific Templates",
                    description: "Choose from templates designed for your specific industry to maximize impact."
                  },
                  {
                    icon: <Clock className="h-6 w-6 text-slate-300" />,
                    title: "24/7 Instant Generation",
                    description: "Get your optimized resume in minutes, any time of day or night."
                  },
                  {
                    icon: <Star className="h-6 w-6 text-slate-300" />,
                    title: "Professional Phrasing",
                    description: "Transform your experience with powerful, professional language that impresses employers."
                  }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="glass-card p-8 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-glow"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-light mb-3 text-white tracking-tight">{feature.title}</h3>
                    <p className="text-white/70 font-light tracking-wide">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Try Now Form Section */}
          <div className="py-20 sm:py-32" id="try-now">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  <span className="text-white/80 text-sm font-medium tracking-widest uppercase">Get Started</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tighter mb-2">
                  Elevate Your <span className="text-gradient font-normal">Resume</span>
                </h2>
              </div>
              
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden backdrop-blur-lg shadow-glow">
                {success && (
                  <div className="p-4 sm:p-8 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-b border-emerald-500/30">
                    <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4">
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-light text-emerald-400 tracking-tight">Success!</h3>
                        <p className="text-emerald-400/80 font-light tracking-wide">
                          Check your email for your customized resume and cover letter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 sm:p-8 bg-gradient-to-r from-red-500/20 to-red-500/10 border-b border-red-500/30">
                    <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 sm:mb-0 sm:mr-4">
                        <X className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-light text-red-400 tracking-tight">Error</h3>
                        <p className="text-red-400/80 font-light tracking-wide">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-12">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-4 pt-6 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors duration-300 font-light tracking-wide peer placeholder-transparent"
                        placeholder="Full Name"
                      />
                      <label 
                        htmlFor="name" 
                        className="absolute text-sm text-white/60 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-300"
                      >
                        Full Name
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-4 pt-6 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors duration-300 font-light tracking-wide peer placeholder-transparent"
                        placeholder="Email Address"
                      />
                      <label 
                        htmlFor="email" 
                        className="absolute text-sm text-white/60 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-300"
                      >
                        Email Address
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="url"
                        id="linkedin"
                        required
                        value={formData.linkedinUrl}
                        onChange={handleLinkedinUrlChange}
                        className={`w-full px-4 py-4 pt-6 rounded-xl bg-white/5 border ${linkedinUrlError ? 'border-red-400' : 'border-white/10'} text-white focus:outline-none focus:border-blue-400 transition-colors duration-300 font-light tracking-wide peer placeholder-transparent`}
                        placeholder="LinkedIn Job URL"
                      />
                      <label 
                        htmlFor="linkedin" 
                        className="absolute text-sm text-white/60 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-300"
                      >
                        LinkedIn Job URL
                      </label>
                      {linkedinUrlError && (
                        <p className="mt-2 text-sm text-red-400">{linkedinUrlError}</p>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                      <label 
                        htmlFor="resume" 
                        className="relative block w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 cursor-pointer group-hover:border-blue-400/50 transition-colors duration-300 font-light tracking-wide overflow-hidden"
                      >
                        <span className="flex items-center">
                          <Upload className="h-5 w-5 mr-3 text-white/60 group-hover:text-blue-300 transition-colors duration-300" />
                          <span className="group-hover:text-blue-300 transition-colors duration-300">Upload Resume (PDF)</span>
                        </span>
                        <input
                          type="file"
                          id="resume"
                          required
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {formData.resume && (
                          <span className="block mt-2 text-sm text-blue-300 truncate">
                            {formData.resume.name}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting || !!linkedinUrlError}
                      className={`w-full relative group overflow-hidden ${linkedinUrlError ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                      <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-white/10 text-white hover:border-white/30 transition-all duration-300 font-light tracking-wider flex items-center justify-center">
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            Optimize My Resume
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="logo-icon-small relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-sm"></div>
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-md">
                        <Star className="h-4 w-4 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                    <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 tracking-tight">ResumeEdge</span>
                  </div>
                  <p className="text-white/60 mb-6 font-light tracking-wide leading-relaxed">
                    AI-powered resume optimization to help you land your dream job faster.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-white font-light mb-4 tracking-wide">Navigation</h3>
                  <ul className="space-y-2">
                    <li><a href="#how-it-works" className="text-white/60 hover:text-white transition-colors duration-300 font-light tracking-wide">How It Works</a></li>
                    <li><a href="#features" className="text-white/60 hover:text-white transition-colors duration-300 font-light tracking-wide">Features</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-white font-light mb-4 tracking-wide">Legal</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300 font-light tracking-wide">Privacy Policy</a></li>
                    <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300 font-light tracking-wide">Terms of Service</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-8 text-center">
                <p className="text-white/60 font-light tracking-wide">
                  © 2024 GQ Consultancy Inc. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;