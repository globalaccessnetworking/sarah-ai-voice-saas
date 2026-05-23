// ============================================================
// SUTHRA PUNJAB AI VOICE CENTER — COMPLETE MOCK DATA
// ============================================================

export type CallStatus = 'Resolved' | 'Escalated' | 'In Progress';
export type CallChannel = 'Phone' | 'WhatsApp';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Sentiment = 'Happy' | 'Neutral' | 'Frustrated' | 'Angry';
export type AgentStatus = 'On Call' | 'Available' | 'Break';
export type AgentShift = 'Morning' | 'Evening' | 'Night';

export interface CallLog {
  id: string;
  callId: string;
  timestamp: string;
  caller: string;
  category: string;
  area: string;
  district: string;
  language: string;
  channel: CallChannel;
  priority: Priority;
  status: CallStatus;
  duration: string; // "1:42"
  durationRaw: number; // seconds
  sentiment: Sentiment;
  sentimentScore: number; // -1 to 1
  aiModel: string;
  confidence: number;
  costSaved: number;
  repeatCaller: boolean;
  priorComplaints: number;
  refNumber: string;
  intentScore: number;
  entities: number;
  latency: number; // ms
  classificationPath: string;
  escalationReason?: string;
  escalationAssignedTo?: string;
  whatsappImage?: {
    detection: string;
    confidence: number;
    severity: 'Low' | 'Medium' | 'High';
    autoCategory: string;
    detectedObjects: string[];
    geoTag: string;
  };
  transcript: TranscriptMessage[];
}

export interface TranscriptMessage {
  id: string;
  role: 'citizen' | 'ai' | 'system' | 'human';
  agentName?: string;
  text: string;
  time: string;
}

export interface Agent {
  id: string;
  initials: string;
  name: string;
  specialization: string;
  status: AgentStatus;
  shift: AgentShift;
  callsToday: number;
  satisfaction: number;
  resolution: number;
  escalations: number;
  avgHandle: string;
  avatarColor: string;
  assignedCalls: string[]; // call IDs
  weeklyData: number[]; // D1-D7 call counts
  topCategories: { name: string; calls: number }[];
}

export interface District {
  id: string;
  name: string;
  calls: number;
  aiHandled: number;
  whatsapp: number;
  rating: number;
  escalationRate: number;
  areas: DistrictArea[];
  weeklyTrend: number[];
  topCategory: string;
  repeatRate: number;
  assignedAgents: number;
}

export interface DistrictArea {
  name: string;
  calls: number;
  ai: number;
  wa: number;
  images: number;
  rating: number;
  escRate: number;
  recentCalls?: string[];
}

export interface Category {
  id: string;
  name: string;
  callsPerDay: number;
  confidence: number;
  avgDuration: number;
  resolutionRate: number;
  escalationRate: number;
  subCategories: { name: string; percent: number }[];
  dialectData: { dialect: string; confidence: number; correction: number }[];
}

export interface EscalationItem {
  callId: string;
  time: string;
  caller: string;
  category: string;
  reason: string;
  urgency: Priority;
  assignedTo: string;
  duration: string;
  area: string;
  refNumber: string;
  confidenceAtEscalation: number;
  callerSentiment: Sentiment;
  conversationTurns: number;
  callerRequestedHuman: boolean;
  repeatCaller: boolean;
  priorCalls: number;
  aiNote: string;
  handoffNote: string;
}

// ========================
// TRANSCRIPT TEMPLATES
// ========================

const transcriptPhone = (name: string, category: string, area: string, ref: string, agent: string): TranscriptMessage[] => [
  { id: 't1', role: 'citizen', text: `Assalam o alaikum, yahan pe ${category.toLowerCase()} ka masla hai.`, time: '10:01' },
  { id: 't2', role: 'ai', text: `Walaikum Assalam. Main Suthra Punjab AI assistant hoon. Pehle aapka naam bata dein?`, time: '10:01' },
  { id: 't3', role: 'citizen', text: `Ji, mera naam ${name} hai`, time: '10:02' },
  { id: 't4', role: 'ai', text: `Shukriya ${name} sahab. Aap konse area se bol rahe hain?`, time: '10:02' },
  { id: 't5', role: 'citizen', text: `${area}`, time: '10:02' },
  { id: 't6', role: 'ai', text: `Samajh gaya. ${category} — ${area}. ${name} sahab, aapki complaint register ho gayi hai. Complaint code: ${ref}. Yeh code save kar lein — isse aap apni complaint track kar sakte hain. 24 se 48 ghante mein masla resolve hoga. SMS confirmation bhi bheja ja raha hai.`, time: '10:03' },
  { id: 't7', role: 'citizen', text: 'OK note kar liya', time: '10:04' },
  { id: 't8', role: 'ai', text: `Shukriya ${name} sahab. Complaint ${ref} ko Suthra Punjab app se bhi track kar sakte hain. Allah Hafiz.`, time: '10:04' },
];

const transcriptEscalated = (name: string, category: string, area: string, ref: string, agent: string): TranscriptMessage[] => [
  { id: 't1', role: 'citizen', text: `Pehle bhi bheja tha lekin kuch nahi hua`, time: '10:01' },
  { id: 't2', role: 'ai', text: `${name} sahab, aapki complaint register ho gayi hai. Complaint code: ${ref}. Yeh code save kar lein.`, time: '10:02' },
  { id: 't3', role: 'citizen', text: 'OK note kar liya', time: '10:03' },
  { id: 't4', role: 'ai', text: `Shukriya ${name} sahab. Complaint ${ref} ko Suthra Punjab app se bhi track kar sakte hain. Allah Hafiz.`, time: '10:03' },
  { id: 't5', role: 'ai', text: `${name} sahab, aapki request ko behtar handle karne ke liye main aapki call senior agent ko transfer kar raha hoon. Wajah: Caller requested human. Aapka complaint code ${ref} unke paas bhi hoga.`, time: '10:04' },
  { id: 't6', role: 'citizen', text: 'Theek hai, jaldi karein', time: '10:05' },
  { id: 't7', role: 'system', text: `[Call transferred to ${agent}]`, time: '10:06' },
  { id: 't8', role: 'human', agentName: agent, text: `Assalam o alaikum ${name} sahab, main ${agent} hoon. Aapki complaint ${ref} mere paas aa gayi hai. Main aapki madad karta hoon.`, time: '10:07' },
];

// ========================
// CALLS DATA (50 entries)
// ========================

