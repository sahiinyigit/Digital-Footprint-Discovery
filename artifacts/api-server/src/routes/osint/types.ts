export interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface WhoisData {
  registrar?: string;
  registrantOrg?: string;
  registrantCountry?: string;
  createdDate?: string;
  expiresDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  emails?: string[];
}

export interface ShodanService {
  port: number;
  transport?: string;
  product?: string;
  version?: string;
  banner?: string;
  cpe?: string[];
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
  status?: number;
  title?: string;
}

export interface BlacklistResult {
  listed: boolean;
  listCount?: number;
  lists?: string[];
  details?: string;
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
  errors?: Record<string, string>;
}
