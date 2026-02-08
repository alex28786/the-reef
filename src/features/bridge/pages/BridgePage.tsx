import { Routes, Route } from 'react-router-dom'
import { BridgeOverview } from '../components/BridgeOverview'
import { NewBridgeMessage } from '../components/NewBridgeMessage'
import { BridgeMessageDetail } from '../components/BridgeMessageDetail'

export function BridgePage() {
    return (
        <div className="py-6">
            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🦭</div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">The Bridge</h1>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Let Seal guide you through expressing your feelings
                </p>
            </div>

            <Routes>
                <Route index element={<BridgeOverview />} />
                <Route path="new" element={<NewBridgeMessage />} />
                <Route path=":messageId" element={<BridgeMessageDetail />} />
            </Routes>
        </div>
    )
}