export const calls: CallLog[] = [
  {
    id: '1', callId: 'CALL-3000', timestamp: '17:13', caller: 'Rabia Aslam', category: 'Street Sweeping',
    area: 'Wahdat Road', district: 'Khushab', language: 'Punjabi', channel: 'WhatsApp', priority: 'P3',
    status: 'Escalated', duration: '2:02', durationRaw: 122, sentiment: 'Frustrated', sentimentScore: -0.60,
    aiModel: 'SP-Vision-v1.4', confidence: 95.9, costSaved: 111, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-KHU-91950', intentScore: 80, entities: 3, latency: 227,
    classificationPath: 'Street Sweeping → P3 — Medium → Escalated',
    escalationReason: 'Caller requested human', escalationAssignedTo: 'Nazia Butt',
    whatsappImage: { detection: 'Street garbage photo', confidence: 92.4, severity: 'Medium', autoCategory: 'Street Sweeping', detectedObjects: ['street waste', 'organic debris', 'scattered'], geoTag: 'Khushab, Wahdat Road — 31.5000°N, 74.4000°E' },
    transcript: transcriptEscalated('Rabia Aslam', 'Street Sweeping', 'Wahdat Road', 'SP-KHU-91950', 'Nazia Butt'),
  },
  {
    id: '2', callId: 'CALL-2999', timestamp: '14:47', caller: 'Waqar Younis', category: 'Street Sweeping',
    area: 'Johar Town Block D', district: 'Lahore', language: 'English', channel: 'Phone', priority: 'P4',
    status: 'Resolved', duration: '1:42', durationRaw: 102, sentiment: 'Neutral', sentimentScore: 0.10,
    aiModel: 'SP-Voice-v3.2', confidence: 88.5, costSaved: 198, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-23441', intentScore: 90, entities: 3, latency: 145,
    classificationPath: 'Street Sweeping → P4 — Low → Scheduled',
    transcript: transcriptPhone('Waqar Younis', 'Street Sweeping', 'Johar Town Block D', 'SP-LAH-23441', ''),
  },
  {
    id: '3', callId: 'CALL-2998', timestamp: '20:08', caller: 'Tahir Mahmood', category: 'Street Sweeping',
    area: 'Harbanspura', district: 'Lahore', language: 'Punjabi', channel: 'Phone', priority: 'P4',
    status: 'Resolved', duration: '1:30', durationRaw: 90, sentiment: 'Neutral', sentimentScore: 0.20,
    aiModel: 'SP-Voice-v3.2', confidence: 91.2, costSaved: 165, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-55210', intentScore: 85, entities: 2, latency: 132,
    classificationPath: 'Street Sweeping → P4 — Low → Scheduled',
    transcript: transcriptPhone('Tahir Mahmood', 'Street Sweeping', 'Harbanspura', 'SP-LAH-55210', ''),
  },
  {
    id: '4', callId: 'CALL-2997', timestamp: '21:16', caller: 'Ayesha Malik', category: 'Missed Collection',
    area: 'Lake City', district: 'Lahore', language: 'English', channel: 'Phone', priority: 'P4',
    status: 'Resolved', duration: '2:35', durationRaw: 155, sentiment: 'Happy', sentimentScore: 0.40,
    aiModel: 'SP-Voice-v3.2', confidence: 94.1, costSaved: 220, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-09182', intentScore: 95, entities: 3, latency: 118,
    classificationPath: 'Missed Collection → P4 — Low → Scheduled',
    transcript: transcriptPhone('Ayesha Malik', 'Missed Collection', 'Lake City', 'SP-LAH-09182', ''),
  },
  {
    id: '5', callId: 'CALL-2996', timestamp: '16:45', caller: 'Asad Iqbal', category: 'Water Logging',
    area: 'Wapda Town', district: 'Khushab', language: 'Punjabi', channel: 'WhatsApp', priority: 'P3',
    status: 'Resolved', duration: '0:56', durationRaw: 56, sentiment: 'Neutral', sentimentScore: 0.10,
    aiModel: 'SP-Vision-v1.4', confidence: 82.0, costSaved: 88, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-KHU-84200', intentScore: 80, entities: 3, latency: 173,
    classificationPath: 'Water Logging → P3 — Medium → Scheduled',
    whatsappImage: { detection: 'Waterlogged road', confidence: 88.5, severity: 'Medium', autoCategory: 'Water Logging', detectedObjects: ['standing water', 'blocked drain', 'road'], geoTag: 'Khushab, Wapda Town — 32.2900°N, 72.3500°E' },
    transcript: transcriptPhone('Asad Iqbal', 'Water Logging', 'Wapda Town', 'SP-KHU-84200', ''),
  },
  {
    id: '6', callId: 'CALL-2995', timestamp: '20:28', caller: 'Waqar Younis', category: 'Dead Animal',
    area: 'DHA Phase 5', district: 'Lahore', language: 'Punjabi', channel: 'WhatsApp', priority: 'P4',
    status: 'Resolved', duration: '1:27', durationRaw: 87, sentiment: 'Neutral', sentimentScore: 0.05,
    aiModel: 'SP-Vision-v1.4', confidence: 90.0, costSaved: 142, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-77840', intentScore: 88, entities: 2, latency: 165,
    classificationPath: 'Dead Animal → P4 — Low → Scheduled',
    whatsappImage: { detection: 'Dead animal photo', confidence: 96.0, severity: 'High', autoCategory: 'Dead Animal', detectedObjects: ['garbage pile', 'bin overflow', 'plastic bags'], geoTag: 'Lahore, DHA Phase 5 — 31.4700°N, 74.4020°E' },
    transcript: transcriptPhone('Waqar Younis', 'Dead Animal', 'DHA Phase 5', 'SP-LAH-77840', ''),
  },
  {
    id: '7', callId: 'CALL-2994', timestamp: '22:13', caller: 'Tahir Mahmood', category: 'Water Logging',
    area: 'Mughalpura', district: 'Lahore', language: 'Punjabi', channel: 'Phone', priority: 'P3',
    status: 'Escalated', duration: '1:17', durationRaw: 77, sentiment: 'Frustrated', sentimentScore: -0.55,
    aiModel: 'SP-Voice-v3.2', confidence: 78.5, costSaved: 95, repeatCaller: true, priorComplaints: 2,
    refNumber: 'SP-LAH-33211', intentScore: 75, entities: 2, latency: 198,
    classificationPath: 'Water Logging → P3 — Medium → Escalated',
    escalationReason: 'Repeat complaint >3x', escalationAssignedTo: 'Kamran Javed',
    transcript: transcriptEscalated('Tahir Mahmood', 'Water Logging', 'Mughalpura', 'SP-LAH-33211', 'Kamran Javed'),
  },
  {
    id: '8', callId: 'CALL-2993', timestamp: '10:02', caller: 'Farooq Ahmad', category: 'Overflowing Bin',
    area: 'Garhi Shahu', district: 'Lahore', language: 'English', channel: 'Phone', priority: 'P4',
    status: 'Resolved', duration: '2:50', durationRaw: 170, sentiment: 'Neutral', sentimentScore: 0.15,
    aiModel: 'SP-Voice-v3.2', confidence: 92.8, costSaved: 188, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-66540', intentScore: 92, entities: 3, latency: 141,
    classificationPath: 'Overflowing Bin → P4 — Low → Scheduled',
    transcript: transcriptPhone('Farooq Ahmad', 'Overflowing Bin', 'Garhi Shahu', 'SP-LAH-66540', ''),
  },
  {
    id: '9', callId: 'CALL-2992', timestamp: '20:40', caller: 'Mehreen Zahra', category: 'Noise Complaint',
    area: 'Shadman', district: 'Lahore', language: 'Punjabi', channel: 'Phone', priority: 'P2',
    status: 'Resolved', duration: '1:20', durationRaw: 80, sentiment: 'Neutral', sentimentScore: 0.30,
    aiModel: 'SP-Voice-v3.2', confidence: 89.5, costSaved: 155, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-12098', intentScore: 87, entities: 2, latency: 158,
    classificationPath: 'Noise Complaint → P2 — High → Scheduled',
    transcript: transcriptPhone('Mehreen Zahra', 'Noise Complaint', 'Shadman', 'SP-LAH-12098', ''),
  },
  {
    id: '10', callId: 'CALL-2991', timestamp: '11:07', caller: 'Bilal Hussain', category: 'Construction Debris',
    area: 'Harbanspura', district: 'Lahore', language: 'Punjabi', channel: 'Phone', priority: 'P4',
    status: 'Resolved', duration: '3:00', durationRaw: 180, sentiment: 'Happy', sentimentScore: 0.50,
    aiModel: 'SP-Voice-v3.2', confidence: 93.1, costSaved: 210, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-99080', intentScore: 93, entities: 3, latency: 128,
    classificationPath: 'Construction Debris → P4 — Low → Scheduled',
    transcript: transcriptPhone('Bilal Hussain', 'Construction Debris', 'Harbanspura', 'SP-LAH-99080', ''),
  },
  {
    id: '11', callId: 'CALL-2990', timestamp: '09:15', caller: 'Nadia Perveen', category: 'Missed Collection',
    area: 'Cavalry Ground', district: 'Lahore', language: 'Urdu', channel: 'Phone', priority: 'P2',
    status: 'Escalated', duration: '1:55', durationRaw: 115, sentiment: 'Angry', sentimentScore: -0.80,
    aiModel: 'SP-Voice-v3.2', confidence: 72.5, costSaved: 165, repeatCaller: true, priorComplaints: 3,
    refNumber: 'SP-LAH-45078', intentScore: 70, entities: 2, latency: 210,
    classificationPath: 'Missed Collection → P2 — High → Escalated',
    escalationReason: 'Threatening tone', escalationAssignedTo: 'Amir Hassan',
    transcript: transcriptEscalated('Nadia Perveen', 'Missed Collection', 'Cavalry Ground', 'SP-LAH-45078', 'Amir Hassan'),
  },
  {
    id: '12', callId: 'CALL-2989', timestamp: '13:30', caller: 'Hina Rizwan', category: 'Street Sweeping',
    area: 'Allama Iqbal Town', district: 'Lahore', language: 'Punjabi', channel: 'WhatsApp', priority: 'P3',
    status: 'Resolved', duration: '1:10', durationRaw: 70, sentiment: 'Neutral', sentimentScore: 0.00,
    aiModel: 'SP-Vision-v1.4', confidence: 86.2, costSaved: 118, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-88310', intentScore: 84, entities: 2, latency: 155,
    classificationPath: 'Street Sweeping → P3 — Medium → Scheduled',
    whatsappImage: { detection: 'Dirty street photo', confidence: 88.0, severity: 'Low', autoCategory: 'Street Sweeping', detectedObjects: ['dust', 'leaves', 'litter'], geoTag: 'Lahore, Allama Iqbal Town — 31.4900°N, 74.3200°E' },
    transcript: transcriptPhone('Hina Rizwan', 'Street Sweeping', 'Allama Iqbal Town', 'SP-LAH-88310', ''),
  },
  {
    id: '13', callId: 'CALL-2988', timestamp: '16:22', caller: 'Kashif Mehmood', category: 'Noise Complaint',
    area: 'Garden Town', district: 'Lahore', language: 'English', channel: 'Phone', priority: 'P2',
    status: 'Resolved', duration: '1:07', durationRaw: 67, sentiment: 'Happy', sentimentScore: 0.45,
    aiModel: 'SP-Voice-v3.2', confidence: 91.8, costSaved: 135, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-21445', intentScore: 91, entities: 2, latency: 138,
    classificationPath: 'Noise Complaint → P2 — High → Scheduled',
    transcript: transcriptPhone('Kashif Mehmood', 'Noise Complaint', 'Garden Town', 'SP-LAH-21445', ''),
  },
  {
    id: '14', callId: 'CALL-2987', timestamp: '17:53', caller: 'Ahmed Khan', category: 'Missed Collection',
    area: 'Anarkali', district: 'Lahore', language: 'Urdu', channel: 'Phone', priority: 'P2',
    status: 'Resolved', duration: '2:21', durationRaw: 141, sentiment: 'Neutral', sentimentScore: 0.10,
    aiModel: 'SP-Voice-v3.2', confidence: 88.0, costSaved: 176, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-38920', intentScore: 86, entities: 3, latency: 162,
    classificationPath: 'Missed Collection → P2 — High → Scheduled',
    transcript: transcriptPhone('Ahmed Khan', 'Missed Collection', 'Anarkali', 'SP-LAH-38920', ''),
  },
  {
    id: '15', callId: 'CALL-2986', timestamp: '08:40', caller: 'Samina Begum', category: 'Overflowing Bin',
    area: 'Ichra', district: 'Lahore', language: 'Urdu', channel: 'WhatsApp', priority: 'P4',
    status: 'Resolved', duration: '2:09', durationRaw: 129, sentiment: 'Neutral', sentimentScore: 0.20,
    aiModel: 'SP-Vision-v1.4', confidence: 87.3, costSaved: 148, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-77112', intentScore: 85, entities: 2, latency: 145,
    classificationPath: 'Overflowing Bin → P4 — Low → Scheduled',
    whatsappImage: { detection: 'Bin overflow photo', confidence: 94.5, severity: 'Medium', autoCategory: 'Overflowing Bin', detectedObjects: ['overflowing bin', 'garbage bags', 'waste spread'], geoTag: 'Lahore, Ichra — 31.5100°N, 74.2900°E' },
    transcript: transcriptPhone('Samina Begum', 'Overflowing Bin', 'Ichra', 'SP-LAH-77112', ''),
  },
  {
    id: '16', callId: 'CALL-2985', timestamp: '15:03', caller: 'Ayesha Malik', category: 'Construction Debris',
    area: 'Cantt', district: 'Lahore', language: 'Urdu', channel: 'WhatsApp', priority: 'P4',
    status: 'Resolved', duration: '1:25', durationRaw: 85, sentiment: 'Neutral', sentimentScore: 0.10,
    aiModel: 'SP-Vision-v1.4', confidence: 85.7, costSaved: 128, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-55630', intentScore: 83, entities: 2, latency: 152,
    classificationPath: 'Construction Debris → P4 — Low → Scheduled',
    whatsappImage: { detection: 'Construction waste photo', confidence: 91.2, severity: 'Low', autoCategory: 'Construction Debris', detectedObjects: ['rubble', 'bricks', 'construction waste'], geoTag: 'Lahore, Cantt — 31.5200°N, 74.3400°E' },
    transcript: transcriptPhone('Ayesha Malik', 'Construction Debris', 'Cantt', 'SP-LAH-55630', ''),
  },
  {
    id: '17', callId: 'CALL-2984', timestamp: '20:37', caller: 'Fatima Bibi', category: 'Illegal Dumping',
    area: 'DHA Phase 5', district: 'Gujranwala', language: 'Punjabi', channel: 'Phone', priority: 'P2',
    status: 'Resolved', duration: '1:35', durationRaw: 95, sentiment: 'Angry', sentimentScore: -0.70,
    aiModel: 'SP-Vision-v1.4', confidence: 82.0, costSaved: 248, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-GUJ-94668', intentScore: 80, entities: 3, latency: 173,
    classificationPath: 'Illegal Dumping → P2 — High → Scheduled',
    transcript: transcriptPhone('Fatima Bibi', 'Illegal Dumping', 'DHA Phase 5', 'SP-GUJ-94668', ''),
  },
  {
    id: '18', callId: 'CALL-2983', timestamp: '13:00', caller: 'Tahir Mahmood', category: 'Missed Collection',
    area: 'Faisal Town', district: 'Lahore', language: 'Punjabi', channel: 'Phone', priority: 'P3',
    status: 'Escalated', duration: '0:57', durationRaw: 57, sentiment: 'Frustrated', sentimentScore: -0.45,
    aiModel: 'SP-Voice-v3.2', confidence: 80.0, costSaved: 88, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-83200', intentScore: 78, entities: 2, latency: 175,
    classificationPath: 'Missed Collection → P3 — Medium → Escalated',
    escalationReason: 'Low confidence', escalationAssignedTo: 'Sara Khan',
    transcript: transcriptEscalated('Tahir Mahmood', 'Missed Collection', 'Faisal Town', 'SP-LAH-83200', 'Sara Khan'),
  },
  {
    id: '19', callId: 'CALL-2982', timestamp: '16:38', caller: 'Amna Siddiqui', category: 'Illegal Dumping',
    area: 'Lake City', district: 'Lahore', language: 'English', channel: 'Phone', priority: 'P4',
    status: 'Escalated', duration: '0:47', durationRaw: 47, sentiment: 'Frustrated', sentimentScore: -0.30,
    aiModel: 'SP-Voice-v3.2', confidence: 76.5, costSaved: 75, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-LAH-72210', intentScore: 74, entities: 2, latency: 188,
    classificationPath: 'Illegal Dumping → P4 — Low → Escalated',
    escalationReason: 'Complex multi-issue', escalationAssignedTo: 'Amir Hassan',
    transcript: transcriptEscalated('Amna Siddiqui', 'Illegal Dumping', 'Lake City', 'SP-LAH-72210', 'Amir Hassan'),
  },
  {
    id: '20', callId: 'CALL-2981', timestamp: '17:37', caller: 'Fatima Bibi', category: 'Illegal Dumping',
    area: 'Ravi Road', district: 'Lahore', language: 'English', channel: 'WhatsApp', priority: 'P4',
    status: 'Escalated', duration: '1:14', durationRaw: 74, sentiment: 'Frustrated', sentimentScore: -0.40,
    aiModel: 'SP-Vision-v1.4', confidence: 78.2, costSaved: 112, repeatCaller: false, priorComplaints: 0,
    refNumber: 'SP-MAN-23084', intentScore: 76, entities: 2, latency: 192,
    classificationPath: 'Illegal Dumping → P4 — Low → Escalated',
    escalationReason: 'VIP caller', escalationAssignedTo: 'Amir Hassan',
    whatsappImage: { detection: 'Dumping site photo', confidence: 89.0, severity: 'Medium', autoCategory: 'Illegal Dumping', detectedObjects: ['rubble', 'waste bags', 'road blockage'], geoTag: 'Lahore, Ravi Road — 31.5800°N, 74.3100°E' },
    transcript: transcriptEscalated('Fatima Bibi', 'Illegal Dumping', 'Ravi Road', 'SP-MAN-23084', 'Amir Hassan'),
  },
  // Additional calls for variety
  ...Array.from({ length: 30 }, (_, i) => {
    const callers = ['Ahmed Hassan', 'Sana Khan', 'Ali Raza', 'Maryam Butt', 'Zainab Noor', 'Hassan Ali', 'Bushra Bibi', 'Imran Sheikh', 'Rubab Akhtar', 'Tariq Javed'];
    const categories = ['Missed Collection', 'Street Sweeping', 'Overflowing Bin', 'Dead Animal', 'Illegal Dumping', 'Water Logging', 'Construction Debris', 'Noise Complaint', 'Drain Blockage', 'Hazardous Waste'];
    const areas = ['Model Town', 'Gulberg III', 'Township Sector C2', 'Samnabad', 'Ichra', 'DHA Phase 1', 'Johar Town', 'Faisal Town', 'Bagbanpura', 'Kot Lakhpat'];
    const districts = ['Lahore', 'Faisalabad', 'Gujranwala', 'Multan', 'Sialkot', 'Bahawalpur', 'Attock'];
    const hour = 6 + Math.floor(Math.random() * 16);
    const min = Math.floor(Math.random() * 60);
    const isEscalated = i % 5 === 0;
    const priorityList: Priority[] = ['P2', 'P3', 'P4', 'P4', 'P4'];
    const caller = callers[i % callers.length];
    const cat = categories[i % categories.length];
    const area = areas[i % areas.length];
    const dist = districts[i % districts.length];
    return {
      id: `${21 + i}`,
      callId: `CALL-${2980 - i}`,
      timestamp: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      caller, category: cat, area, district: dist,
      language: ['Punjabi', 'Urdu', 'English'][i % 3],
      channel: (i % 3 === 0 ? 'WhatsApp' : 'Phone') as CallChannel,
      priority: priorityList[i % priorityList.length],
      status: (isEscalated ? 'Escalated' : 'Resolved') as CallStatus,
      duration: `${1 + (i % 3)}:${String(10 + (i % 50)).padStart(2, '00')}`,
      durationRaw: 70 + i * 3,
      sentiment: (isEscalated ? 'Frustrated' : 'Neutral') as Sentiment,
      sentimentScore: isEscalated ? -0.4 : 0.1,
      aiModel: i % 3 === 0 ? 'SP-Vision-v1.4' : 'SP-Voice-v3.2',
      confidence: 78 + (i % 20),
      costSaved: 100 + i * 5,
      repeatCaller: i % 8 === 0,
      priorComplaints: i % 8 === 0 ? 1 : 0,
      refNumber: `SP-${dist.substring(0, 3).toUpperCase()}-${10000 + i * 137}`,
      intentScore: 75 + (i % 22),
      entities: 2 + (i % 2),
      latency: 130 + i * 4,
      classificationPath: `${cat} → ${priorityList[i % priorityList.length]} — ${isEscalated ? 'Escalated' : 'Scheduled'}`,
      escalationReason: isEscalated ? ['Low confidence', 'Caller requested human', 'Complex multi-issue', 'VIP caller', 'Language barrier'][i % 5] : undefined,
      escalationAssignedTo: isEscalated ? ['Amir Hassan', 'Sara Khan', 'Rashid Ali', 'Kamran Javed', 'Lubna Akhtar'][i % 5] : undefined,
      whatsappImage: i % 3 === 0 ? { detection: `${cat} photo`, confidence: 85 + (i % 12), severity: 'Medium' as const, autoCategory: cat, detectedObjects: ['waste', 'debris', 'blocked'], geoTag: `${dist}, ${area}` } : undefined,
      transcript: isEscalated ? transcriptEscalated(caller, cat, area, `SP-X-${10000 + i}`, 'Amir Hassan') : transcriptPhone(caller, cat, area, `SP-X-${10000 + i}`, ''),
    };
  }),
];

