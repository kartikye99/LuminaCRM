"use client";

import { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  BarChart3,
  Plus,
  Sparkles,
  ArrowRight,
  Zap,
  Menu,
  X,
  Database,
  Send,
  Search,
  Loader2,
} from "lucide-react";

// ---- Shared UI components ----

const SoftPill = ({ children, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3 py-1.5 text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer hover:bg-blue-100 transition-colors border-0"
  >
    {Icon && <Icon size={14} />}
    {children}
  </button>
);

const StatusPill = ({ status }) => {
  const isGood = status === "completed" || status === "delivered" || status === "opened" || status === "clicked";
  const isPending = status === "sending" || status === "pending";
  
  let dotColor = "bg-orange-500";
  if (isGood) dotColor = "bg-green-500";
  if (isPending) dotColor = "bg-blue-500";
  
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-full px-3 py-1 text-xs text-[#374151] inline-flex items-center gap-1.5 capitalize">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </div>
  );
};

const CircularProgress = ({ percentage, color = "#EA580C" }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="#F3F4F6"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-[#111827]">
        {percentage}%
      </span>
    </div>
  );
};

export default function Dashboard() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabs = ["Overview", "Segments", "Campaigns", "Insights"];

  // Database Data States
  const [statsData, setStatsData] = useState({
    totalShoppers: 0,
    activeCampaigns: 0,
    avgOpenRate: "0.0",
    revenueDriven: 0
  });
  const [channelPerf, setChannelPerf] = useState([]);
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Modals & Forms States
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isNewSegmentOpen, setIsNewSegmentOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", segment_id: "", channel: "WhatsApp", message: "" });
  const [newSegment, setNewSegment] = useState({ name: "", description: "", min_spent: "", days_inactive: "" });

  // AI Strategist States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Search Filter
  const [customerSearch, setCustomerSearch] = useState("");

  // Initial Fetch & Polling for live callbacks
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchCampaignsList();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = () => {
    fetchAnalytics();
    fetchCustomersList();
    fetchSegmentsList();
    fetchCampaignsList();
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setStatsData(data.stats);
        setChannelPerf(data.channelPerformance);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchSegmentsList = async () => {
    try {
      const res = await fetch("/api/segments");
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (err) {
      console.error("Error fetching segments:", err);
    }
  };

  const fetchCampaignsList = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  // Action: Ask AI Strategist
  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setAiSuggestLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/segments/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
      }
    } catch (err) {
      console.error("AI suggestion error:", err);
    } finally {
      setAiSuggestLoading(false);
    }
  };

  // Action: Save AI Suggestion drafts
  const handleSaveAiSuggestion = async () => {
    if (!aiSuggestion) return;
    try {
      // 1. Save Segment
      const segRes = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aiSuggestion.segment_name,
          description: aiSuggestion.description,
          criteria: aiSuggestion.criteria
        })
      });
      if (!segRes.ok) throw new Error("Failed to save AI segment");
      const savedSegment = await segRes.json();

      // 2. Save Campaigns (WhatsApp & Email drafts)
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${aiSuggestion.segment_name} WhatsApp`,
          segment_id: savedSegment.id,
          channel: "WhatsApp",
          message: aiSuggestion.message_whatsapp,
          ai_notes: aiSuggestion.reasoning
        })
      });

      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${aiSuggestion.segment_name} Email`,
          segment_id: savedSegment.id,
          channel: "Email",
          message: aiSuggestion.message_email,
          ai_notes: aiSuggestion.reasoning
        })
      });

      // Reset suggestion states and refresh lists
      setAiSuggestion(null);
      setAiPrompt("");
      fetchAllData();
      setActiveTab("Campaigns");
    } catch (err) {
      console.error("Error saving AI drafts:", err);
    }
  };

  // Action: Create Segment manually
  const handleCreateSegmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const criteria = {
        min_spent: newSegment.min_spent ? parseFloat(newSegment.min_spent) : null,
        days_inactive: newSegment.days_inactive ? parseInt(newSegment.days_inactive, 10) : null
      };

      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSegment.name,
          description: newSegment.description,
          criteria
        })
      });

      if (res.ok) {
        setIsNewSegmentOpen(false);
        setNewSegment({ name: "", description: "", min_spent: "", days_inactive: "" });
        fetchAllData();
      }
    } catch (err) {
      console.error("Error creating segment:", err);
    }
  };

  // Action: Create Campaign manually
  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaign.name,
          segment_id: parseInt(newCampaign.segment_id, 10),
          channel: newCampaign.channel,
          message: newCampaign.message
        })
      });

      if (res.ok) {
        setIsNewCampaignOpen(false);
        setNewCampaign({ name: "", segment_id: "", channel: "WhatsApp", message: "" });
        fetchAllData();
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
    }
  };

  // Action: Trigger Send Campaign Loop
  const handleSendCampaign = async (id) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST"
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Error triggering campaign send:", err);
    }
  };

  const stats = [
    { label: "Total Shoppers", value: statsData.totalShoppers.toLocaleString(), change: "Active", icon: Users },
    {
      label: "Active Campaigns",
      value: statsData.activeCampaigns.toString(),
      change: statsData.activeCampaigns > 0 ? "Running" : "Idle",
      icon: MessageSquare,
    },
    { label: "Avg. Open Rate", value: `${statsData.avgOpenRate}%`, change: "Engagement", icon: Zap },
    {
      label: "Revenue Driven",
      value: `$${statsData.revenueDriven.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
      change: "+18%",
      icon: BarChart3,
    },
  ];

  // Filter customers list
  const filteredCustomers = customers.filter(c => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const query = customerSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Inter'] selection:bg-blue-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-semibold tracking-tight text-[#111827] flex items-center gap-2">
                <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
                  <Zap size={18} className="text-white" />
                </div>
                Lumina<span className="text-[#6B7280]">CRM</span>
              </span>

              <div className="hidden md:flex items-center gap-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm h-16 transition-all border-b-2 -mb-[1px] ${
                        isActive
                          ? "text-[#111827] font-semibold border-[#2563EB]"
                          : "text-[#6B7280] font-normal border-transparent hover:text-[#374151]"
                      } border-t-0 border-x-0 bg-transparent cursor-pointer`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <SoftPill icon={Sparkles} onClick={() => { setActiveTab("Segments"); setTimeout(() => document.getElementById("ai-prompt-box")?.focus(), 100); }}>
                Ask AI Strategist
              </SoftPill>
              <button
                onClick={() => setIsNewCampaignOpen(true)}
                className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm cursor-pointer border-0"
              >
                <Plus size={18} />
                <span>New Campaign</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <div className="flex md:hidden items-center gap-2">
              <SoftPill icon={Sparkles} onClick={() => { setActiveTab("Segments"); setIsMobileMenuOpen(false); }}>Ask AI</SoftPill>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#374151] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-3 shadow-lg">
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border-0 transition-colors ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                        : "text-[#374151] hover:bg-gray-50 bg-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            <div className="h-[1px] bg-[#E5E7EB] my-2" />
            <button 
              onClick={() => { setIsNewCampaignOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full bg-[#111827] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm border-0"
            >
              <Plus size={18} />
              <span>New Campaign</span>
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#111827] tracking-tight mb-2">
            {activeTab === "Overview" && "Campaign Intelligence"}
            {activeTab === "Segments" && "Shopper Segments"}
            {activeTab === "Campaigns" && "Messaging Campaigns"}
            {activeTab === "Insights" && "Customer Database"}
          </h1>
          <p className="text-[#6B7280] text-sm">
            {activeTab === "Overview" && "Monitor shopper reach and engagement performance in real-time."}
            {activeTab === "Segments" && "Build, suggestion, and manage target shopper demographic groups."}
            {activeTab === "Campaigns" && "Create custom messaging drafts and launch simulated marketing runs."}
            {activeTab === "Insights" && "View customer history, contact cards, and spent records."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => {
            const isPositive = stat.change.includes("+") || stat.change.includes("Running") || stat.change.includes("Active");
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-[#E5E7EB] p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#F9FAFB] rounded-lg">
                    <stat.icon size={20} className="text-[#6B7280]" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-green-50 text-green-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-1">
                  {stat.label}
                </h3>
                <p className="text-2xl font-semibold text-[#111827]">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign list */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111827]">
                      Campaign Performance
                    </h2>
                    <p className="text-[#6B7280] text-sm mt-1">
                      Live dispatch logs and engagement loops.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-[#6B7280]">
                      System Connected
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {campaigns.length === 0 ? (
                    <div className="p-12 text-center">
                      <Database className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-sm text-[#6B7280] font-medium">No campaigns found.</p>
                      <button 
                        onClick={() => setIsNewCampaignOpen(true)}
                        className="mt-3 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors border-0 cursor-pointer"
                      >
                        Create Campaign
                      </button>
                    </div>
                  ) : (
                    campaigns.slice(0, 5).map((campaign) => {
                      const segmentObj = segments.find(s => s.id === campaign.segment_id);
                      
                      // Calculate engagement percentage mock or visual
                      let engRate = 0;
                      if (campaign.status === "sending") engRate = 45;
                      else if (campaign.status === "completed") engRate = 65;
                      else if (campaign.status === "delivered") engRate = 72;
                      else if (campaign.status === "opened") engRate = 88;
                      else if (campaign.status === "clicked") engRate = 95;
                      
                      const ringColor = engRate > 70 ? "#2563EB" : "#EA580C";

                      return (
                        <div
                          key={campaign.id}
                          className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9FAFB] transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <CircularProgress
                              percentage={engRate || 0}
                              color={ringColor}
                            />
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[#111827] truncate">
                                {campaign.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-[#6B7280] truncate max-w-[180px] sm:max-w-none">
                                  {segmentObj ? segmentObj.name : "All Shoppers"}
                                </span>
                                <span className="text-[#E5E7EB]">•</span>
                                <span className="text-xs text-[#6B7280] font-mono">
                                  {campaign.channel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-gray-100 sm:border-t-0 pt-3 sm:pt-0">
                            <StatusPill status={campaign.status} />
                            {campaign.status === "draft" ? (
                              <button
                                onClick={() => handleSendCampaign(campaign.id)}
                                className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors border-0 cursor-pointer"
                              >
                                <Send size={12} />
                                Send
                              </button>
                            ) : (
                              <ArrowRight
                                size={16}
                                className="text-[#D1D5DB] group-hover:text-[#2563EB] transition-all hidden sm:block"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Channel breakdown */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-4">
                  Channel Performance
                </h3>
                <div className="space-y-4">
                  {channelPerf.length === 0 ? (
                    <p className="text-xs text-[#6B7280] text-center py-4">No channel dispatches logged yet.</p>
                  ) : (
                    channelPerf.map((c) => (
                      <div key={c.channel} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center justify-between sm:w-20">
                          <span className="text-xs font-mono font-semibold text-[#111827] sm:text-[#6B7280]">
                            {c.channel}
                          </span>
                          <span className="sm:hidden text-[11px] text-[#9CA3AF]">
                            {c.sent.toLocaleString()} sent
                          </span>
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${c.openRate}%`,
                                backgroundColor: c.color,
                              }}
                            />
                          </div>
                          <span className="w-10 sm:w-12 text-right text-xs font-semibold text-[#111827]">
                            {c.openRate}%
                          </span>
                        </div>
                        <span className="hidden sm:block w-20 text-right text-[11px] text-[#9CA3AF]">
                          {c.sent.toLocaleString()} sent
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Strategist (Sidebar suggestion drawer) */}
              <div className="bg-[#111827] rounded-xl p-6 text-white relative overflow-hidden">
                <Sparkles
                  size={48}
                  className="absolute -right-4 -top-4 opacity-10"
                />
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-400" />
                  AI Segment Strategist
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Provide a marketing goal prompt and let Gemini suggest optimal segmentation criteria and message copies.
                </p>

                <div className="space-y-3">
                  <input
                    id="ai-prompt-box"
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Find shoppers spent > $5000 lapsed 30 days"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  
                  {aiSuggestLoading && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="text-xs text-gray-400">Gemini brainstorming...</span>
                    </div>
                  )}

                  {aiSuggestion && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3 text-left">
                      <div>
                        <span className="text-[10px] text-blue-400 uppercase block font-semibold">Suggested Segment</span>
                        <span className="text-sm font-semibold">{aiSuggestion.segment_name}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{aiSuggestion.description}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-400 uppercase block font-semibold">Criteria</span>
                        <p className="text-xs font-mono text-gray-300">
                          {aiSuggestion.criteria.min_spent && `spent >= $${aiSuggestion.criteria.min_spent}`}
                          {aiSuggestion.criteria.min_spent && aiSuggestion.criteria.days_inactive && " & "}
                          {aiSuggestion.criteria.days_inactive && `inactive >= ${aiSuggestion.criteria.days_inactive} days`}
                        </p>
                      </div>
                      <button
                        onClick={handleSaveAiSuggestion}
                        className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-semibold transition-colors border-0 cursor-pointer"
                      >
                        Create Segment & Drafts
                      </button>
                    </div>
                  )}
                  
                  {!aiSuggestion && !aiSuggestLoading && (
                    <button
                      onClick={handleAiSuggest}
                      disabled={!aiPrompt.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors border-0 cursor-pointer"
                    >
                      Generate Strategy Suggestion
                    </button>
                  )}
                </div>
              </div>

              {/* Technical Logs */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Technical Callback Logs
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-[#6B7280] font-medium">
                      LIVE FEED
                    </span>
                  </div>
                </div>
                <div className="space-y-0 max-h-[300px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-xs text-[#6B7280] text-center py-6">No callback events received yet.</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={`${log.event}-${i}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB] mt-1" />
                          <div className="w-[1px] flex-1 bg-[#E5E7EB]" />
                        </div>
                        <div className="pb-4">
                          <div className="flex justify-between items-center mb-1 gap-3">
                            <span className="text-xs font-semibold text-[#111827]">
                              {log.event}
                            </span>
                            <span className="text-[10px] text-[#6B7280] whitespace-nowrap">
                              {log.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] leading-tight">
                            {log.desc}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEGMENTS */}
        {activeTab === "Segments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#111827]">Audience Segments</h2>
              <button
                onClick={() => setIsNewSegmentOpen(true)}
                className="bg-[#111827] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800 flex items-center gap-1.5 border-0 cursor-pointer"
              >
                <Plus size={16} />
                Create Segment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Segment Cards */}
              <div className="md:col-span-2 space-y-4">
                {segments.length === 0 ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
                    <Users className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-[#6B7280] text-sm">No audience segments defined yet.</p>
                  </div>
                ) : (
                  segments.map((seg) => {
                    const criteria = typeof seg.criteria === 'string' ? JSON.parse(seg.criteria) : seg.criteria;
                    return (
                      <div key={seg.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-gray-300 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-[#111827]">{seg.name}</h3>
                          <span className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold rounded-full px-2.5 py-1">
                            {seg.customer_count} shoppers matched
                          </span>
                        </div>
                        <p className="text-sm text-[#6B7280] mb-4">{seg.description}</p>
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex gap-2">
                            {criteria.min_spent && (
                              <span className="bg-gray-100 text-[#374151] rounded-lg px-2 py-1">
                                Spent &gt;= ${criteria.min_spent}
                              </span>
                            )}
                            {criteria.days_inactive && (
                              <span className="bg-gray-100 text-[#374151] rounded-lg px-2 py-1">
                                Inactive &gt;= {criteria.days_inactive} days
                              </span>
                            )}
                            {!criteria.min_spent && !criteria.days_inactive && (
                              <span className="text-gray-400 italic">No filtering criteria (All users)</span>
                            )}
                          </div>
                          <span className="text-gray-400">Created: {new Date(seg.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* AI Segment Strategist Box */}
              <div className="space-y-4">
                <div className="bg-[#111827] text-white rounded-xl p-6">
                  <Sparkles className="text-blue-400 mb-3" size={24} />
                  <h3 className="font-semibold text-lg mb-2">AI Segment Designer</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    Describe who you want to target (e.g. "inactive customer with high historical value") and Gemini will configure the database rules and write campaign copy.
                  </p>
                  
                  <div className="space-y-3">
                    <textarea
                      rows="3"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Target customers who spent $3000 but haven't shopped in 2 months..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    {aiSuggestLoading && (
                      <div className="flex items-center justify-center gap-1.5 py-2">
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                        <span className="text-[11px] text-gray-400">Analyzing segment...</span>
                      </div>
                    )}

                    {aiSuggestion && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3 text-xs">
                        <div>
                          <span className="text-[9px] text-blue-400 uppercase block font-semibold">Suggested Name</span>
                          <span className="font-semibold text-sm">{aiSuggestion.segment_name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-blue-400 uppercase block font-semibold">Rules Config</span>
                          <p className="font-mono text-gray-300">
                            Spent &gt;= ${aiSuggestion.criteria.min_spent || 0} &amp;&amp; Inactive &gt;= {aiSuggestion.criteria.days_inactive || 0} days
                          </p>
                        </div>
                        <button
                          onClick={handleSaveAiSuggestion}
                          className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg py-2 font-semibold transition-colors border-0 cursor-pointer"
                        >
                          Approve and Create Drafts
                        </button>
                      </div>
                    )}

                    {!aiSuggestion && !aiSuggestLoading && (
                      <button
                        onClick={handleAiSuggest}
                        disabled={!aiPrompt.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors border-0 cursor-pointer"
                      >
                        Generate AI Concept
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAMPAIGNS */}
        {activeTab === "Campaigns" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#111827]">Marketing Campaigns</h2>
              <button
                onClick={() => setIsNewCampaignOpen(true)}
                className="bg-[#111827] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800 flex items-center gap-1.5 border-0 cursor-pointer"
              >
                <Plus size={16} />
                Create Campaign
              </button>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E5E7EB] text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      <th className="px-6 py-4">Campaign Name</th>
                      <th className="px-6 py-4">Audience Segment</th>
                      <th className="px-6 py-4">Medium/Channel</th>
                      <th className="px-6 py-4">Message Content</th>
                      <th className="px-6 py-4">Dispatch Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-sm text-[#374151]">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-[#6B7280]">
                          <Database className="mx-auto text-gray-300 mb-2" size={32} />
                          No campaigns created yet.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((camp) => {
                        const segmentObj = segments.find(s => s.id === camp.segment_id);
                        return (
                          <tr key={camp.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-6 py-4 font-semibold text-[#111827]">{camp.name}</td>
                            <td className="px-6 py-4">{segmentObj ? segmentObj.name : "Unassigned"}</td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-gray-100 rounded px-1.5 py-0.5 text-xs">
                                {camp.channel}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-[220px] truncate">{camp.message}</td>
                            <td className="px-6 py-4">
                              <StatusPill status={camp.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              {camp.status === "draft" ? (
                                <button
                                  onClick={() => handleSendCampaign(camp.id)}
                                  className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 inline-flex transition-colors border-0 cursor-pointer"
                                >
                                  <Send size={12} />
                                  Send Campaign
                                </button>
                              ) : (
                                <span className="text-xs text-[#9CA3AF] italic">Mock loop active</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INSIGHTS (CUSTOMERS) */}
        {activeTab === "Insights" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-[#111827]">Shopper Database</h2>
              
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2 text-sm text-[#111827] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E5E7EB] text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Total Spent</th>
                      <th className="px-6 py-4">Last Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-sm text-[#374151]">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-[#6B7280]">
                          No shoppers match the search.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4 font-semibold text-[#111827]">
                            {cust.first_name} {cust.last_name}
                          </td>
                          <td className="px-6 py-4">{cust.email}</td>
                          <td className="px-6 py-4 font-mono text-xs">{cust.phone || 'N/A'}</td>
                          <td className="px-6 py-4 font-semibold text-[#111827]">
                            ${parseFloat(cust.total_spent).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {cust.last_purchase_date ? new Date(cust.last_purchase_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE SEGMENT */}
      {isNewSegmentOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Create Custom Segment</h3>
              <button 
                onClick={() => setIsNewSegmentOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg bg-transparent border-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSegmentSubmit} className="space-y-4 text-sm text-left">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Segment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Inactive Shoppers"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Shoppers who spent over $5000 and haven't bought in 30 days"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Min Spent ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newSegment.min_spent}
                    onChange={(e) => setNewSegment({ ...newSegment, min_spent: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Days Inactive</label>
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={newSegment.days_inactive}
                    onChange={(e) => setNewSegment({ ...newSegment, days_inactive: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSegmentOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#374151] rounded-lg py-2.5 font-semibold transition-colors border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#111827] hover:bg-gray-800 text-white rounded-lg py-2.5 font-semibold transition-colors border-0 cursor-pointer"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CAMPAIGN */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Create Messaging Campaign</h3>
              <button 
                onClick={() => setIsNewCampaignOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg bg-transparent border-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-sm text-left">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Solstice Launch"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Target Segment</label>
                  <select
                    required
                    value={newCampaign.segment_id}
                    onChange={(e) => setNewCampaign({ ...newCampaign, segment_id: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose segment...</option>
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.customer_count})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Medium/Channel</label>
                  <select
                    value={newCampaign.channel}
                    onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="RCS">RCS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase mb-1">Message Content</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Type your marketing message copy here. Use {{first_name}} to personalize."
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#374151] rounded-lg py-2.5 font-semibold transition-colors border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#111827] hover:bg-gray-800 text-white rounded-lg py-2.5 font-semibold transition-colors border-0 cursor-pointer"
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
