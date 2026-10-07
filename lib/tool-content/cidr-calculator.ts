import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This CIDR calculator (also called a subnet calculator) takes an IPv4 address with a prefix length, such as 192.168.1.10/24, and works out everything about the block it belongs to: the network address, broadcast address, subnet mask, wildcard mask, first and last usable host, and how many addresses the block contains.',
    'It is useful when you are planning a home or office network, writing firewall rules or cloud security groups, or just double-checking that two ranges do not overlap. Results update as you type and each value has its own copy button. The maths is done in your browser.',
  ],
  steps: [
    'Type an address and prefix into the IPv4 CIDR field, for example 10.0.0.0/16 or 192.168.1.10/24.',
    'Read the results: Network, Broadcast, Netmask, Wildcard, First host, Last host, Total addresses and Usable hosts.',
    'Click the copy button next to any row to copy just that value.',
    'Change the prefix number to compare how big different subnets are.',
  ],
  faq: [
    {
      q: 'What does the /24 in CIDR notation mean?',
      a: 'It is the prefix length: how many of the 32 bits in an IPv4 address identify the network. A /24 leaves 8 bits for hosts, giving 256 addresses and a subnet mask of 255.255.255.0. Each step down (/23, /22 and so on) doubles the size of the block.',
    },
    {
      q: 'Why are usable hosts two fewer than total addresses?',
      a: 'In a normal subnet the first address is the network address and the last is the broadcast address, so neither is assigned to a device. The calculator subtracts those two. The exceptions are /31, where both addresses are usable for point-to-point links (RFC 3021), and /32, which is a single host.',
    },
    {
      q: 'Can I enter any IP inside the subnet, not just the network address?',
      a: 'Yes. Enter any address with a prefix and the calculator masks it to find the network it belongs to. For example 192.168.1.77/26 gives the network 192.168.1.64.',
    },
    {
      q: 'What is a wildcard mask?',
      a: 'It is the subnet mask with every bit flipped, so 255.255.255.0 becomes 0.0.0.255. Cisco access lists and some OSPF settings use wildcard masks instead of subnet masks.',
    },
    {
      q: 'Does it support IPv6?',
      a: 'No, this subnet calculator handles IPv4 only. It also requires the prefix, so an address without a slash and a number from 0 to 32 shows an error.',
    },
  ],
}

export default content
