export interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface WhoisData {
  registrar?: string;
  registrantOrg?: string;
  registrantCountry?: string;
  registrantName?: string;
  registrantEmail?: string;
  registrantPhone?: string;
  createdDate?: string;
  expiresDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  emails?: string[];
  rawText?: string;
}

export interface ShodanService {
  port: number;
  transport?: string;
  product?: string;
  version?: string;
  banner?: string;
  cpe?: string[];
  vulnIds?: string[];
}

export interface ShodanHost {
  ip?: string;
  org?: string;
  isp?: string;
  country?: string;
  city?: string;
  os?: string;
  ports?: number[];
  vulns?: string[];
  tags?: string[];
  hostnames?: string[];
  services?: ShodanService[];
  asn?: string;
  lastUpdate?: string;
  latitude?: number;
  longitude?: number;
}

export interface EmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  confidence?: number;
  sources?: string[];
  linkedin?: string;
}

export interface EmailStats {
  total?: number;
  pattern?: string;
  organization?: string;
}

export interface SubdomainResult {
  subdomain: string;
  ip?: string;
  source?: string;
}

export interface BlacklistResult {
  listed: boolean;
  listCount?: number;
  lists?: string[];
  details?: string;
  checkedIp?: string;
}

export interface TechnologyResult {
  name: string;
  category?: string;
  version?: string;
  confidence?: number;
  website?: string;
}

export interface IpNetblockResult {
  ip?: string;
  netblock?: string;
  asn?: string;
  asnName?: string;
  country?: string;
  org?: string;
}

export interface SslCertificate {
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  sans?: string[];
  signatureAlgorithm?: string;
  serialNumber?: string;
  grade?: string;
  issues?: string[];
}

export interface SecurityHeader {
  name: string;
  present: boolean;
  value?: string;
  severity: "ok" | "warning" | "critical" | "info";
  description?: string;
}

export interface SecurityHeadersResult {
  grade?: string;
  score?: number;
  headers?: SecurityHeader[];
  serverInfo?: string;
  redirectsToHttps?: boolean;
  finalUrl?: string;
}

export interface BreachResult {
  name: string;
  domain?: string;
  breachDate?: string;
  addedDate?: string;
  description?: string;
  dataClasses?: string[];
  isVerified?: boolean;
  isFabricated?: boolean;
  isSensitive?: boolean;
  pwCount?: number;
  logoPath?: string;
}

export interface PassiveDnsEntry {
  hostname: string;
  ip?: string;
  first?: string;
  last?: string;
}

export interface ThreatIntelResult {
  riskScore?: number;
  maliciousCount?: number;
  suspiciousCount?: number;
  pulseCount?: number;
  tags?: string[];
  malwareFamilies?: string[];
  passiveDns?: PassiveDnsEntry[];
  reputationScore?: number;
}

export interface ScanResult {
  target: string;
  scanType: "domain" | "ip";
  timestamp: string;
  dns?: DnsRecord[];
  whois?: WhoisData;
  shodan?: ShodanHost[];
  subdomains?: SubdomainResult[];
  emails?: EmailResult[];
  emailStats?: EmailStats;
  blacklist?: BlacklistResult;
  technologies?: TechnologyResult[];
  ipNetblocks?: IpNetblockResult[];
  sslCertificate?: SslCertificate;
  securityHeaders?: SecurityHeadersResult;
  breaches?: BreachResult[];
  threatIntel?: ThreatIntelResult;
  errors?: Record<string, string>;
}