// ========================
// AGENTS DATA (20 agents)
// ========================

export const agents: Agent[] = [
  { id: 'AH', initials: 'AH', name: 'Amir Hassan', specialization: 'VIP Callers', status: 'On Call', shift: 'Morning', callsToday: 33, satisfaction: 3.4, resolution: 85.2, escalations: 19, avgHandle: '6m', avatarColor: '#10b981', assignedCalls: ['CALL-2981', 'CALL-2990', 'CALL-2979', 'CALL-2971', 'CALL-2965'], weeklyData: [28, 35, 40, 32, 38, 45, 33], topCategories: [{ name: 'Missed Collection', calls: 28 }, { name: 'Overflowing Bin', calls: 8 }, { name: 'Illegal Dumping', calls: 29 }, { name: 'Street Sweeping', calls: 6 }, { name: 'Drain Blockage', calls: 22 }] },
  { id: 'SK', initials: 'SK', name: 'Sara Khan', specialization: 'VIP Callers', status: 'On Call', shift: 'Morning', callsToday: 39, satisfaction: 3.5, resolution: 95.5, escalations: 15, avgHandle: '5m', avatarColor: '#3b82f6', assignedCalls: ['CALL-2983', 'CALL-2975', 'CALL-2968'], weeklyData: [30, 38, 34, 42, 36, 40, 39], topCategories: [{ name: 'Street Sweeping', calls: 18 }, { name: 'Dead Animal', calls: 10 }, { name: 'Noise Complaint', calls: 12 }, { name: 'Missed Collection', calls: 22 }, { name: 'Overflowing Bin', calls: 9 }] },
  { id: 'RA', initials: 'RA', name: 'Rashid Ali', specialization: 'Repeat Callers', status: 'On Call', shift: 'Morning', callsToday: 42, satisfaction: 4.8, resolution: 88.9, escalations: 12, avgHandle: '4m', avatarColor: '#a855f7', assignedCalls: ['CALL-2977', 'CALL-2969', 'CALL-2961'], weeklyData: [35, 40, 38, 44, 42, 38, 42], topCategories: [{ name: 'Water Logging', calls: 15 }, { name: 'Street Sweeping', calls: 12 }, { name: 'Construction Debris', calls: 8 }, { name: 'Dead Animal', calls: 6 }, { name: 'Missed Collection', calls: 11 }] },
  { id: 'NB', initials: 'NB', name: 'Nazia Butt', specialization: 'Technical', status: 'Break', shift: 'Morning', callsToday: 27, satisfaction: 3.9, resolution: 78.9, escalations: 18, avgHandle: '7m', avatarColor: '#6b7280', assignedCalls: ['CALL-3000', 'CALL-2976'], weeklyData: [20, 22, 25, 28, 24, 26, 27], topCategories: [{ name: 'Drain Blockage', calls: 12 }, { name: 'Water Logging', calls: 8 }, { name: 'Hazardous Waste', calls: 5 }, { name: 'Illegal Dumping', calls: 4 }, { name: 'Construction Debris', calls: 3 }] },
  { id: 'KJ', initials: 'KJ', name: 'Kamran Javed', specialization: 'Complex Issues', status: 'On Call', shift: 'Morning', callsToday: 25, satisfaction: 4.2, resolution: 90.6, escalations: 10, avgHandle: '8m', avatarColor: '#f97316', assignedCalls: ['CALL-2994', 'CALL-2980'], weeklyData: [18, 22, 20, 24, 25, 22, 25], topCategories: [{ name: 'Hazardous Waste', calls: 10 }, { name: 'Construction Debris', calls: 8 }, { name: 'Illegal Dumping', calls: 6 }, { name: 'Dead Animal', calls: 4 }, { name: 'Water Logging', calls: 3 }] },
  { id: 'LA', initials: 'LA', name: 'Lubna Akhtar', specialization: 'Complex Issues', status: 'On Call', shift: 'Morning', callsToday: 27, satisfaction: 4.1, resolution: 87.7, escalations: 11, avgHandle: '6m', avatarColor: '#ec4899', assignedCalls: ['CALL-2978', 'CALL-2970'], weeklyData: [22, 24, 26, 24, 28, 25, 27], topCategories: [{ name: 'Noise Complaint', calls: 12 }, { name: 'Street Sweeping', calls: 9 }, { name: 'Overflowing Bin', calls: 7 }, { name: 'Missed Collection', calls: 6 }, { name: 'Illegal Dumping', calls: 4 }] },
  { id: 'FR', initials: 'FR', name: 'Faisal Raza', specialization: 'Repeat Callers', status: 'On Call', shift: 'Morning', callsToday: 32, satisfaction: 4.2, resolution: 96.1, escalations: 8, avgHandle: '5m', avatarColor: '#14b8a6', assignedCalls: ['CALL-2974', 'CALL-2966'], weeklyData: [25, 28, 30, 32, 28, 30, 32], topCategories: [{ name: 'Missed Collection', calls: 14 }, { name: 'Street Sweeping', calls: 10 }, { name: 'Overflowing Bin', calls: 8 }, { name: 'Dead Animal', calls: 5 }, { name: 'Construction Debris', calls: 4 }] },
  { id: 'HS', initials: 'HS', name: 'Huma Sheikh', specialization: 'VIP Callers', status: 'On Call', shift: 'Evening', callsToday: 28, satisfaction: 4.6, resolution: 90.8, escalations: 9, avgHandle: '5m', avatarColor: '#8b5cf6', assignedCalls: ['CALL-2972', 'CALL-2964'], weeklyData: [20, 24, 22, 26, 28, 24, 28], topCategories: [{ name: 'VIP Requests', calls: 16 }, { name: 'Missed Collection', calls: 8 }, { name: 'Street Sweeping', calls: 5 }, { name: 'Overflowing Bin', calls: 3 }, { name: 'Noise Complaint', calls: 2 }] },
  { id: 'NA', initials: 'NA', name: 'Naveed Aslam', specialization: 'Complex Issues', status: 'On Call', shift: 'Evening', callsToday: 21, satisfaction: 4.2, resolution: 64.9, escalations: 14, avgHandle: '9m', avatarColor: '#ef4444', assignedCalls: ['CALL-2967', 'CALL-2959'], weeklyData: [15, 18, 16, 20, 21, 18, 21], topCategories: [{ name: 'Water Logging', calls: 8 }, { name: 'Drain Blockage', calls: 7 }, { name: 'Hazardous Waste', calls: 4 }, { name: 'Construction Debris', calls: 3 }, { name: 'Illegal Dumping', calls: 2 }] },
  { id: 'ZM', initials: 'ZM', name: 'Zara Malik', specialization: 'Repeat Callers', status: 'On Call', shift: 'Evening', callsToday: 43, satisfaction: 3.4, resolution: 96.8, escalations: 7, avgHandle: '4m', avatarColor: '#d97706', assignedCalls: ['CALL-2963', 'CALL-2955'], weeklyData: [35, 38, 40, 42, 38, 42, 43], topCategories: [{ name: 'Street Sweeping', calls: 20 }, { name: 'Missed Collection', calls: 15 }, { name: 'Overflowing Bin', calls: 8 }, { name: 'Dead Animal', calls: 5 }, { name: 'Noise Complaint', calls: 4 }] },
  { id: 'TM', initials: 'TM', name: 'Tariq Mehmood', specialization: 'Repeat Callers', status: 'On Call', shift: 'Evening', callsToday: 33, satisfaction: 4.5, resolution: 89.3, escalations: 10, avgHandle: '5m', avatarColor: '#0891b2', assignedCalls: ['CALL-2957', 'CALL-2949'], weeklyData: [25, 28, 30, 32, 30, 28, 33], topCategories: [{ name: 'Missed Collection', calls: 12 }, { name: 'Street Sweeping', calls: 10 }, { name: 'Overflowing Bin', calls: 7 }, { name: 'Dead Animal', calls: 5 }, { name: 'Drain Blockage', calls: 4 }] },
  { id: 'SP2', initials: 'SP', name: 'Sadia Parveen', specialization: 'Multi-language', status: 'On Call', shift: 'Evening', callsToday: 22, satisfaction: 3.8, resolution: 82.7, escalations: 12, avgHandle: '7m', avatarColor: '#7c3aed', assignedCalls: ['CALL-2951', 'CALL-2943'], weeklyData: [15, 18, 20, 22, 18, 20, 22], topCategories: [{ name: 'Noise Complaint', calls: 8 }, { name: 'Illegal Dumping', calls: 6 }, { name: 'Street Sweeping', calls: 5 }, { name: 'Missed Collection', calls: 4 }, { name: 'Water Logging', calls: 3 }] },
  { id: 'JA', initials: 'JA', name: 'Jawad Ahmed', specialization: 'VIP Callers', status: 'Available', shift: 'Evening', callsToday: 43, satisfaction: 4.0, resolution: 83.1, escalations: 15, avgHandle: '6m', avatarColor: '#059669', assignedCalls: ['CALL-2945', 'CALL-2937'], weeklyData: [32, 36, 38, 42, 40, 38, 43], topCategories: [{ name: 'VIP Requests', calls: 18 }, { name: 'Missed Collection', calls: 12 }, { name: 'Street Sweeping', calls: 8 }, { name: 'Overflowing Bin', calls: 5 }, { name: 'Noise Complaint', calls: 3 }] },
  { id: 'RB', initials: 'RB', name: 'Rubina Bibi', specialization: 'VIP Callers', status: 'Break', shift: 'Evening', callsToday: 26, satisfaction: 3.5, resolution: 95.6, escalations: 8, avgHandle: '4m', avatarColor: '#db2777', assignedCalls: ['CALL-2939', 'CALL-2931'], weeklyData: [20, 22, 24, 26, 22, 24, 26], topCategories: [{ name: 'Street Sweeping', calls: 10 }, { name: 'Dead Animal', calls: 8 }, { name: 'Missed Collection', calls: 6 }, { name: 'Overflowing Bin', calls: 5 }, { name: 'Noise Complaint', calls: 4 }] },
  { id: 'UF', initials: 'UF', name: 'Umar Farooq', specialization: 'Complex Issues', status: 'Break', shift: 'Night', callsToday: 16, satisfaction: 3.4, resolution: 89.3, escalations: 9, avgHandle: '8m', avatarColor: '#065f46', assignedCalls: ['CALL-2933'], weeklyData: [12, 14, 15, 16, 14, 15, 16], topCategories: [{ name: 'Hazardous Waste', calls: 6 }, { name: 'Construction Debris', calls: 5 }, { name: 'Illegal Dumping', calls: 4 }, { name: 'Dead Animal', calls: 3 }, { name: 'Water Logging', calls: 2 }] },
  { id: 'SN', initials: 'SN', name: 'Shabana Noor', specialization: 'Complex Issues', status: 'Break', shift: 'Night', callsToday: 15, satisfaction: 3.3, resolution: 96.0, escalations: 6, avgHandle: '5m', avatarColor: '#7e22ce', assignedCalls: ['CALL-2927'], weeklyData: [10, 12, 13, 14, 12, 13, 15], topCategories: [{ name: 'Dead Animal', calls: 5 }, { name: 'Street Sweeping', calls: 4 }, { name: 'Noise Complaint', calls: 3 }, { name: 'Missed Collection', calls: 3 }, { name: 'Overflowing Bin', calls: 2 }] },
  { id: 'AK', initials: 'AK', name: 'Adeel Khan', specialization: 'Technical', status: 'On Call', shift: 'Night', callsToday: 30, satisfaction: 4.8, resolution: 96.2, escalations: 5, avgHandle: '5m', avatarColor: '#1d4ed8', assignedCalls: ['CALL-2921', 'CALL-2913'], weeklyData: [22, 25, 26, 28, 26, 28, 30], topCategories: [{ name: 'Drain Blockage', calls: 10 }, { name: 'Water Logging', calls: 8 }, { name: 'Hazardous Waste', calls: 6 }, { name: 'Construction Debris', calls: 5 }, { name: 'Illegal Dumping', calls: 4 }] },
  { id: 'BR', initials: 'BR', name: 'Bushra Riaz', specialization: 'Technical', status: 'Available', shift: 'Night', callsToday: 22, satisfaction: 4.3, resolution: 94.4, escalations: 7, avgHandle: '6m', avatarColor: '#c2410c', assignedCalls: ['CALL-2915'], weeklyData: [16, 18, 20, 22, 18, 20, 22], topCategories: [{ name: 'Technical Issues', calls: 8 }, { name: 'Street Sweeping', calls: 6 }, { name: 'Missed Collection', calls: 5 }, { name: 'Overflowing Bin', calls: 4 }, { name: 'Dead Animal', calls: 3 }] },
  { id: 'MS', initials: 'MS', name: 'Mohsin Shah', specialization: 'Technical', status: 'Break', shift: 'Night', callsToday: 29, satisfaction: 4.7, resolution: 81.1, escalations: 11, avgHandle: '7m', avatarColor: '#0f766e', assignedCalls: ['CALL-2909'], weeklyData: [22, 24, 25, 28, 26, 27, 29], topCategories: [{ name: 'Hazardous Waste', calls: 10 }, { name: 'Construction Debris', calls: 8 }, { name: 'Drain Blockage', calls: 6 }, { name: 'Dead Animal', calls: 4 }, { name: 'Water Logging', calls: 3 }] },
  { id: 'AL', initials: 'AL', name: 'Asma Latif', specialization: 'Multi-language', status: 'On Call', shift: 'Night', callsToday: 15, satisfaction: 3.6, resolution: 97.3, escalations: 4, avgHandle: '4m', avatarColor: '#92400e', assignedCalls: ['CALL-2903'], weeklyData: [10, 12, 13, 14, 12, 13, 15], topCategories: [{ name: 'Street Sweeping', calls: 5 }, { name: 'Missed Collection', calls: 4 }, { name: 'Noise Complaint', calls: 3 }, { name: 'Overflowing Bin', calls: 2 }, { name: 'Dead Animal', calls: 1 }] },
];

