import React, { useState, useEffect } from "react";
import {
  Target,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { skillCategories } from "../../data/mockSkills";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Tabs } from "../../components/common/Tabs";
import { ProgressBar } from "../../components/common/ProgressBar";
import { RadarSkillChart } from "../../components/charts/RadarSkillChart";
import { useNotifications } from "../../context/NotificationContext";

export function SkillGapPage() {
  const { addToast } = useNotifications();
  const [activeCategory, setActiveCategory] = useState("All");
  const [skills, setSkills] = useState([]);
  const [radarData, setRadarData] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [data, radar] = await Promise.all([
          studentService.getSkillsData(activeCategory),
          studentService.getRadarData()
        ]);
        setSkills(data);
        setRadarData(radar);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [activeCategory]);
  const strongCount = skills.filter((s) => s.gap === 0).length;
  const gapCount = skills.filter((s) => s.gap > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-8 h-8 text-indigo-600" />
            Skill Gap Intelligence & Learning Roadmap
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare your verified competencies against current industry campus recruitment standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" size="lg">
            {strongCount} Mastered Skills
          </Badge>
          <Badge variant="warning" size="lg">
            {gapCount} Identified Gaps
          </Badge>
        </div>
      </div>

      {/* Overview Card: Radar + Metric Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Skill Health Index"
            subtitle="Weighted benchmark alignment score"
          />
          <div className="py-4 text-center">
            <div className="inline-flex items-baseline gap-1 text-5xl font-extrabold text-indigo-600">
              76<span className="text-xl text-slate-400 font-medium">/100</span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              Overall Technical & Domain Competency
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You are 8 points above the university average for the 2025 cohort.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Fastest growing domain:</span>
              <span className="font-semibold text-emerald-600">Frontend & React (85%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Largest hiring bottleneck:</span>
              <span className="font-semibold text-rose-600">Cloud & Docker (20% gap)</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Domain Proficiency Radar"
            subtitle="Comparing your skill footprint with target software engineer profiles"
          />
          <RadarSkillChart data={radarData} height={280} />
        </Card>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          tabs={skillCategories}
          activeTab={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
        />
        <span className="text-xs text-slate-400 font-medium">
          Showing {skills.length} skills in {activeCategory}
        </span>
      </div>

      {/* Detailed Skill Gap Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skills.map((skill) => {
          const isStrong = skill.gap === 0;
          return (
            <Card
              key={skill.id}
              className="flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{skill.name}</h4>
                    <span className="text-xs text-slate-400">{skill.category}</span>
                  </div>
                  <Badge
                    variant={isStrong ? "success" : skill.priority === "High" ? "danger" : "warning"}
                    size="sm"
                  >
                    {isStrong ? "Benchmark Met" : `${skill.priority} Priority`}
                  </Badge>
                </div>

                <div className="space-y-3 mt-4">
                  {/* Current vs Benchmark Bars */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Your Current Level</span>
                      <span className="text-indigo-600">{skill.currentLevel}%</span>
                    </div>
                    <ProgressBar
                      value={skill.currentLevel}
                      variant={isStrong ? "emerald" : "primary"}
                      size="sm"
                      showPercentage={false}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Industry Required Level</span>
                      <span className="text-slate-700">{skill.requiredLevel}%</span>
                    </div>
                    <ProgressBar
                      value={skill.requiredLevel}
                      variant="purple"
                      size="sm"
                      showPercentage={false}
                    />
                  </div>
                </div>

                {/* Gap & Roadmap info */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 font-medium">Skill Gap:</span>
                    <span
                      className={
                        isStrong
                          ? "font-bold text-emerald-600"
                          : "font-bold text-rose-600"
                      }
                    >
                      {isStrong ? "No Gap (+3% Surplus)" : `-${skill.gap}% Deficit`}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Recommended Action:
                    </p>
                    <p className="text-xs text-slate-700 font-medium">
                      {skill.roadmap}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {skill.endorsements} endorsements
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => addToast(`Learning path for ${skill.name} added to your plan!`, "info")}
                >
                  Bridge Gap
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
