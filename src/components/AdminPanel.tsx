import React, { useState, useEffect } from "react";
import { 
  Shield, Users, ArrowUpRight, ArrowDownLeft, TrendingUp, Clock, 
  Activity, FileText, CheckCircle2, XCircle, MessageSquare, Search, 
  Lock, Unlock, Settings, CreditCard, Wallet, AlertCircle, Filter, 
  Check, Edit, Plus, Trash, UserCheck, UserX, AlertTriangle, Send, 
  BadgeHelp, RefreshCw, X, ChevronRight, HelpCircle
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

// TypeScript Interfaces for Frontend Admin Portal
interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "suspended";
  verified: boolean;
  registrationDate: string;
  balances: { [symbol: string]: number };
  avgProfitPercentage: number;
  accountNotes: string;
  activityHistory: { time: string; action: string; ip: string }[];
  profitHistory: { date: string; amount: number; description: string }[];
  isTwoFactorEnabled: boolean;
  role: "admin" | "user";
}

interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: string;
  currency: string;
  amount: number;
  amountInCrypto?: number;
  paymentProofUrl?: string;
  walletAddress?: string;
  txHash?: string;
  bankName?: string;
  bankAccountRef?: string;
  status: "pending" | "approved" | "rejected";
  adminComments?: string;
  timestamp: string;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: "bank" | "crypto";
  currency: string;
  amount: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  walletAddress?: string;
  network?: string;
  status: "pending" | "processing" | "approved" | "rejected";
  adminNotes?: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  status: "open" | "closed";
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: {
    id: string;
    sender: "user" | "admin" | "system";
    senderName: string;
    message: string;
    timestamp: string;
  }[];
  timestamp: string;
}

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface DashboardStats {
  usersCount: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfits: number;
  recentAudits: AuditLog[];
}

interface AdminPanelProps {
  currentAdminEmail: string;
  onLogout: () => void;
  triggerGlobalToast: (msg: string) => void;
}