// ========================
// CATEGORIES (AI Triage)
// ========================

export const categories: Category[] = [
  { id: 'missed-collection', name: 'Missed Collection', callsPerDay: 464, confidence: 89.9, avgDuration: 133, resolutionRate: 85.5, escalationRate: 13.2, subCategories: [{ name: 'Regular Bin', percent: 45 }, { name: 'Commercial', percent: 22 }, { name: 'Residential', percent: 18 }, { name: 'Recurring', percent: 15 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 98.2, correction: 0.5 }, { dialect: 'Punjabi Mix', confidence: 84.1, correction: 4.2 }, { dialect: 'English Terms', confidence: 92.4, correction: 1.8 }, { dialect: 'Slang / Local', confidence: 72.5, correction: 12.4 }] },
  { id: 'overflowing-bin', name: 'Overflowing Bin', callsPerDay: 460, confidence: 90.0, avgDuration: 143, resolutionRate: 88.7, escalationRate: 6.7, subCategories: [{ name: 'Street Bin', percent: 55 }, { name: 'Market Area', percent: 25 }, { name: 'Residential', percent: 15 }, { name: 'Industrial', percent: 5 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 97.5, correction: 0.8 }, { dialect: 'Punjabi Mix', confidence: 86.0, correction: 3.8 }, { dialect: 'English Terms', confidence: 94.0, correction: 1.5 }, { dialect: 'Slang / Local', confidence: 74.2, correction: 11.8 }] },
  { id: 'illegal-dumping', name: 'Illegal Dumping', callsPerDay: 225, confidence: 80.0, avgDuration: 104, resolutionRate: 87.9, escalationRate: 6.3, subCategories: [{ name: 'Construction', percent: 40 }, { name: 'Household', percent: 30 }, { name: 'Industrial', percent: 20 }, { name: 'Medical', percent: 10 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 95.8, correction: 1.2 }, { dialect: 'Punjabi Mix', confidence: 82.3, correction: 5.1 }, { dialect: 'English Terms', confidence: 91.2, correction: 2.1 }, { dialect: 'Slang / Local', confidence: 70.5, correction: 13.8 }] },
  { id: 'street-sweeping', name: 'Street Sweeping', callsPerDay: 410, confidence: 90.0, avgDuration: 82, resolutionRate: 94.1, escalationRate: 8.0, subCategories: [{ name: 'Main Road', percent: 48 }, { name: 'Side Street', percent: 28 }, { name: 'Market', percent: 14 }, { name: 'Residential Lane', percent: 10 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 99.1, correction: 0.3 }, { dialect: 'Punjabi Mix', confidence: 87.5, correction: 3.5 }, { dialect: 'English Terms', confidence: 95.2, correction: 1.2 }, { dialect: 'Slang / Local', confidence: 75.8, correction: 10.5 }] },
  { id: 'drain-blockage', name: 'Drain Blockage', callsPerDay: 331, confidence: 79.8, avgDuration: 61, resolutionRate: 94.2, escalationRate: 8.7, subCategories: [{ name: 'Street Drain', percent: 50 }, { name: 'Nala', percent: 30 }, { name: 'Residential', percent: 15 }, { name: 'Industrial', percent: 5 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 96.4, correction: 1.0 }, { dialect: 'Punjabi Mix', confidence: 83.8, correction: 4.5 }, { dialect: 'English Terms', confidence: 92.8, correction: 1.9 }, { dialect: 'Slang / Local', confidence: 68.9, correction: 14.5 }] },
  { id: 'dead-animal', name: 'Dead Animal', callsPerDay: 466, confidence: 79.8, avgDuration: 149, resolutionRate: 97.9, escalationRate: 14.5, subCategories: [{ name: 'Stray Dog', percent: 45 }, { name: 'Cat', percent: 25 }, { name: 'Livestock', percent: 20 }, { name: 'Other', percent: 10 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 97.2, correction: 0.9 }, { dialect: 'Punjabi Mix', confidence: 81.5, correction: 5.8 }, { dialect: 'English Terms', confidence: 93.5, correction: 1.7 }, { dialect: 'Slang / Local', confidence: 71.2, correction: 12.9 }] },
  { id: 'construction-debris', name: 'Construction Debris', callsPerDay: 378, confidence: 79.9, avgDuration: 100, resolutionRate: 93.2, escalationRate: 10.4, subCategories: [{ name: 'Rubble', percent: 55 }, { name: 'Sand/Gravel', percent: 25 }, { name: 'Metal Scrap', percent: 12 }, { name: 'Other', percent: 8 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 96.8, correction: 0.9 }, { dialect: 'Punjabi Mix', confidence: 83.2, correction: 4.8 }, { dialect: 'English Terms', confidence: 93.1, correction: 1.8 }, { dialect: 'Slang / Local', confidence: 70.8, correction: 13.2 }] },
  { id: 'hazardous-waste', name: 'Hazardous Waste', callsPerDay: 450, confidence: 90.0, avgDuration: 139, resolutionRate: 84.0, escalationRate: 9.8, subCategories: [{ name: 'Chemical', percent: 35 }, { name: 'Medical', percent: 30 }, { name: 'Electronic', percent: 22 }, { name: 'Other', percent: 13 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 97.0, correction: 0.8 }, { dialect: 'Punjabi Mix', confidence: 85.4, correction: 4.0 }, { dialect: 'English Terms', confidence: 94.2, correction: 1.5 }, { dialect: 'Slang / Local', confidence: 73.5, correction: 11.8 }] },
  { id: 'noise-complaint', name: 'Noise Complaint', callsPerDay: 483, confidence: 89.9, avgDuration: 105, resolutionRate: 83.0, escalationRate: 8.0, subCategories: [{ name: 'Construction', percent: 40 }, { name: 'Loudspeaker', percent: 30 }, { name: 'Vehicle', percent: 20 }, { name: 'Other', percent: 10 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 98.5, correction: 0.4 }, { dialect: 'Punjabi Mix', confidence: 86.2, correction: 3.9 }, { dialect: 'English Terms', confidence: 95.8, correction: 1.1 }, { dialect: 'Slang / Local', confidence: 76.4, correction: 10.2 }] },
  { id: 'water-logging', name: 'Water Logging', callsPerDay: 384, confidence: 89.8, avgDuration: 131, resolutionRate: 86.4, escalationRate: 3.1, subCategories: [{ name: 'Road Flooding', percent: 50 }, { name: 'Residential', percent: 30 }, { name: 'Drain Overflow', percent: 15 }, { name: 'Other', percent: 5 }], dialectData: [{ dialect: 'Standard Urdu', confidence: 97.8, correction: 0.7 }, { dialect: 'Punjabi Mix', confidence: 84.8, correction: 4.1 }, { dialect: 'English Terms', confidence: 93.8, correction: 1.6 }, { dialect: 'Slang / Local', confidence: 72.9, correction: 12.1 }] },
];

