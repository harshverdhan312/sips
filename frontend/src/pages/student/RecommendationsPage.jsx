import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Code2,
  Mic,
  Briefcase,
  Layers,
  ArrowRight,
  Clock,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { mockRecommendationsList } from "../../data/mockRecommendations";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Tabs } from "../../components/common/Tabs";
import { useNotifications } from "../../context/NotificationContext";

export function RecommendationsPage() {
  const { addToast } = useNotifications();
  const [activeCategory, setActiveCategory] = useState("all");

  const filterTabs = [
    { id: "all", label: "All Suggestions" },
    { id: "skills", label: "Target Skills" },
    { id: "courses", label: "Courses & Curricula" },
    { id: "practice", label: "Coding Drills" },
    { id: "interviews", label: "Mock Interviews" },
    { id: "jobs", label: "Campus Drives" }
  ];

  const filtered =
    activeCategory === "all"
      ? mockRecommendationsList
      : mockRecommendationsList.filter((r) => r.category === activeCategory);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "skills":
        return Layers;
      case "courses":
        return BookOpen;
      case "practice":
        return Code2;
      case "interviews":
        return Mic;
      case "jobs":
        return Briefcase;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            AI Career Intelligence Recommendations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized interventions derived from your resume score, skill gaps, and active campus drive criteria.
          </p>
        </div>

        <Badge variant="primary" size="lg">
          Dynamic AI Curation
        </Badge>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          tabs={filterTabs}
          activeTab={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
        />
        <span className="text-xs text-slate-400 font-medium">
          Showing {filtered.length} personalized recommendations
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <Card
              key={item.id}
              className="flex flex-col justify-between hover:border-slate-300 transition-all border-slate-200/90 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        item.priority === "High"
                          ? "danger"
                          : item.priority === "Medium"
                          ? "warning"
                          : "primary"
                      }
                      size="sm"
                    >
                      {item.priority} Priority
                    </Badge>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {item.provider}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
                  {item.title}
                </h3>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Why recommended:</strong>
                  {item.reason}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.estTime}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {item.impact}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600">
                  {item.difficulty}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => addToast(`Action triggered for: ${item.title}`, "success")}
                >
                  {item.actionText}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
