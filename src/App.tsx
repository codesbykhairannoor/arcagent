import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import Navbar, { type NavRoute } from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import AgentRegistryPage from './pages/AgentRegistryPage'
import DashboardPage from './pages/DashboardPage'
import DeveloperStudioPage from './pages/DeveloperStudioPage'
import VerifierPage from './pages/VerifierPage'
import CreateEscrowModal from './components/CreateEscrowModal'
import EscrowDetailModal from './components/EscrowDetailModal'
import CreateMilestoneJobModal from './components/CreateMilestoneJobModal'
import MilestoneJobDetailModal from './components/MilestoneJobDetailModal'
import EditProfileModal from './components/EditProfileModal'
import NetworkTicker from './components/NetworkTicker'
import {
  useUsdcBalance,
  usePendingWithdrawal,
  useClientEscrows,
  useWorkerEscrows,
  useEvaluatorEscrows,
  useEscrows,
  type EscrowData,
} from './components/useEscrowData'
import { useClientJobs, useWorkerJobs, useJobs, type JobData } from './components/useMilestoneData'
import { useCircleWallet } from './components/CircleWalletLogin'

function getInitialRoute(): NavRoute {
  // Support both clean pathname (/verifier) and legacy hash (#/verifier)
  const path = window.location.pathname.replace(/^\//, '').toLowerCase()
  if (path === 'marketplace') return 'marketplace'
  if (path === 'agents' || path === 'registry') return 'agents'
  if (path === 'dashboard' || path === 'workspace') return 'dashboard'
  if (path === 'developer' || path === 'playground' || path === 'studio') return 'developer'
  if (path === 'verifier') return 'verifier'

  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase()
  if (hash === 'marketplace') return 'marketplace'
  if (hash === 'agents' || hash === 'registry') return 'agents'
  if (hash === 'dashboard' || hash === 'workspace') return 'dashboard'
  if (hash === 'developer' || hash === 'playground' || hash === 'studio') return 'developer'
  if (hash === 'verifier') return 'verifier'
  return 'home'
}

export default function App() {
  const { address: wagmiAddress, isConnected } = useAccount()
  const { address: circleAddress } = useCircleWallet()
  const address = wagmiAddress ?? circleAddress ?? undefined

  const [currentRoute, setCurrentRoute] = useState<NavRoute>(getInitialRoute)

  // Modals state
  const [showCreate, setShowCreate] = useState(false)
  const [prefilledWorker, setPrefilledWorker] = useState<string | undefined>(undefined)
  const [showCreateMilestone, setShowCreateMilestone] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowData | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null)

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const onLocationChange = () => {
      setCurrentRoute(getInitialRoute())
    }
    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('hashchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
    }
  }, [])

  const handleNavigate = (route: NavRoute) => {
    setCurrentRoute(route)
    const targetPath = route === 'home' ? '/' : `/${route}`
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Blockchain queries
  const { formatted: balanceFmt, refetch: refetchBalance } = useUsdcBalance(address)
  const { refetch: refetchPending } = usePendingWithdrawal(address)
  const { ids: clientIds, refetch: refetchClient } = useClientEscrows(address)
  const { ids: workerIds, refetch: refetchWorker } = useWorkerEscrows(address)
  const { ids: evalIds, refetch: refetchEval } = useEvaluatorEscrows(address)
  const { ids: clientJobIds, refetch: refetchClientJobs } = useClientJobs(address)
  const { ids: workerJobIds, refetch: _refetchWorkerJobs } = useWorkerJobs(address)

  const allJobIds = useMemo(() => [...new Set([...clientJobIds, ...workerJobIds])], [clientJobIds, workerJobIds])
  const combinedEscrowIds = useMemo(() => [...new Set([...clientIds, ...workerIds, ...evalIds])], [clientIds, workerIds, evalIds])

  const { refetch: refetchEscrows } = useEscrows(combinedEscrowIds)
  const { refetch: refetchJobs } = useJobs(allJobIds)

  const totalUserContracts = clientIds.length + workerIds.length + evalIds.length + allJobIds.length

  const handleHireAgent = (workerAddress: string) => {
    setPrefilledWorker(workerAddress)
    setShowCreate(true)
  }

  const handleOpenCreateEscrow = () => {
    setPrefilledWorker(undefined)
    setShowCreate(true)
  }

  const handleCreatedEscrow = useCallback(() => {
    void refetchClient()
    void refetchBalance()
    void refetchEscrows()
    handleNavigate('dashboard')
  }, [refetchClient, refetchBalance, refetchEscrows])

  const handleCreatedMilestone = useCallback(() => {
    void refetchClientJobs()
    void refetchBalance()
    void refetchJobs()
    handleNavigate('dashboard')
  }, [refetchClientJobs, refetchBalance, refetchJobs])

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* ── Sticky Top Header (Navbar + Live Telemetry Marquee) ──────── */}
      <div className="sticky top-0 z-40 w-full shadow-sm">
        <Navbar
          currentRoute={currentRoute}
          onRouteChange={handleNavigate}
          onOpenCreateEscrow={handleOpenCreateEscrow}
          onOpenCreateMilestone={() => setShowCreateMilestone(true)}
          onOpenEditProfile={() => setShowEditProfile(true)}
          address={address}
          isConnected={!!(isConnected || circleAddress)}
          totalUserContracts={totalUserContracts}
        />
        <NetworkTicker />
      </div>

      {/* ── Page Routing Content ──────────────────────────────────────── */}
      {currentRoute === 'home' && (
        <HomePage
          onNavigate={handleNavigate}
          isConnected={!!(isConnected || circleAddress)}
          address={address}
          balanceFmt={balanceFmt}
        />
      )}

      {currentRoute === 'marketplace' && (
        <MarketplacePage
          onSelectEscrow={(escrow) => setSelectedEscrow(escrow)}
          onSelectJob={(job) => setSelectedJob(job)}
          onOpenCreateEscrow={handleOpenCreateEscrow}
          onOpenCreateMilestone={() => setShowCreateMilestone(true)}
          clientIds={clientIds}
          workerIds={workerIds}
          allJobIds={allJobIds}
          isConnected={!!(isConnected || circleAddress)}
        />
      )}

      {currentRoute === 'agents' && (
        <AgentRegistryPage
          onHireAgent={handleHireAgent}
          isConnected={!!(isConnected || circleAddress)}
        />
      )}

      {currentRoute === 'dashboard' && (
        <DashboardPage
          onSelectEscrow={(escrow) => setSelectedEscrow(escrow)}
          onSelectJob={(job) => setSelectedJob(job)}
          onOpenCreateEscrow={handleOpenCreateEscrow}
          onOpenCreateMilestone={() => setShowCreateMilestone(true)}
          onOpenEditProfile={() => setShowEditProfile(true)}
          address={address}
          isConnected={!!(isConnected || circleAddress)}
        />
      )}

      {currentRoute === 'developer' && <DeveloperStudioPage />}

      {currentRoute === 'verifier' && <VerifierPage />}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Footer onNavigate={handleNavigate} />

      {/* ── Global Escrow & Milestone Modals ──────────────────────────── */}
      {showCreate && (
        <CreateEscrowModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreatedEscrow}
          initialWorker={prefilledWorker}
        />
      )}

      {showCreateMilestone && (
        <CreateMilestoneJobModal
          onClose={() => setShowCreateMilestone(false)}
          onCreated={handleCreatedMilestone}
        />
      )}

      {selectedEscrow && (
        <EscrowDetailModal
          escrow={selectedEscrow}
          onClose={() => setSelectedEscrow(null)}
          onAction={() => {
            void refetchBalance()
            void refetchPending()
            void refetchClient()
            void refetchWorker()
            void refetchEval()
            void refetchEscrows()
            setSelectedEscrow(null)
          }}
        />
      )}

      {selectedJob && (
        <MilestoneJobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAction={() => {
            void refetchBalance()
            void refetchJobs()
          }}
        />
      )}

      {/* Global Edit Profile Modal */}
      {address && (
        <EditProfileModal
          address={address}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  )
}