// ========================
// DISTRICTS (Call Analytics)
// ========================

export const districts: District[] = [
  { id: 'lahore', name: 'Lahore', calls: 326, aiHandled: 266, whatsapp: 82, rating: 3.9, escalationRate: 11, weeklyTrend: [280, 295, 430, 310, 290, 320, 326], topCategory: 'Overflowing Bin', repeatRate: 8.6, assignedAgents: 8, areas: [{ name: 'Cavalry Ground', calls: 34, ai: 30, wa: 13, images: 6, rating: 4.9, escRate: 16 }, { name: 'DHA Phase 5', calls: 33, ai: 26, wa: 13, images: 6, rating: 4.7, escRate: 6 }, { name: 'Cantt', calls: 33, ai: 26, wa: 9, images: 3, rating: 3.1, escRate: 15 }, { name: 'Shadman', calls: 28, ai: 22, wa: 8, images: 2, rating: 4.2, escRate: 8 }, { name: 'Anarkali', calls: 28, ai: 22, wa: 5, images: 2, rating: 3.1, escRate: 7 }, { name: 'Township Sector C2', calls: 27, ai: 24, wa: 8, images: 2, rating: 4.0, escRate: 12 }, { name: 'Faisal Town', calls: 25, ai: 20, wa: 5, images: 5, rating: 4.0, escRate: 11 }, { name: 'Model Town Link Road', calls: 24, ai: 19, wa: 7, images: 2, rating: 3.8, escRate: 13 }, { name: 'Johar Town Block D', calls: 23, ai: 18, wa: 9, images: 4, rating: 3.2, escRate: 6 }, { name: 'Ichra', calls: 19, ai: 15, wa: 5, images: 1, rating: 3.7, escRate: 12 }, { name: 'Garden Town', calls: 17, ai: 15, wa: 5, images: 1, rating: 3.2, escRate: 5 }, { name: 'Allama Iqbal Town', calls: 17, ai: 15, wa: 6, images: 1, rating: 4.4, escRate: 16 }, { name: 'Gulberg III', calls: 10, ai: 8, wa: 2, images: 2, rating: 3.7, escRate: 14 }, { name: 'Samanabad', calls: 8, ai: 6, wa: 3, images: 0, rating: 3.3, escRate: 17 }] },
  { id: 'faisalabad', name: 'Faisalabad', calls: 83, aiHandled: 67, whatsapp: 21, rating: 3.6, escalationRate: 5, weeklyTrend: [70, 75, 72, 80, 78, 82, 83], topCategory: 'Missed Collection', repeatRate: 6.2, assignedAgents: 3, areas: [{ name: 'Madina Town', calls: 18, ai: 15, wa: 5, images: 2, rating: 4.1, escRate: 8 }, { name: 'Muslim Town', calls: 15, ai: 12, wa: 4, images: 1, rating: 3.8, escRate: 6 }, { name: 'D-Ground', calls: 14, ai: 11, wa: 3, images: 2, rating: 3.5, escRate: 7 }, { name: 'Kotwali', calls: 12, ai: 10, wa: 3, images: 1, rating: 3.3, escRate: 9 }, { name: 'Millat Town', calls: 10, ai: 8, wa: 2, images: 1, rating: 3.6, escRate: 5 }] },
  { id: 'vehari', name: 'Vehari', calls: 82, aiHandled: 65, whatsapp: 20, rating: 4.6, escalationRate: 14, weeklyTrend: [68, 72, 75, 78, 80, 80, 82], topCategory: 'Street Sweeping', repeatRate: 5.8, assignedAgents: 3, areas: [{ name: 'City Center', calls: 20, ai: 16, wa: 5, images: 2, rating: 4.5, escRate: 12 }, { name: 'Mailsi Road', calls: 18, ai: 14, wa: 4, images: 1, rating: 4.6, escRate: 15 }, { name: 'Mitr Wala', calls: 12, ai: 10, wa: 3, images: 2, rating: 4.8, escRate: 10 }] },
  { id: 'khushab', name: 'Khushab', calls: 78, aiHandled: 63, whatsapp: 19, rating: 3.7, escalationRate: 20, weeklyTrend: [62, 66, 70, 72, 74, 76, 78], topCategory: 'Water Logging', repeatRate: 7.2, assignedAgents: 3, areas: [{ name: 'Wahdat Road', calls: 22, ai: 18, wa: 8, images: 3, rating: 3.5, escRate: 22 }, { name: 'Wapda Town', calls: 18, ai: 14, wa: 5, images: 2, rating: 4.0, escRate: 18 }, { name: 'Punjab Society', calls: 15, ai: 12, wa: 4, images: 1, rating: 3.8, escRate: 20 }, { name: 'Industrial Zone', calls: 12, ai: 10, wa: 2, images: 1, rating: 3.6, escRate: 19 }] },
  { id: 'taxila', name: 'Taxila', calls: 77, aiHandled: 62, whatsapp: 18, rating: 3.2, escalationRate: 16, weeklyTrend: [60, 64, 68, 70, 72, 74, 77], topCategory: 'Dead Animal', repeatRate: 6.8, assignedAgents: 3, areas: [{ name: 'Wah Cantt', calls: 20, ai: 16, wa: 5, images: 2, rating: 3.2, escRate: 15 }, { name: 'City Area', calls: 15, ai: 12, wa: 3, images: 1, rating: 3.4, escRate: 17 }] },
  { id: 'hafizabad', name: 'Hafizabad', calls: 75, aiHandled: 62, whatsapp: 18, rating: 3.5, escalationRate: 6, weeklyTrend: [58, 62, 65, 68, 70, 72, 75], topCategory: 'Overflowing Bin', repeatRate: 5.5, assignedAgents: 2, areas: [{ name: 'City Center', calls: 25, ai: 20, wa: 6, images: 2, rating: 3.5, escRate: 6 }, { name: 'Model Town', calls: 20, ai: 16, wa: 5, images: 1, rating: 3.6, escRate: 5 }] },
  { id: 'mandi-bahauddin', name: 'Mandi Bahauddin', calls: 75, aiHandled: 59, whatsapp: 17, rating: 4.1, escalationRate: 15, weeklyTrend: [58, 60, 64, 68, 70, 72, 75], topCategory: 'Drain Blockage', repeatRate: 6.1, assignedAgents: 2, areas: [{ name: 'Main City', calls: 28, ai: 22, wa: 7, images: 3, rating: 4.1, escRate: 14 }, { name: 'Industrial Area', calls: 20, ai: 16, wa: 5, images: 2, rating: 4.0, escRate: 16 }] },
  { id: 'toba-tek-singh', name: 'Toba Tek Singh', calls: 74, aiHandled: 59, whatsapp: 17, rating: 4.4, escalationRate: 13, weeklyTrend: [56, 60, 63, 66, 68, 70, 74], topCategory: 'Missed Collection', repeatRate: 5.9, assignedAgents: 2, areas: [{ name: 'City Center', calls: 25, ai: 20, wa: 6, images: 2, rating: 4.4, escRate: 12 }] },
  { id: 'wazirabad', name: 'Wazirabad', calls: 74, aiHandled: 59, whatsapp: 17, rating: 4.1, escalationRate: 12, weeklyTrend: [55, 58, 62, 65, 68, 70, 74], topCategory: 'Street Sweeping', repeatRate: 5.6, assignedAgents: 2, areas: [{ name: 'Main Market', calls: 28, ai: 22, wa: 7, images: 2, rating: 4.1, escRate: 11 }] },
  { id: 'muzaffargarh', name: 'Muzaffargarh', calls: 73, aiHandled: 58, whatsapp: 16, rating: 3.3, escalationRate: 5, weeklyTrend: [54, 58, 60, 63, 66, 68, 73], topCategory: 'Overflowing Bin', repeatRate: 5.2, assignedAgents: 2, areas: [{ name: 'City Center', calls: 25, ai: 20, wa: 6, images: 1, rating: 3.3, escRate: 5 }] },
  { id: 'khanewal', name: 'Khanewal', calls: 73, aiHandled: 60, whatsapp: 17, rating: 3.8, escalationRate: 18, weeklyTrend: [53, 57, 60, 63, 66, 69, 73], topCategory: 'Dead Animal', repeatRate: 6.7, assignedAgents: 2, areas: [{ name: 'Main City', calls: 28, ai: 22, wa: 8, images: 3, rating: 3.8, escRate: 17 }] },
  { id: 'chiniot', name: 'Chiniot', calls: 68, aiHandled: 54, whatsapp: 15, rating: 3.5, escalationRate: 16, weeklyTrend: [50, 53, 56, 59, 62, 65, 68], topCategory: 'Missed Collection', repeatRate: 6.0, assignedAgents: 2, areas: [{ name: 'City Center', calls: 22, ai: 17, wa: 5, images: 2, rating: 3.5, escRate: 15 }] },
  { id: 'layyah', name: 'Layyah', calls: 68, aiHandled: 53, whatsapp: 15, rating: 3.7, escalationRate: 11, weeklyTrend: [48, 52, 55, 58, 60, 63, 68], topCategory: 'Street Sweeping', repeatRate: 5.4, assignedAgents: 2, areas: [{ name: 'Main City', calls: 20, ai: 16, wa: 4, images: 1, rating: 3.7, escRate: 10 }] },
  { id: 'bahawalpur', name: 'Bahawalpur', calls: 67, aiHandled: 52, whatsapp: 15, rating: 3.5, escalationRate: 20, weeklyTrend: [48, 51, 54, 57, 60, 63, 67], topCategory: 'Hazardous Waste', repeatRate: 7.0, assignedAgents: 2, areas: [{ name: 'City Center', calls: 22, ai: 17, wa: 5, images: 2, rating: 3.5, escRate: 19 }] },
  { id: 'pakpattan', name: 'Pakpattan', calls: 66, aiHandled: 51, whatsapp: 14, rating: 4.0, escalationRate: 6, weeklyTrend: [46, 50, 53, 56, 58, 62, 66], topCategory: 'Missed Collection', repeatRate: 5.1, assignedAgents: 2, areas: [{ name: 'Main City', calls: 20, ai: 16, wa: 4, images: 1, rating: 4.0, escRate: 5 }] },
  { id: 'okara', name: 'Okara', calls: 64, aiHandled: 52, whatsapp: 14, rating: 4.2, escalationRate: 19, weeklyTrend: [45, 48, 52, 54, 56, 60, 64], topCategory: 'Street Sweeping', repeatRate: 6.8, assignedAgents: 2, areas: [{ name: 'Main City', calls: 20, ai: 16, wa: 5, images: 2, rating: 4.2, escRate: 18 }] },
  { id: 'attock', name: 'Attock', calls: 64, aiHandled: 51, whatsapp: 13, rating: 3.4, escalationRate: 10, weeklyTrend: [44, 48, 50, 53, 56, 60, 64], topCategory: 'Dead Animal', repeatRate: 5.9, assignedAgents: 2, areas: [{ name: 'City Center', calls: 18, ai: 14, wa: 3, images: 1, rating: 3.4, escRate: 10 }] },
  { id: 'gujranwala', name: 'Gujranwala', calls: 63, aiHandled: 50, whatsapp: 13, rating: 3.9, escalationRate: 8, weeklyTrend: [44, 47, 50, 52, 55, 58, 63], topCategory: 'Illegal Dumping', repeatRate: 5.6, assignedAgents: 2, areas: [{ name: 'Satellite Town', calls: 20, ai: 16, wa: 5, images: 2, rating: 3.9, escRate: 7 }, { name: 'DHA Phase 5', calls: 18, ai: 14, wa: 4, images: 1, rating: 4.0, escRate: 8 }] },
  { id: 'sialkot', name: 'Sialkot', calls: 60, aiHandled: 48, whatsapp: 13, rating: 3.6, escalationRate: 8, weeklyTrend: [42, 45, 48, 50, 52, 56, 60], topCategory: 'Noise Complaint', repeatRate: 5.4, assignedAgents: 2, areas: [{ name: 'City Center', calls: 18, ai: 14, wa: 4, images: 1, rating: 3.6, escRate: 8 }] },
  { id: 'rawalpindi', name: 'Rawalpindi', calls: 58, aiHandled: 46, whatsapp: 12, rating: 4.0, escalationRate: 9, weeklyTrend: [40, 43, 46, 48, 50, 54, 58], topCategory: 'Street Sweeping', repeatRate: 5.2, assignedAgents: 2, areas: [{ name: 'Satellite Town', calls: 18, ai: 14, wa: 4, images: 1, rating: 4.0, escRate: 8 }] },
];

