import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Sparkles,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Mic,
  Clock,
  Award
} from "lucide-react";
import { peerService } from "../../services/peerService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function PeerMatchingPage() {
  const { addToast } = useNotifications();
  const [peers, setPeers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [loading, setLoading] = useState(true);

  // Scheduling modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [slot, setSlot] = useState("Tomorrow 6:00 PM");
  const [mode, setMode] = useState("Technical & System Design");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await peerService.getPeers({
          search: searchTerm,
          branch: selectedBranch
        });
        setPeers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchTerm, selectedBranch]);

  const handleOpenInvite = (peer) => {
    setSelectedPeer(peer);
    setInviteModalOpen(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedPeer) return;
    try {
      const res = await peerService.invitePeerForMock(selectedPeer.id, {
        scheduledTime: slot,
        mode
      });
      addToast(res.message, "success");
      setInviteModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-indigo-600" />
            Peer Skill Intelligence & Mock Matching
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pair with students who have complementary strengths to run realistic peer mock interviews.
          </p>
        </div>

        <Badge variant="primary" size="lg">
          AI Complementary Matching Active
        </Badge>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-50/50">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by peer name, skill (e.g. Go, AWS, DSA), or topic..."
              className="w-full pl-10 pr-4 py-2 bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Engineering Branches</option>
              <option value="Computer Science">Computer Science (CSE)</option>
              <option value="Information">Information Technology (ISE)</option>
              <option value="Artificial Intelligence">AI & Machine Learning</option>
              <option value="Electronics">Electronics (ECE)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Peer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {peers.map((peer) => (
          <Card
            key={peer.id}
            className="flex flex-col justify-between hover:border-slate-300 transition-all border-slate-200/90 shadow-xs"
          >
            <div>
              {/* Card Header: Avatar, Name, Match Badge */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={peer.avatar}
                    alt={peer.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{peer.name}</h3>
                    <p className="text-xs text-slate-500">
                      {peer.branch} • Batch {peer.batch}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="primary" size="md" className="font-extrabold text-xs">
                    {peer.matchPercentage}% Match
                  </Badge>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    CGPA: {peer.cgpa}
                  </span>
                </div>
              </div>

              {/* Headline & Complementary Reason */}
              <p className="text-xs font-semibold text-slate-800 mt-3">
                {peer.headline}
              </p>

              <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Why SIPS Matched You:
                </p>
                <p className="text-slate-700 leading-relaxed">{peer.matchReason}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Peer Strengths:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {peer.strengths.slice(0, 3).map((st, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-100"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Wants to Learn:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {peer.wantsToImprove.map((wi, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]"
                      >
                        {wi}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {peer.availability}
                </span>
                <span className="font-medium text-emerald-600">
                  ● {peer.status}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={MessageSquare}
                onClick={() => addToast(`Chat channel initiated with ${peer.name}`, "info")}
              >
                Message
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Mic}
                onClick={() => handleOpenInvite(peer)}
              >
                Schedule Peer Mock
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={`Schedule Peer Mock Session with ${selectedPeer?.name}`}
        subtitle="Both students will receive calendar invitations and structured question rubrics"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Preferred Time Slot
            </label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="Tomorrow 6:00 PM">Tomorrow 6:00 PM - 7:00 PM</option>
              <option value="Wednesday 7:30 PM">Wednesday 7:30 PM - 8:30 PM</option>
              <option value="Saturday 11:00 AM">Saturday 11:00 AM - 12:00 PM</option>
              <option value="Sunday 4:00 PM">Sunday 4:00 PM - 5:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Interview Format / Focus
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="Technical & System Design">Technical & System Design (30m each)</option>
              <option value="Algorithms & Live Coding">Algorithms & LeetCode Hard Drill</option>
              <option value="STAR Behavioral & HR">STAR Behavioral & Conflict Scenarios</option>
            </select>
          </div>

          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900">
            SIPS will automatically generate a tailored question bank matching both students' skill gaps.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm & Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
