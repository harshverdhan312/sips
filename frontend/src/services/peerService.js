import { mockPeersList } from "../data/mockPeers";

export const peerService = {
  async getPeers(filters = {}) {
    await new Promise((res) => setTimeout(res, 200));
    let peers = [...mockPeersList];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      peers = peers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.branch.toLowerCase().includes(q) ||
          p.strengths.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters.branch && filters.branch !== "All") {
      peers = peers.filter((p) => p.branch.includes(filters.branch));
    }
    if (filters.minMatch) {
      peers = peers.filter((p) => p.matchPercentage >= filters.minMatch);
    }
    return peers;
  },

  async invitePeerForMock(peerId, details) {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      message: `Mock interview invitation sent for ${details.scheduledTime || "Tomorrow 6:00 PM"}. Peer notified!`
    };
  }
};