export default function AdminPanel({ currentAdminEmail, onLogout, triggerGlobalToast }: AdminPanelProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "users" | "deposits" | "withdrawals" | "support" | "faqs" | "gateways">("overview");

  // Enterprise States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic deposit settlement routing coordinates state
  const [gatewayConfig, setGatewayConfig] = useState<any>({
    bankName: "",
    routingNumber: "",
    accountNumber: "",
    cryptoAddresses: {
      USDT: { name: "", address: "", sub: "" },
      BTC: { name: "", address: "", sub: "" },
      ETH: { name: "", address: "", sub: "" },
      SOL: { name: "", address: "", sub: "" }
    }
  });

  // Local helper states for editing coordinates
  const [editBankName, setEditBankName] = useState("");
  const [editRoutingNumber, setEditRoutingNumber] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  
  const [editUsdtAddress, setEditUsdtAddress] = useState("");
  const [editBtcAddress, setEditBtcAddress] = useState("");
  const [editEthAddress, setEditEthAddress] = useState("");
  const [editSolAddress, setEditSolAddress] = useState("");

  // Search & Filter state
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Modification forms
  const [adjustVal, setAdjustVal] = useState("");
  const [adjustAsset, setAdjustAsset] = useState("USD");
  const [profitPercentInput, setProfitPercentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [bonusInput, setBonusInput] = useState("");
  const [lossInput, setLossInput] = useState("");
  const [adminReason, setAdminReason] = useState("");
  
  // Deposit Action fields
  const [depositComment, setDepositComment] = useState("");
  const [viewingDepSlip, setViewingDepSlip] = useState<DepositRequest | null>(null);

  // Withdrawal Action fields
  const [withdrawalComment, setWithdrawalComment] = useState("");

  // Support Action fields
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState("");

  // FAQ Addition fields
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newFaqCat, setNewFaqCat] = useState("general");

  // Fetch core telemetry on tab loading
  const fetchAllTelemetry = async () => {
    setLoading(true);
    try {
      const [resStats, resUsers, resDeposits, resWithdrawals, resTickets, resFaqs, resGateways] = await Promise.all([
        fetch("/api/admin/overview").then(res => res.json()),
        fetch("/api/admin/users").then(res => res.json()),
        fetch("/api/admin/deposits").then(res => res.json()),
        fetch("/api/admin/withdrawals").then(res => res.json()),
        fetch("/api/admin/tickets").then(res => res.json()),
        fetch("/api/admin/faqs").then(res => res.json()),
        fetch("/api/admin/payment-coordinates").then(res => res.json()).catch(() => null)
      ]);

      setStats(resStats);
      setUsers(resUsers);
      setDeposits(resDeposits);
      setWithdrawals(resWithdrawals);
      setTickets(resTickets);
      setFaqs(resFaqs);

      if (resGateways) {
        setGatewayConfig(resGateways);
        setEditBankName(resGateways.bankName || "");
        setEditRoutingNumber(resGateways.routingNumber || "");
        setEditAccountNumber(resGateways.accountNumber || "");
        setEditUsdtAddress(resGateways.cryptoAddresses?.USDT?.address || "");
        setEditBtcAddress(resGateways.cryptoAddresses?.BTC?.address || "");
        setEditEthAddress(resGateways.cryptoAddresses?.ETH?.address || "");
        setEditSolAddress(resGateways.cryptoAddresses?.SOL?.address || "");
      }

      // Refresh selection links
      if (selectedUser) {
        const freshUser = resUsers.find((u: UserAccount) => u.id === selectedUser.id);
        if (freshUser) setSelectedUser(freshUser);
      }
      if (activeTicket) {
        const freshTkt = resTickets.find((t: SupportTicket) => t.id === activeTicket.id);
        if (freshTkt) setActiveTicket(freshTkt);
      }
    } catch (err) {
      triggerGlobalToast("Failed parsing admin pipeline logs. Verify server connections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
  }, [activeSubTab]);

  // Handle individual User Adjustments
  const handleUserUpdate = async (userId: string, updatePayload: any) => {
    if (!adminReason.trim()) {
      triggerGlobalToast("Error: Mandatory audit reason is required for any administrative adjustment.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatePayload,
          adminEmailReason: adminReason
        })
      });

      if (!response.ok) {
         const errData = await response.json();
         triggerGlobalToast(`Error executing adjustment: ${errData.error}`);
         return;
      }

      const block = await response.json();
      if (block.success) {
        triggerGlobalToast("Corporate ledger entry aligned and executed successfully.");
        setSelectedUser(block.user);
        
        // Reset inputs
        setAdjustVal("");
        setBonusInput("");
        setLossInput("");
        setAdminReason("");
        fetchAllTelemetry();
      }
    } catch (error) {
      triggerGlobalToast("Connection failure validating user adjustments.");
    }
  };

  // Handle Deposits Approve/Reject
  const handleDepositDecision = async (depId: string, approve: boolean) => {
    const endpoint = `/api/admin/deposits/${depId}/${approve ? "approve" : "reject"}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminComments: depositComment || "Authorized manually by Apex clearinghouse." })
      });

      if (response.ok) {
        triggerGlobalToast(`Deposit successfully ${approve ? "approved and account credited." : "rejected."}`);
        setDepositComment("");
        setViewingDepSlip(null);
        fetchAllTelemetry();
      }
    } catch (err) {
      triggerGlobalToast("Error adjusting asset deposit statuses.");
    }
  };

  // Handle Withdrawals Settlement
  const handleWithdrawalStatus = async (wthId: string, status: "processing" | "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${wthId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: withdrawalComment || `Withdrawal transitioned to status: ${status}`
        })
      });

      if (response.ok) {
        triggerGlobalToast(`Payout status calibrated: ${status.toUpperCase()}`);
        setWithdrawalComment("");
        fetchAllTelemetry();
      }
    } catch (err) {
      triggerGlobalToast("Error dispatching custom withdrawal status updates.");
    }
  };

  // Handle Support Reply
  const handleSupportReply = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "admin",
          senderName: "Apex Corporate Helpdesk Guide",
          message: ticketReply
        })
      });

      if (response.ok) {
        setTicketReply("");
        fetchAllTelemetry();
        triggerGlobalToast("Corporate dispatch reply sent to standard user view.");
      }
    } catch (err) {
      triggerGlobalToast("Failed uploading live ticket responses.");
    }
  };

  // Handle FAQ Creation
  const handleAddFaq = async () => {
    if (!newFaqQ || !newFaqA) return;
    try {
      const response = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newFaqQ,
          answer: newFaqA,
          category: newFaqCat
        })
      });

      if (response.ok) {
        setNewFaqQ("");
        setNewFaqA("");
        setNewFaqCat("general");
        fetchAllTelemetry();
        triggerGlobalToast("New FAQ item integrated successfully.");
      }
    } catch (err) {
      triggerGlobalToast("Failed registering FAQ nodes.");
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        fetchAllTelemetry();
        triggerGlobalToast("FAQ category index node removed.");
      }
    } catch (err) {
      triggerGlobalToast("Error cleansing FAQ records.");
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => {
    const name = u.name || "";
    const email = u.email || "";
    const phone = u.phone || "";
    const id = u.id || "";
    const q = (userQuery || "").toLowerCase();
    return name.toLowerCase().includes(q) ||
           email.toLowerCase().includes(q) ||
           phone.toLowerCase().includes(q) ||
           id.toLowerCase().includes(q);
  });

  // Financial simulation dataset for charts
  const volumeData = [
    { name: "Mon", Deposits: 3200, Payouts: 2100, Revenue: 1100 },
    { name: "Tue", Deposits: 5400, Payouts: 1800, Revenue: 3600 },
    { name: "Wed", Deposits: 12000, Payouts: 4100, Revenue: 7900 },
    { name: "Thu", Deposits: 8500, Payouts: 6000, Revenue: 2500 },
    { name: "Fri", Deposits: 14500, Payouts: 5000, Revenue: 9500 },
    { name: "Sat", Deposits: 9200, Payouts: 3200, Revenue: 6000 },
    { name: "Sun", Deposits: 15400, Payouts: 4500, Revenue: 10900 },
  ];

  const userRoleData = [
    { name: "Active", value: stats?.activeUsers || 1 },
    { name: "Suspended", value: (stats?.usersCount || 3) - (stats?.activeUsers || 2) },
  ];

  const COLORS = ["#10B981", "#EF4444"];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Title Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
            <Shield className="text-amber-500 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-sans font-bold text-white tracking-tight">Institutional Administrative Command Room</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Secure Core • Role: Global Officer • Authenticated: {currentAdminEmail}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={fetchAllTelemetry}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 p-2 rounded-xl border border-slate-700 transition"
            title="Force Synchronize Telemetry"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button
            onClick={onLogout}
            className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3.5 py-1.8 rounded-xl border border-rose-500/30 font-semibold transition cursor-pointer"
          >
            Secure Log Out Terminal
          </button>
        </div>
      </div>

      {/* Admin Tab Selectors */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800/60 my-4 py-1">
        {[
          { id: "overview", label: "Dashboard Overview", icon: Activity },
          { id: "users", label: "Registered Users", icon: Users },
          { id: "deposits", label: `Deposits Approval (${deposits.filter(d=>d.status==='pending').length})`, icon: CreditCard },
          { id: "withdrawals", label: `Withdrawals Escrow (${withdrawals.filter(w=>w.status==='pending').length})`, icon: Wallet },
          { id: "support", label: `Support Tickets (${tickets.filter(t=>t.unreadByAdmin).length})`, icon: MessageSquare },
          { id: "faqs", label: "FAQ Node Manager", icon: HelpCircle },
          { id: "gateways", label: "Configure Gateways", icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setSelectedUser(null); setActiveTicket(null); setActiveSubTab(tab.id as any); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl tracking-tight transition whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? "bg-amber-500 text-slate-950 shadow-md" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* LOADING SPINNERS */}
      {loading && !stats ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="animate-spin text-amber-500 w-10 h-10" />
          <span className="text-xs font-mono text-slate-400">Downloading institutional database streams...</span>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ======================= TAB 1: OVERVIEW ======================= */}
          {activeSubTab === "overview" && stats && (
            <div className="space-y-6 animate-slide-up">
              {/* Core Indicators */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "REGISTERED INVESTORS", value: stats.usersCount, sub: `${stats.activeUsers} status active`, icon: Users, color: "text-blue-400 bg-blue-500/5 border-blue-500/20" },
                  { label: "COMPREHENSIVE DEPOSITS", value: `$${stats.totalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: `${deposits.filter(d=>d.status==='pending').length} pending approval`, icon: ArrowUpRight, color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" },
                  { label: "SETTLED WITHDRAWALS", value: `$${stats.totalWithdrawals.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: `${withdrawals.filter(w=>w.status==='pending').length} pending escrow`, icon: ArrowDownLeft, color: "text-rose-400 bg-rose-500/5 border-rose-500/20" },
                  { label: "CUMULATIVE PROFITS", value: `$${stats.totalProfits.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "Distributed across networks", icon: TrendingUp, color: "text-amber-400 bg-amber-500/5 border-amber-500/20" }
                ].map((item, id) => {
                  const Icon = item.icon;
                  return (
                    <div key={id} className={`p-4.5 rounded-2xl border ${item.color} flex flex-col justify-between h-28`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">{item.label}</span>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span className="text-lg md:text-xl font-bold tracking-tight text-white block mt-2">{item.value}</span>
                        <span className="text-[10px] text-slate-400 mt-1 block font-mono">● {item.sub}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-850">
                  <span className="text-xs uppercase font-extrabold font-mono text-slate-400 tracking-wider">Deposits vs Payout Processing Performance</span>
                  <div className="h-64 mt-4 text-[10px] font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={volumeData}>
                        <defs>
                          <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "10px" }} />
                        <Area type="monotone" dataKey="Deposits" stroke="#10B981" fillOpacity={1} fill="url(#colorDeposits)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Payouts" stroke="#EF4444" fillOpacity={1} fill="url(#colorPayouts)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase font-extrabold font-mono text-slate-400 tracking-wider">Account Active Integrity Index</span>
                    <div className="h-44 mt-4 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userRoleData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {userRoleData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Authorized Investors
                      </span>
                      <span className="font-mono text-white font-bold">{stats.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Suspended Flags
                      </span>
                      <span className="font-mono text-white font-bold">{stats.usersCount - stats.activeUsers}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Audit Logs Trail */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={15} className="text-amber-500" />
                    <span className="text-xs uppercase font-bold text-white tracking-widest font-sans">Secure Change Audit & Security Records</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-mono">100% Immutable Log System</span>
                </div>
                <div className="divide-y divide-slate-900 overflow-y-auto max-h-56 mt-2 font-mono text-[10px]">
                  {stats.recentAudits.map(audit => (
                    <div key={audit.id} className="py-2.5 flex flex-col sm:flex-row justify-between gap-1.5 hover:bg-slate-900/40 px-2 rounded-lg transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase">{audit.actor}</span>
                          <span className="text-white font-bold">{audit.action}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{audit.details}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-between text-slate-500 text-[9px]">
                        <span>IP: {audit.ip}</span>
                        <span>{new Date(audit.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ======================= TAB 2: REGISTERED USERS ======================= */}
          {activeSubTab === "users" && (
            <div className="space-y-6 animate-slide-up">
              
              {!selectedUser ? (
                <div className="space-y-4">
                  {/* Search layout */}
                  <div className="flex bg-slate-950 px-4 py-3 rounded-2xl border border-slate-850 items-center gap-2 max-w-lg">
                    <Search size={16} className="text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search users by name, email, account ID, or phone number..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="bg-transparent border-none focus:outline-none w-full text-slate-300 placeholder-slate-600 text-xs"
                    />
                  </div>

                  {/* Users visual list Table */}
                  <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950 font-sans text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-semibold font-mono text-[10px] tracking-wider">
                          <th className="p-4">INVESTOR EMAIL / ID</th>
                          <th className="p-4">INVESTOR NAME</th>
                          <th className="p-4">PHONE</th>
                          <th className="p-4 text-center">COMPLIANCE</th>
                          <th className="p-4 text-center">STATUS</th>
                          <th className="p-4 text-right">LIQUID USD BALLAST</th>
                          <th className="p-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-10 text-center text-slate-500 font-mono">
                              No investor files match current lookup guidelines inside Apex registers.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => (
                            <tr key={u.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition">
                              <td className="p-4">
                                <span className="font-semibold text-white block">{u.email}</span>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                              </td>
                              <td className="p-4 text-slate-300 font-medium">{u.name}</td>
                              <td className="p-4 text-slate-400 font-mono">{u.phone}</td>
                              <td className="p-4 text-center">
                                {u.verified ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[9px] font-mono tracking-widest uppercase">Verified KYC</span>
                                ) : (
                                  <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] font-mono tracking-widest uppercase">Unverified</span>
                                )}{u.isTwoFactorEnabled && <span className="bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded text-[8px] font-mono ml-1 uppercase">2FA</span>}
                              </td>
                              <td className="p-4 text-center">
                                {u.status === "active" ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] border border-emerald-500/10 font-bold uppercase">Active</span>
                                ) : (
                                  <span className="bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-lg text-[10px] border border-rose-500/10 font-bold uppercase">Suspended</span>
                                )}
                              </td>
                              <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                ${(u.balances["USD"] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} USDT
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-400 transition"
                                >
                                  Calibrate Profile
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // INVESTOR HIGH END FILE DRAWER / INSPECTOR VIEW
                <div className="space-y-6 animate-slide-up">
                  {/* Title & Back bar */}
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <button
                      onClick={() => { setSelectedUser(null); setAdminReason(""); }}
                      className="text-amber-500 hover:underline text-xs flex items-center gap-1 font-mono font-bold cursor-pointer"
                    >
                      &larr; Back to Investor Table
                    </button>
                    <span className="text-[10px] uppercase text-slate-400 font-mono">FILE PROFILE FOR ID: {selectedUser.id}</span>
                  </div>

                  {/* Header summary card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-mono font-bold text-lg">
                          {selectedUser.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                          <span className="text-slate-400 font-mono text-xs">{selectedUser.email}</span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">Reg Date: {new Date(selectedUser.registrationDate).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 font-mono text-[10px]">
                        <div>
                          <span className="text-slate-500 block">KYC STATUS</span>
                          <span className={`font-bold ${selectedUser.verified ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {selectedUser.verified ? 'VERIFIED' : 'PENDING APPROVAL'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">SYSTEM FLAG</span>
                          <span className={`font-bold ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {selectedUser.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balances inspection panel */}
                    <div className="md:col-span-2 bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs uppercase font-extrabold font-mono text-slate-400">Total Portfolio Ballasts</span>
                        <span className="text-xs text-amber-500 font-mono font-bold">VIP Split Profit Multiplier: {selectedUser.avgProfitPercentage}%</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                        {Object.entries(selectedUser.balances).map(([symbol, qty]) => (
                          <div key={symbol} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">{symbol} BALANCE</span>
                            <span className="text-sm font-bold text-white mt-1 block">
                              {Number(qty).toFixed(symbol === 'USD' ? 2 : 4)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono whitespace-pre-wrap">
                        <span className="text-slate-500 block uppercase font-bold mb-1">Confidential Administrative Notes on File</span>
                        <p className="text-slate-300 text-xs italic">
                          {selectedUser.accountNotes || "No notes on record for this investor."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mandated Reason Input */}
                  <div className="bg-slate-950 p-4 rounded-2xl border-2 border-amber-500/25 space-y-2">
                    <label className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                      <AlertTriangle size={14} /> Mandated Administrative Audit Comment
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Specify why you are modifying balance, profit percent, or statuses (e.g. VIP Calibration, deposit manually approved via bank statement)..."
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      className="w-full bg-slate-900 text-slate-200 border border-slate-800 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-slate-500 font-mono">Warning: This entry is permanently saved in system security logs matched to your admin IP.</p>
                  </div>

                  {/* Action controls grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Panel 1: Adjust balances and VIP profit rates */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-4">
                      <span className="text-xs uppercase font-extrabold text-white block border-b border-slate-850 pb-2">Direct Balance & Profit Percentage Manual Spanning</span>
                      
                      {/* Adjust Balance asset */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Calibration Cash Magnitude (e.g. -500 or +1000)</label>
                          <input 
                            type="number"
                            placeholder="Amount (+/-)"
                            value={adjustVal}
                            onChange={(e) => setAdjustVal(e.target.value)}
                            className="w-full bg-slate-900 text-white border border-slate-800 px-3 py-2 text-xs rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Asset Token</label>
                          <select 
                            value={adjustAsset}
                            onChange={(e) => setAdjustAsset(e.target.value)}
                            className="w-full bg-slate-900 text-white border border-slate-800 px-2 py-2 text-xs rounded-lg h-9"
                          >
                            {Object.keys(selectedUser.balances).map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                            <option value="BNB">BNB</option>
                            <option value="USDT">USDT</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUserUpdate(selectedUser.id, { adjustBalanceVal: adjustVal, adjustBalanceAsset: adjustAsset })}
                        className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-xl text-xs hover:bg-amber-400 transition cursor-pointer"
                      >
                        Execute Cash Balances Calibration
                      </button>

                      <div className="pt-3 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Profit percent modification */}
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Set VIP Profit Tier (%)</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="number" 
                              step="0.1"
                              placeholder={selectedUser.avgProfitPercentage.toString()}
                              value={profitPercentInput}
                              onChange={(e) => setProfitPercentInput(e.target.value)}
                              className="bg-slate-900 text-white border border-slate-800 px-3 py-1.5 text-xs rounded-lg w-full"
                            />
                            <button
                              onClick={() => {
                                handleUserUpdate(selectedUser.id, { avgProfitPercentage: profitPercentInput });
                                setProfitPercentInput("");
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-750"
                            >
                              Set
                            </button>
                          </div>
                        </div>

                        {/* File Notes modifier */}
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Update Security File Notes</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              placeholder="Update notes..."
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              className="bg-slate-900 text-white border border-slate-800 px-3' py-1.5 text-xs rounded-lg w-full"
                            />
                            <button
                              onClick={() => {
                                handleUserUpdate(selectedUser.id, { accountNotes: notesInput });
                                setNotesInput("");
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Financial adjustments and restrictions */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-4">
                      <span className="text-xs uppercase font-extrabold text-white block border-b border-slate-850 pb-2">Manual Margin Payout Tools & Access Rights</span>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Add Bonus */}
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Credit Bonus Cash ($ USD)</label>
                          <div className="flex gap-1">
                            <input 
                              type="number" 
                              placeholder="e.g. 500"
                              value={bonusInput}
                              onChange={(e) => setBonusInput(e.target.value)}
                              className="bg-slate-900 text-white border border-slate-800 px-2 py-1.5 text-xs rounded-lg w-full"
                            />
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { addBonusAmount: bonusInput })}
                              className="bg-emerald-500 text-slate-950 font-bold px-2 rounded-lg text-xs hover:bg-emerald-400"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Deduct Losses */}
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Debit Losses ($ USD)</label>
                          <div className="flex gap-1">
                            <input 
                              type="number" 
                              placeholder="e.g. 350"
                              value={lossInput}
                              onChange={(e) => setLossInput(e.target.value)}
                              className="bg-slate-900 text-white border border-slate-800 px-2 py-1.5 text-xs rounded-lg w-full"
                            />
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { deductLossAmount: lossInput })}
                              className="bg-rose-500 text-white font-bold px-2 rounded-lg text-xs hover:bg-rose-400"
                            >
                              Debit
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-900 space-y-3">
                        <label className="text-[10px] uppercase text-slate-500 font-mono block">Direct Access Privileges</label>
                        <div className="flex gap-2">
                          {selectedUser.status === "active" ? (
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { status: "suspended" })}
                              className="flex-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserX size={14} /> Suspend Investor
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { status: "active" })}
                              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserCheck size={14} /> Reactivate Profile
                            </button>
                          )}

                          {!selectedUser.verified ? (
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { verified: true })}
                              className="flex-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Verify Account KYC
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserUpdate(selectedUser.id, { verified: false })}
                              className="flex-1 bg-slate-800 hover:bg-slate-705 text-slate-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Revoke KYC Status
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historic Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activity log */}
                    <div className="bg-slate-950 p-4 rounded-3xl border border-slate-850">
                      <span className="text-xs uppercase font-extrabold text-slate-400 font-mono block border-b border-slate-850 pb-2">Investor Security Audit History</span>
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-900 mt-2 font-mono text-[10px]">
                        {selectedUser.activityHistory.length === 0 ? (
                          <div className="p-4 text-center text-slate-600">No activity logged.</div>
                        ) : (
                          selectedUser.activityHistory.map((act, idx) => (
                            <div key={idx} className="py-2 flex justify-between gap-1.5 text-slate-300">
                              <span>{act.action}</span>
                              <span className="text-[9px] text-slate-500 block shrink-0">{new Date(act.time).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Profit payouts history */}
                    <div className="bg-slate-950 p-4 rounded-3xl border border-slate-850">
                      <span className="text-xs uppercase font-extrabold text-slate-400 font-mono block border-b border-slate-850 pb-2">Accrued Profit & Adjustment History</span>
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-900 mt-2 font-mono text-[10px]">
                        {selectedUser.profitHistory.length === 0 ? (
                          <div className="p-4 text-center text-slate-600">No payouts accrued yet.</div>
                        ) : (
                          selectedUser.profitHistory.map((pr, idx) => (
                            <div key={idx} className="py-2 flex justify-between gap-2">
                              <div>
                                <span className={pr.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                  {pr.amount >= 0 ? "+" : ""}${pr.amount.toFixed(2)} USD
                                </span>
                                <span className="text-slate-400 text-[9px] block italic">{pr.description}</span>
                              </div>
                              <span className="text-slate-500 shrink-0 text-[9px]">{pr.date}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ======================= TAB 3: DEPOSITS ======================= */}
          {activeSubTab === "deposits" && (
            <div className="space-y-6 animate-slide-up">
              <span className="text-xs uppercase font-extrabold font-mono text-slate-400 block border-b border-slate-850 pb-2">Pending Global Investor Receipts & Wallet Updates</span>
              
              <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950 font-sans text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-semibold font-mono text-[10px] tracking-wider">
                      <th className="p-4">TRANSACTION ID</th>
                      <th className="p-4">INVESTOR EMAIL</th>
                      <th className="p-4">METHOD</th>
                      <th className="p-4 text-right">MAGNITUDE</th>
                      <th className="p-4 text-center">DEPOSIT PROOF REFERENCE</th>
                      <th className="p-4 text-center font-mono">STATUS</th>
                      <th className="p-4 text-center">DECISION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-500 font-mono">No deposits registered in database history.</td>
                      </tr>
                    ) : (
                      deposits.map(d => (
                        <tr key={d.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition">
                          <td className="p-4 font-mono font-bold text-white uppercase">{d.id}</td>
                          <td className="p-4">
                            <span className="text-slate-300 font-medium block">{d.userName}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{d.userEmail}</span>
                          </td>
                          <td className="p-4 uppercase font-mono text-slate-400">
                            {d.method === "bank" ? "🏦 Bank Transfer" : d.method.startsWith("crypto_") ? `🪙 ${d.method.replace("crypto_", "").toUpperCase()}` : "🪙 Crypto Assets"}
                          </td>
                          <td className="p-4 text-right font-mono text-emerald-400 font-bold text-sm">
                            ${d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} {d.currency}
                          </td>
                          <td className="p-4 text-center font-mono text-[10px]">
                            {d.method === "bank" ? (
                              <button
                                onClick={() => setViewingDepSlip(d)}
                                className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-755 hover:bg-slate-700 cursor-pointer"
                              >
                                View Receipt Slip
                              </button>
                            ) : (
                              <div className="text-slate-400 text-[10px] max-w-xs truncate overflow-x-auto inline-block p-1 bg-slate-900 rounded select-all" title={d.txHash}>
                                TX: {d.txHash?.substring(0, 16)}...
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {d.status === "pending" && <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Pending Audit</span>}
                            {d.status === "approved" && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Settled</span>}
                            {d.status === "rejected" && <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Rejected</span>}
                          </td>
                          <td className="p-4 text-center">
                            {d.status === "pending" ? (
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => handleDepositDecision(d.id, true)}
                                  className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-emerald-400"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDepositDecision(d.id, false)}
                                  className="bg-rose-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-rose-400"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 block italic leading-snug">{d.adminComments || "Manual entry settled"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Comments box for deposit actions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 max-w-lg">
                <label className="text-xs font-mono text-slate-400 uppercase">Comments/Reason (For Approve/Reject Actions above)</label>
                <input 
                  type="text"
                  placeholder="e.g. Cleared via instant Lloyds sweep transaction..."
                  value={depositComment}
                  onChange={(e) => setDepositComment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Bank receipt modal popover */}
              {viewingDepSlip && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative">
                    <button
                      onClick={() => setViewingDepSlip(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                    <h3 className="text-sm font-bold font-mono text-white mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-amber-500" /> FILE SYSTEM BANK RECEIPT VERIFIER
                    </h3>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-center py-6">
                      <img 
                        src={viewingDepSlip.paymentProofUrl} 
                        alt="Bank receipt slip verification"
                        className="max-h-64 object-contain border border-slate-800 rounded shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-4 space-y-2 font-mono text-[11px] bg-slate-950 p-3 rounded-lg text-slate-310">
                      <div><span className="text-slate-500">Sender Entity:</span> {viewingDepSlip.userName}</div>
                      <div><span className="text-slate-500">Bank Institution:</span> {viewingDepSlip.bankName}</div>
                      <div><span className="text-slate-500">Subscribed Ref:</span> {viewingDepSlip.bankAccountRef}</div>
                      <div><span className="text-slate-500">Funds Locked:</span> ${viewingDepSlip.amount.toLocaleString()} USD</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleDepositDecision(viewingDepSlip.id, true)}
                        className="flex-1 bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs"
                      >
                        Approve Deposit
                      </button>
                      <button
                        onClick={() => handleDepositDecision(viewingDepSlip.id, false)}
                        className="flex-1 bg-rose-500 text-white font-bold py-2 rounded-xl text-xs"
                      >
                        Reject Receipt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ======================= TAB 4: WITHDRAWALS ======================= */}
          {activeSubTab === "withdrawals" && (
            <div className="space-y-6 animate-slide-up">
              <span className="text-xs uppercase font-extrabold font-mono text-slate-400 block border-b border-slate-850 pb-2">Pending Escrows & Capital Outlets Processing</span>

              <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950 font-sans text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-semibold font-mono text-[10px] tracking-wider">
                      <th className="p-4">PAYOUT ID</th>
                      <th className="p-4">SENDER INVESTOR</th>
                      <th className="p-4">METHOD / TARGET PATHWAY</th>
                      <th className="p-4 text-right">WITHDRAWAL MASS</th>
                      <th className="p-4 text-center font-mono">STATUS</th>
                      <th className="p-4 text-center">ACTION WORKFLOWS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500 font-mono">No processing logs filed.</td>
                      </tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition">
                          <td className="p-4 font-mono font-bold text-white uppercase">{w.id}</td>
                          <td className="p-4">
                            <span className="text-slate-300 font-medium block">{w.userName}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{w.userEmail}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {w.method === "bank" ? (
                              <div className="space-y-0.5 leading-tight">
                                <span className="text-slate-200 block">🏦 Bank: {w.bankName}</span>
                                <span className="text-[10px] text-slate-500 block">Acct: {w.accountName} • #{w.accountNumber}</span>
                              </div>
                            ) : (
                              <div className="space-y-0.5 leading-tight text-[10px]">
                                <span className="text-slate-200 block">🪙 Crypto: {w.currency} ({w.network})</span>
                                <span className="text-[9px] text-slate-500 block">Addr: {w.walletAddress}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono text-rose-400 font-bold text-sm">
                            -${w.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} USD
                          </td>
                          <td className="p-4 text-center">
                            {w.status === "pending" && <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Escrowed</span>}
                            {w.status === "processing" && <span className="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Clearing Processing</span>}
                            {w.status === "approved" && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Cleared / Dispatched</span>}
                            {w.status === "rejected" && <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">Cancelled & Refunded</span>}
                          </td>
                          <td className="p-4 text-center">
                            {w.status === "pending" || w.status === "processing" ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleWithdrawalStatus(w.id, "processing")}
                                  className="bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-blue-400 cursor-pointer"
                                  title="Mark as Clearing House Processing"
                                >
                                  Process
                                </button>
                                <button
                                  onClick={() => handleWithdrawalStatus(w.id, "approved")}
                                  className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-emerald-400 cursor-pointer"
                                  title="Settle & Dispatch Funds"
                                >
                                  Settle
                                </button>
                                <button
                                  onClick={() => handleWithdrawalStatus(w.id, "rejected")}
                                  className="bg-rose-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-rose-400 cursor-pointer"
                                  title="Cancel and Refund UserEscrow Balance"
                                >
                                  Refund
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 block italic leading-snug">{w.adminNotes || "Corporate ledger closed"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Comments box for withdrawal actions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 max-w-lg">
                <label className="text-xs font-mono text-slate-400 uppercase">Comments/Verification Notes (For Payout Controls)</label>
                <input 
                  type="text"
                  placeholder="e.g. Cleared transaction dispatch ID ChaseTx-110292M..."
                  value={withdrawalComment}
                  onChange={(e) => setWithdrawalComment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}


          {/* ======================= TAB 5: CUSTOMER CARE TICKETS ======================= */}
          {activeSubTab === "support" && (
            <div className="space-y-6 animate-slide-up">
              <span className="text-xs uppercase font-extrabold font-mono text-slate-400 block border-b border-slate-850 pb-2">Institutional Support Channels & Dialogue Command</span>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tickets list */}
                <div className="lg:col-span-1 bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-3">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block mb-2">Platform Open Tickets</span>
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {tickets.length === 0 ? (
                      <div className="p-6 text-center text-slate-600 text-xs font-mono">No tickets currently filed.</div>
                    ) : (
                      tickets.map(tkt => (
                        <div
                          key={tkt.id}
                          onClick={() => setActiveTicket(tkt)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                            activeTicket?.id === tkt.id
                              ? "bg-amber-500/10 border-amber-500/30 text-white"
                              : "bg-slate-900/60 border-slate-800 hover:bg-slate-905"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold font-sans truncate max-w-[150px]">{tkt.subject}</span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase ${tkt.status==='open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                              {tkt.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-1.5">{tkt.userName}</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 flex justify-between">
                            <span>{new Date(tkt.timestamp).toLocaleDateString()}</span>
                            {tkt.unreadByAdmin && <span className="bg-amber-500 text-slate-950 font-extrabold px-1 rounded text-[7px] animate-pulse">UNREAD MESSAGE</span>}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Dialog command thread */}
                <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between min-h-[420px]">
                  {activeTicket ? (
                    <div className="flex flex-col h-full justify-between space-y-4">
                      
                      {/* Ticket header details */}
                      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                        <div>
                          <h4 className="text-xs font-mono font-bold text-white uppercase">TKT CODE: {activeTicket.id}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                            Investor: <span className="font-semibold text-slate-200">{activeTicket.userName}</span> ({activeTicket.userEmail})
                          </p>
                        </div>
                        <span className="text-xs text-amber-500 font-bold font-mono">Subject: {activeTicket.subject}</span>
                      </div>

                      {/* Messages body */}
                      <div className="flex-1 overflow-y-auto max-h-64 pr-1 space-y-3 text-xs leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-800">
                        {activeTicket.messages.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className={`p-3 rounded-2xl max-w-sm flex flex-col ${
                              m.sender === "admin"
                                ? "bg-amber-500/10 border border-amber-500/15 text-white ml-auto rounded-tr-none"
                                : "bg-slate-900 border border-slate-850 text-slate-200 mr-auto rounded-tl-none"
                            }`}
                          >
                            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                              {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p>{m.message}</p>
                          </div>
                        ))}
                      </div>

                      {/* Administrative reply input */}
                      <div className="pt-4 border-t border-slate-850 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Respond to client's query instantly..."
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSupportReply(activeTicket.id); }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-xl px-4.5 py-3 text-xs focus:outline-none focus:border-amber-500 text-slate-100 placeholder-slate-600"
                        />
                        <button
                          onClick={() => handleSupportReply(activeTicket.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 rounded-xl flex items-center justify-center cursor-pointer"
                        >
                          <Send size={15} />
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-3">
                      <MessageSquare className="text-slate-700 w-12 h-12" />
                      <span className="text-xs font-mono text-slate-500">Select an active support channel from the left sidebar to communicate directly with investors.</span>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}


          {/* ======================= TAB 6: FAQ NODE MANAGER ======================= */}
          {activeSubTab === "faqs" && (
            <div className="space-y-6 animate-slide-up">
              <span className="text-xs uppercase font-extrabold font-mono text-slate-400 block border-b border-slate-850 pb-2">Platform FAQ Config Panel & Static Documents</span>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to add new FAQ */}
                <div className="lg:col-span-1 bg-slate-950 rounded-2xl border border-slate-850 p-5 space-y-4 max-h-[380px]">
                  <span className="text-xs uppercase font-extrabold text-white block border-b border-slate-850 pb-2 font-mono">Create Static FAQ Document</span>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Question Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Can I configure corporate API?"
                        value={newFaqQ}
                        onChange={(e) => setNewFaqQ(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Answer Body</label>
                      <textarea 
                        rows={3}
                        placeholder="Explain detail..."
                        value={newFaqA}
                        onChange={(e) => setNewFaqA(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-mono block mb-1">FAQ Category Index</label>
                      <select
                        value={newFaqCat}
                        onChange={(e) => setNewFaqCat(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white"
                      >
                        <option value="general">general</option>
                        <option value="deposits">deposits</option>
                        <option value="crypto">crypto</option>
                        <option value="security">security</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddFaq}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                  >
                    <Plus size={14} /> Commit FAQ Node
                  </button>
                </div>

                {/* FAQ Entries List */}
                <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-850 p-5 space-y-4 max-h-[500px] overflow-y-auto">
                  <span className="text-xs uppercase font-extrabold text-white block border-b border-slate-850 pb-2 font-mono">Current Live FAQ Documents</span>
                  
                  <div className="space-y-3.5">
                    {faqs.length === 0 ? (
                      <div className="text-center p-10 text-slate-650 text-xs font-mono">No FAQ documents on record. Create one to standard user profiles.</div>
                    ) : (
                      faqs.map(faq => (
                        <div key={faq.id} className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl relative hover:border-slate-800 transition">
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete FAQ Document node"
                          >
                            <Trash size={14} />
                          </button>
                          <div className="flex gap-2 items-center">
                            <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase mb-1 inline-block">{faq.category}</span>
                            <span className="text-[10px] font-mono text-slate-500">ID: {faq.id}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white pr-6 mt-1">{faq.question}</h4>
                          <p className="text-[11px] text-slate-400 mt-2 whitespace-pre-line leading-relaxed italic">{faq.answer}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}


          {/* ======================= TAB 7: CONFIGURE GATEWAYS ======================= */}
          {activeSubTab === "gateways" && (
            <div className="space-y-6 animate-slide-up">
              <span className="text-xs uppercase font-extrabold font-mono text-slate-400 block border-b border-slate-850 pb-2">Institutional Payment Gateways & Settlement Routing Coordinates</span>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                
                {/* Section A: Bank Transfer Settlement Coordinates */}
                <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                    <CreditCard className="text-amber-500 w-4 h-4" />
                    <span className="text-xs uppercase font-extrabold text-white font-mono">Bank Clearance Gateway Configuration</span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    Configure the platform wire routing and banking coordinates shown to investors during funding inquiries.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">Clearinghouse Institution Name</label>
                      <input 
                        type="text" 
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        placeholder="Alliance Brokerage & Trust"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">ACH Routing Number</label>
                      <input 
                        type="text" 
                        value={editRoutingNumber}
                        onChange={(e) => setEditRoutingNumber(e.target.value)}
                        placeholder="021000021"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">Vault Account Number</label>
                      <input 
                        type="text" 
                        value={editAccountNumber}
                        onChange={(e) => setEditAccountNumber(e.target.value)}
                        placeholder="1029-4581-9238"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Cryptocurrency Destination Wallets */}
                <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                    <Wallet className="text-amber-500 w-4 h-4" />
                    <span className="text-xs uppercase font-extrabold text-white font-mono">Cryptocurrency Wallet Receivers</span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    Input your active administrative hot-cold wallet storage addresses for user blockchain settlement.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">USDT (ERC-20/TRC-20 Network Coordinate)</label>
                      <input 
                        type="text" 
                        value={editUsdtAddress}
                        onChange={(e) => setEditUsdtAddress(e.target.value)}
                        placeholder="0x8920...3AB78E993"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">Bitcoin (BTC Native Chain Coordinate)</label>
                      <input 
                        type="text" 
                        value={editBtcAddress}
                        onChange={(e) => setEditBtcAddress(e.target.value)}
                        placeholder="bc1q98...bc1q"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">Ethereum (ETH Network Coordinate)</label>
                      <input 
                        type="text" 
                        value={editEthAddress}
                        onChange={(e) => setEditEthAddress(e.target.value)}
                        placeholder="0x7129...00ABeC7816"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-slate-550 block mb-1">Solana (SOL Native Coordinate)</label>
                      <input 
                        type="text" 
                        value={editSolAddress}
                        onChange={(e) => setEditSolAddress(e.target.value)}
                        placeholder="9823aB...940eZ"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  Make sure routing configurations are error-checked. Users pay directly to these points.
                </span>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/admin/payment-coordinates/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bankName: editBankName,
                          routingNumber: editRoutingNumber,
                          accountNumber: editAccountNumber,
                          cryptoAddresses: {
                            USDT: { address: editUsdtAddress },
                            BTC: { address: editBtcAddress },
                            ETH: { address: editEthAddress },
                            SOL: { address: editSolAddress }
                          }
                        })
                      });
                      if (response.ok) {
                        const result = await response.json();
                        setGatewayConfig(result.paymentCoordinates);
                        triggerGlobalToast("✓ Dynamic deposit settlement coordinates validated & updated.");
                        fetchAllTelemetry();
                      } else {
                        triggerGlobalToast("Failed to save coordinate configuration.");
                      }
                    } catch (e) {
                      triggerGlobalToast("Network failure updating routing coordinates.");
                    }
                  }}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Send size={14} /> Update Settle Gateway Routing Coordinates
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