// ========================
// ESCALATIONS
// ========================

export const escalations: EscalationItem[] = [
  { callId: 'CALL-3000', time: '17:13', caller: 'Rabia Aslam', category: 'Street Sweeping', reason: 'Caller requested human', urgency: 'P3', assignedTo: 'Nazia Butt', duration: '2:02', area: 'Wahdat Road', refNumber: 'SP-KHU-91950', confidenceAtEscalation: 95.9, callerSentiment: 'Frustrated', conversationTurns: 6, callerRequestedHuman: true, repeatCaller: false, priorCalls: 0, aiNote: 'Caller specifically requested human agent after AI registration. High confidence case but caller preference override.', handoffNote: 'Caller is a repeat customer requesting collection update. WhatsApp photo already logged. Complaint SP-KHU-91950 registered. Caller frustrated but cooperative.' },
  { callId: 'CALL-2994', time: '22:13', caller: 'Tahir Mahmood', category: 'Water Logging', reason: 'Repeat complaint >3x', urgency: 'P3', assignedTo: 'Kamran Javed', duration: '1:17', area: 'Mughalpura', refNumber: 'SP-LAH-33211', confidenceAtEscalation: 78.5, callerSentiment: 'Frustrated', conversationTurns: 5, callerRequestedHuman: false, repeatCaller: true, priorCalls: 2, aiNote: 'Third complaint for same location. System flagged for human review due to repeat pattern.', handoffNote: 'This is the 3rd complaint from this address. Previous tickets: SP-LAH-22100, SP-LAH-27800. Issue may require field inspection.' },
  { callId: 'CALL-2990', time: '09:15', caller: 'Nadia Perveen', category: 'Missed Collection', reason: 'Threatening tone', urgency: 'P2', assignedTo: 'Amir Hassan', duration: '1:55', area: 'Cavalry Ground', refNumber: 'SP-LAH-45078', confidenceAtEscalation: 72.5, callerSentiment: 'Angry', conversationTurns: 8, callerRequestedHuman: false, repeatCaller: true, priorCalls: 3, aiNote: 'Frustrated caller used threatening language. Immediate escalation per protocol.', handoffNote: 'Caller has 3 prior complaints. Today using angry tone. Please de-escalate and ensure fast resolution.' },
  { callId: 'CALL-2983', time: '13:00', caller: 'Tahir Mahmood', category: 'Missed Collection', reason: 'Low confidence', urgency: 'P3', assignedTo: 'Sara Khan', duration: '0:57', area: 'Faisal Town', refNumber: 'SP-LAH-83200', confidenceAtEscalation: 80.0, callerSentiment: 'Frustrated', conversationTurns: 4, callerRequestedHuman: false, repeatCaller: false, priorCalls: 0, aiNote: 'AI confidence dropped below threshold during classification. Manual verification needed.', handoffNote: 'Caller was unclear about exact location. Area might be Faisal Town Block A or B - needs verification.' },
  { callId: 'CALL-2981', time: '17:37', caller: 'Fatima Bibi', category: 'Illegal Dumping', reason: 'VIP caller', urgency: 'P2', assignedTo: 'Amir Hassan', duration: '1:14', area: 'Ravi Road', refNumber: 'SP-MAN-23084', confidenceAtEscalation: 85.8, callerSentiment: 'Frustrated', conversationTurns: 8, callerRequestedHuman: false, repeatCaller: true, priorCalls: 0, aiNote: 'VIP account #WT-8829-11 triggered automatic escalation per VIP protocol.', handoffNote: 'VIP account. WhatsApp image marked as medium severity illegal dump. Caller expects fast response.' },
  { callId: 'CALL-2979', time: '11:27', caller: 'Ahmed Khan', category: 'Water Logging', reason: 'Repeat complaint >3x', urgency: 'P3', assignedTo: 'Jawad Ahmed', duration: '2:21', area: 'Anarkali', refNumber: 'SP-LAH-38920', confidenceAtEscalation: 82.0, callerSentiment: 'Frustrated', conversationTurns: 6, callerRequestedHuman: false, repeatCaller: true, priorCalls: 2, aiNote: 'Repeat case from same area. Field dispatch already failed twice.', handoffNote: 'Third call about water logging on Anarkali main road. Previous dispatch teams did not resolve. May need infrastructure report.' },
  { callId: 'CALL-2965', time: '20:50', caller: 'Nadia Perveen', category: 'Dead Animal', reason: 'VIP caller', urgency: 'P2', assignedTo: 'Amir Hassan', duration: '1:35', area: 'Model Town Link Road', refNumber: 'SP-SAR-45078', confidenceAtEscalation: 85.8, callerSentiment: 'Frustrated', conversationTurns: 8, callerRequestedHuman: false, repeatCaller: true, priorCalls: 0, aiNote: 'VIP caller triggered auto-escalation. Photo of dead animal submitted via WhatsApp.', handoffNote: 'Dead animal removal requested. WhatsApp image received — confirmed dead dog. VIP priority.' },
];

