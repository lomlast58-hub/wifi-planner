export function isValidIPv4(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && (part === '0' || !part.startsWith('0'));
  });
}

export function ipToNumber(ip: string): number {
  return ip
    .trim()
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;
  const num = ipToNumber(mask);
  // In a valid subnet mask, the binary representation is a sequence of 1s followed by 0s
  const inverted = (~num) >>> 0;
  return ((inverted + 1) & inverted) === 0;
}

export function maskToCidr(mask: string): number {
  if (!isValidIPv4(mask)) return 24;
  const num = ipToNumber(mask);
  let count = 0;
  for (let i = 0; i < 32; i++) {
    if ((num & (1 << (31 - i))) !== 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function cidrToMask(cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return numberToIp(mask);
}

export function getNetworkAddress(ip: string, mask: string): string {
  if (!isValidIPv4(ip) || !isValidSubnetMask(mask)) return '';
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(mask);
  return numberToIp((ipNum & maskNum) >>> 0);
}

export function getBroadcastAddress(ip: string, mask: string): string {
  if (!isValidIPv4(ip) || !isValidSubnetMask(mask)) return '';
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(mask);
  const wildcard = (~maskNum) >>> 0;
  return numberToIp((ipNum | wildcard) >>> 0);
}

export function areInSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!isValidIPv4(ip1) || !isValidIPv4(ip2) || !isValidSubnetMask(mask)) return false;
  return getNetworkAddress(ip1, mask) === getNetworkAddress(ip2, mask);
}

export function getSubnetDetails(ip: string, mask: string) {
  if (!isValidIPv4(ip) || !isValidSubnetMask(mask)) {
    return null;
  }
  const cidr = maskToCidr(mask);
  const network = getNetworkAddress(ip, mask);
  const broadcast = getBroadcastAddress(ip, mask);
  const netNum = ipToNumber(network);
  const bcastNum = ipToNumber(broadcast);

  const firstUsable = cidr >= 31 ? network : numberToIp(netNum + 1);
  const lastUsable = cidr >= 31 ? broadcast : numberToIp(bcastNum - 1);
  const totalHosts = Math.max(0, bcastNum - netNum - 1);

  return {
    cidr,
    network,
    broadcast,
    firstUsable,
    lastUsable,
    totalHosts,
  };
}
