// Domain & Name Hunter inspired by WhiteBite/Domain-Hunter & christabor/namebot
// Checks DNS-over-HTTPS (DoH) and RDAP for domain availability

interface DomainCheckResult {
  domain: string
  available: boolean
  status: string
}

async function checkDoH(domain: string): Promise<DomainCheckResult> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=SOA`, {
      headers: { Accept: 'application/dns-json' },
    })
    if (!res.ok) {
      return { domain, available: false, status: `HTTP ${res.status}` }
    }
    const data = await res.json()
    // Status 3 = NXDOMAIN (Domain not registered in root/TLD DNS)
    // Status 0 = NOERROR (Domain registered and resolved)
    // Status 2 = SERVFAIL
    if (data.Status === 3) {
      return { domain, available: true, status: 'AVAILABLE (NXDOMAIN)' }
    } else if (data.Status === 0) {
      return { domain, available: false, status: 'TAKEN (NOERROR)' }
    } else {
      return { domain, available: false, status: `Status ${data.Status}` }
    }
  } catch (err) {
    return { domain, available: false, status: `Error: ${err}` }
  }
}

// Candidates based on linguistic morphemes:
// Roots: Pact, Lex, Stipul, Settle, Auton, Syn, Proof, Arc, Fides, Nexus
const CANDIDATES = [
  'autopact',
  'pactum',
  'pacta',
  'stipula',
  'nexum',
  'syntrix',
  'proofpact',
  'arcpact',
  'veripact',
  'taskora',
  'swarmlp',
  'swarmpact',
  'escro',
  'escron',
  'kinetix',
  'pactifi',
  'agenix',
  'agentpact',
  'trustor',
  'aequitas',
]

const TLDS = ['network', 'xyz', 'io', 'tech', 'fi', 'ai']

async function main() {
  console.log('=== HUNTING AVAILABLE DOMAINS FOR CANDIDATES ===\n')

  const results: { candidate: string; availableTlds: string[]; takenTlds: string[] }[] = []

  for (const name of CANDIDATES) {
    const availableTlds: string[] = []
    const takenTlds: string[] = []

    for (const tld of TLDS) {
      const domain = `${name}.${tld}`
      const check = await checkDoH(domain)
      if (check.available) {
        availableTlds.push(`.${tld}`)
      } else {
        takenTlds.push(`.${tld}`)
      }
      // Small pause to be gentle to DNS resolver
      await new Promise((r) => setTimeout(r, 60))
    }

    results.push({ candidate: name, availableTlds, takenTlds })
  }

  console.log('\n--- CANDIDATE RESULTS ---')
  for (const r of results) {
    console.log(`\n🔹 [${r.candidate.toUpperCase()}]`)
    console.log(`   Available TLDs: ${r.availableTlds.length > 0 ? r.availableTlds.join(', ') : 'None'}`)
    console.log(`   Taken: ${r.takenTlds.join(', ')}`)
  }
}

main().catch(console.error)