// ========================
// COST & ROI DATA
// ========================

export const costData = {
  oldMonthly: 6.8,
  newMonthly: 1.9,
  monthlySavings: 4.8,
  annualSavings: 58.2,
  agentsReduced: { from: 150, to: 20 },
  roi: 1021,
  monthlyTrend: [4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.8, 4.9, 4.9, 5.0, 5.0, 5.1],
  oldModel: {
    salaries: 6.8, infrastructure: 0.5, trainingQA: 0.2, total: 6.8, costPerCall: 75
  },
  newModel: {
    agentSalaries: 1.1, aiPlatform: 0.8, infrastructure: 0.2, total: 1.9, costPerCall: 21
  },
  monthlyBreakdown: {
    jan: { manual: { old: 5.2, new: 0.8, saving: 84.6 }, training: { old: 0.8, new: 0.1, saving: 87.5 }, infra: { old: 0.5, new: 0.2, saving: 60 }, software: { old: 0.1, new: 0.6, saving: -500 }, total: { old: 6.6, new: 1.7, saving: 74.2 } },
  },
  projectionPhases: [
    { phase: 1, title: 'Implementation', period: 'Q1 2026', desc: 'Setup costs and initial training PKR 1.5M' },
    { phase: 2, title: 'Scaling', period: 'Q2 2026', desc: '90% AI triage achieved, manual reduction' },
    { phase: 3, title: 'Optimization', period: 'Q3 2026', desc: 'LLM fine-tuning for local dialects' },
    { phase: 4, title: 'Full ROI', period: 'Q4 2026', desc: 'Maximized efficiency and cost reduction' },
  ],
  monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// ========================
// RESOLUTION CHAIN STEPS
// ========================

export const resolutionChainSteps = [
  { time: '00:01', title: 'Call Received', subtitle: 'Incoming voice connection established', system: 'SYSTEM_READY', color: 'green' },
  { time: '00:04', title: 'STT Stream Initiated', subtitle: 'Speech-to-Text engine processing audio', system: 'STT_ENGINE', color: 'green' },
  { time: '00:15', title: 'Initial Intent Detected', subtitle: 'Identified category with 90% confidence', system: 'NLU_ENGINE', color: 'green' },
  { time: '00:45', title: 'Entity Extraction', subtitle: 'Location and issue specifics extracted', system: 'LLM_TRIAGE', color: 'green' },
  { time: '01:12', title: 'Ticket Created', subtitle: 'CRM sequence initiated for target area', system: 'CRM_API', color: 'green' },
  { time: '01:30', title: 'Resource Allocation', subtitle: 'Nearest supervisor notified via dashboard', system: 'DISPATCH_SYS', color: 'blue' },
  { time: '02:15', title: 'Verification Step', subtitle: 'AI confirmed details with caller', system: 'CONV_AI', color: 'purple' },
  { time: '03:00', title: 'Resolution Confirmed', subtitle: 'Case marked as resolved in system', system: 'FINAL_EXIT', color: 'green' },
];

// Helper: get call by ID
export const getCallById = (callId: string): CallLog | undefined =>
  calls.find(c => c.callId === callId);

// Helper: get agent by ID  
export const getAgentById = (agentId: string): Agent | undefined =>
  agents.find(a => a.id === agentId.toUpperCase());

// Helper: get district by ID
export const getDistrictById = (districtId: string): District | undefined =>
  districts.find(d => d.id === districtId);

// Helper: get category by ID
export const getCategoryById = (categoryId: string): Category | undefined =>
  categories.find(c => c.id === categoryId);

// Helper: get escalation by call ID
export const getEscalationByCallId = (callId: string): EscalationItem | undefined =>
  escalations.find(e => e.callId === callId);
